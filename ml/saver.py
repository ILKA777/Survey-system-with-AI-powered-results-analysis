# saver.py

import os
import csv
import re
from typing import List, Dict, Optional
from datetime import datetime
import config as cfg


def remove_csv_block(text: str) -> str:
    """
    Удаляет из текста блок, обёрнутый в ```csv ... ```.
    Возвращает текст без этого блока.
    """
    pattern = r'```csv\s*\n.*?\n```'
    cleaned = re.sub(pattern, '', text, flags=re.DOTALL)
    return cleaned.strip()


def save_results(
    results: List[Dict],
    output_dir: str = cfg.OUTPUT_DIR,
    survey_id: Optional[str] = None
):
    """
    Сохраняет результаты анализа:
    1. Объединённый CSV со всеми метриками из ответов модели.
    2. Текстовые файлы с отчётом (без CSV-части).

    Аргументы:
        results: список словарей с результатами (из llm_client.analyze_all_questions).
        output_dir: директория для сохранения.
        survey_id: опциональный номер опроса, добавляется в имя CSV.
    """
    os.makedirs(output_dir, exist_ok=True)

    # Сохранение CSV-метрик 
    all_csv_rows = []
    for result in results:
        question = result.get("question", "")
        csv_rows = result.get("csv_rows", [])
        if csv_rows:
            # Пропускаем первую строку (заголовок), добавляем вопрос
            for row in csv_rows[1:]:
                all_csv_rows.append([question] + row)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    if survey_id:
        csv_filename = f"all_metrics_survey{survey_id}_{timestamp}.csv"
    else:
        csv_filename = f"all_metrics_{timestamp}.csv"
    csv_path = os.path.join(output_dir, csv_filename)

    with open(csv_path, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["Вопрос", "Метрика", "Категория", "Количество", "ID ответов"])
        writer.writerows(all_csv_rows)

    # Сохранение текстовых отчётов 
    reports_dir = os.path.join(output_dir, "reports")
    os.makedirs(reports_dir, exist_ok=True)

    for result in results:
        question = result.get("question", "unknown")
        analysis = result.get("analysis", "")
        error = result.get("error")

        # Безопасное имя файла
        safe_name = "".join(
            c if c.isalnum() or c in " _-()" else "_" for c in question
        )[:80]
        report_path = os.path.join(reports_dir, f"{safe_name}_{timestamp}.txt")

        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(f"Вопрос: {question}\n")
            f.write(f"Дата анализа: {datetime.now().isoformat()}\n")
            f.write("=" * 60 + "\n\n")
            if error:
                f.write(f"ОШИБКА: {error}\n")
            else:
                # Убираем CSV-блок, оставляем только текстовый отчёт
                clean_analysis = remove_csv_block(analysis)
                f.write(clean_analysis)