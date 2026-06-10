"""
Только для локальной работы и теста. Для работы с API данный файл не нужен.
Загрузка и предобработка CSV-файла с ответами.
Группирует ответы по вопросам, обрабатывает ID вопросов (если нужно).
"""

import pandas as pd
from typing import Dict, List, Optional
import config as cfg


def load_responses(
    filepath: str = cfg.INPUT_CSV,
    question_col: str = cfg.QUESTION_COLUMN,
    answer_col: str = cfg.ANSWER_COLUMN,
    question_map: Optional[Dict[str, str]] = None
) -> Dict[str, List[str]]:
    """
    Читает CSV-файл и группирует ответы по вопросам.
    
    Аргументы:
        filepath: путь к CSV-файлу.
        question_col: название колонки с вопросом/ID вопроса.
        answer_col: название колонки с ответом.
        question_map: словарь {ID вопроса: текст вопроса}, если в CSV хранятся ID, а не текст.
    
    Возвращает:
        Словарь {текст_вопроса: [ответ1, ответ2, ...]}.
    
    Исключения:
        FileNotFoundError: если файл не найден.
        KeyError: если указанные колонки отсутствуют в CSV.
    """
    # Чтение CSV
    df = pd.read_csv(filepath, sep=';')
    
    # Проверка наличия нужных колонок
    # СДЕЛАТЬ ПРОПУСК В ИТОГОВОМ ВАРИАНТЕ

    if question_col not in df.columns:
        raise KeyError(f"Колонка '{question_col}' не найдена в файле. Доступные колонки: {df.columns.tolist()}")
    if answer_col not in df.columns:
        raise KeyError(f"Колонка '{answer_col}' не найдена в файле. Доступные колонки: {df.columns.tolist()}")
    
    # Если предоставлен словарь с расшифровкой ID вопросов, заменяем ID на текст
    if question_map:
        df[question_col] = df[question_col].map(question_map).fillna(df[question_col])
    
    # Группировка ответов по вопросу
    # Отбрасываем пустые ответы (NaN)
    df = df.dropna(subset=[answer_col])
    
    grouped = df.groupby(question_col)[answer_col].apply(list).to_dict()
    
    # УДАЛИТЬ
    print(f"Загружено {len(grouped)} вопросов, всего {len(df)} ответов.")
    return grouped