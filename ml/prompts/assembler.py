
"""
Сборка сообщений для отправки в LLM API.
Формирует system-сообщение из готового промта и user-сообщения (с XML-изоляцией данных).
"""

from .system_prompt import SYSTEM_PROMPT
from typing import List, Dict
import xml.sax.saxutils as saxutils


def build_user_message(question: str, answers: List[str]) -> str:
    """
    Формирует user-сообщение с XML-изоляцией вопроса и ответов.
    
    Аргументы:
        question: текст вопроса (строка).
        answers: список ответов респондентов.
    
    Возвращает:
        Строку с XML-разметкой для вставки в user-сообщение.
    """
    safe_question = saxutils.escape(question)
    # Формируем XML для каждого ответа с атрибутом id
    answers_xml = "\n".join(
        f'  <answer id="{i+1}">{saxutils.escape(a)}</answer>'
        for i, a in enumerate(answers)
    )
    
    # Собираем итоговое сообщение
    return f"""<question>{safe_question}</question>

<answers>
{answers_xml}
</answers>"""


def build_messages(question: str, answers: List[str]) -> List[Dict[str, str]]:
    """
    Собирает полный массив messages для передачи в API.
    
    Аргументы:
        question: текст вопроса.
        answers: список ответов.
    
    Возвращает:
        Список словарей с ключами 'role' и 'content'.
    """
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": build_user_message(question, answers)}
    ]