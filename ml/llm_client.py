# llm_client.py

import asyncio
from openai import AsyncOpenAI
from typing import List, Dict
import config as cfg
import re
import csv
from io import StringIO

# Инициализация OpenAI-совместимого клиента для Yandex Cloud
client = AsyncOpenAI(
    base_url=cfg.LLM_BASE_URL,
    api_key=cfg.OPENROUTER_API_KEY,
    default_headers={
        "X-Title": "My ML Analysis Service",     # название 
    }
)

# 

async def analyze_single_question(
    question: str,
    answers: List[str],
    messages: List[Dict[str, str]],
    max_retries: int = 3
) -> Dict:
    """Отправляет запрос к YandexGPT через OpenAI-совместимый API."""
    result = {
        "question": question,
        "analysis": "",
        "csv_rows": [],
        "tokens": None,
        "error": None,
    }

    for attempt in range(max_retries):
        try:
            print(f"  [{question[:50]}...] Запрос (попытка {attempt+1}/{max_retries})...")

            response = await client.chat.completions.create(
                model=cfg.OPENROUTER_MODEL,
                messages=messages,
                temperature=cfg.TEMPERATURE,
                max_tokens=cfg.MAX_TOKENS,
                stream=False,
            )

            full_content = response.choices[0].message.content
            print(f"  [{question[:50]}...] Получено {len(full_content)} символов.")
            result["analysis"] = full_content

            # Извлекаем CSV
            result["csv_rows"] = extract_csv_from_response(full_content)

            if not result["csv_rows"]:
                print(f"  ⚠️ CSV не найден в ответе, попытка {attempt+1}")
                if attempt < max_retries - 1:
                    continue

            return result

        except Exception as e:
            print(f"  [{question[:50]}...] Ошибка: {e}")
            result["error"] = str(e)
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt
                print(f"  Повтор через {wait_time} сек...")
                await asyncio.sleep(wait_time)

    return result


def extract_csv_from_response(text: str) -> List[List[str]]:
    """Извлекает CSV-таблицу из ответа модели."""
    if not text:
        return []
    pattern = r'```csv\s*\n(.*?)\n```'
    match = re.search(pattern, text, re.DOTALL)
    if not match:
        return []
    csv_content = match.group(1).strip()
    rows = []
    reader = csv.reader(StringIO(csv_content))
    for row in reader:
        if any(cell.strip() for cell in row):
            rows.append(row)
    return rows


async def analyze_all_questions(
    grouped_answers: Dict[str, List[str]],
    messages_builder,
    max_concurrent: int = cfg.MAX_CONCURRENT
) -> List[Dict]:
    """Асинхронно обрабатывает все вопросы с ограничением параллельных запросов."""
    semaphore = asyncio.Semaphore(max_concurrent)

    async def process_with_limit(question, answers):
        async with semaphore:
            messages = messages_builder(question, answers)
            return await analyze_single_question(question, answers, messages)

    tasks = [
        process_with_limit(question, answers)
        for question, answers in grouped_answers.items()
    ]

    print(f"\nЗапуск анализа {len(tasks)} вопросов (макс. {max_concurrent} одновременно)...")
    results = await asyncio.gather(*tasks)
    print(f"Анализ завершён. Обработано {len(results)} вопросов.")
    return list(results)