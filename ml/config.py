
import os
from pathlib import Path

from dotenv import load_dotenv

# Централизованный конфигурационный файл.

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / "LLM_key.env")
load_dotenv(PROJECT_ROOT / ".env")

#  Yandex Cloud 
# FOLDER_ID = os.getenv("YANDEX_FOLDER_ID")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-v4-flash:free")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

#if not FOLDER_ID:
#    raise ValueError("Не задан YANDEX_FOLDER_ID в .env")
if not OPENROUTER_API_KEY:
    raise ValueError("Не задан OPENROUTER_API_KEY в .env")

# URL совместимого с OpenAI API (из Яндекс Клауда)
LLM_BASE_URL = "https://openrouter.ai/api/v1"

FULL_MODEL_NAME = OPENROUTER_MODEL

# Настройки генерации 
TEMPERATURE = 0.2      # низкая температура -  более стабильные и предсказуемые ответы
MAX_TOKENS = 4096      # максимальная длина ответа модели
STREAMING = False       # выключаем стриминг отображения прогресса

# Параллельная обработка 
MAX_CONCURRENT = 1     # максимальное количество одновременных запросов к API. на  MVP ставим один

# Пути к файлам 
INPUT_CSV = "responses.csv"              # входной CSV с ответами для теста
OUTPUT_CSV = "output/analysis_results.csv"  # итоговый файл с результатами
OUTPUT_DIR = "output"                    # директория для результатов

# CSV-структура
# Имена колонок во входном файле (можно переопределить)
QUESTION_COLUMN = "question"   # колонка с текстом вопроса (или ID вопроса)
ANSWER_COLUMN = "answer"       # колонка с текстом ответа