# server.py

from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from llm_client import analyze_all_questions
from prompts.assembler import build_messages
from saver import remove_csv_block
import csv
from io import StringIO

app = FastAPI()

# Модели 
class PollPage(BaseModel):
    pageOrder: int
    question: str
    questionType: str
    required: bool = True

class Poll(BaseModel):
    title: str
    pages: List[PollPage]

class ResponseItem(BaseModel):
    answer: str

class SummarizeRequest(BaseModel):
    poll: Poll
    responses: List[ResponseItem]

class SummarizeResponse(BaseModel):
    summary: str
    csv_data: Optional[str] = None   # поле для CSV

# Health check 
@app.get("/health")
def health():
    return {"status": "ok"}

# Суммаризация 
@app.post("/summarize", response_model=SummarizeResponse)
async def summarize(request: SummarizeRequest):
    # Ищем текстовые вопросы
    text_questions = [q for q in request.poll.pages]
    if not text_questions:
        return SummarizeResponse(summary="Нет открытых вопросов для анализа.")

    # Берём первый текстовый вопрос
    question = text_questions[0].question

    # Собираем ответы
    answers = [r.answer for r in request.responses if r.answer.strip()]
    if not answers:
        return SummarizeResponse(summary="Нет ответов для анализа.")

    grouped = {question: answers}

    try:
        results = await analyze_all_questions(
            grouped_answers=grouped,
            messages_builder=build_messages,
            max_concurrent=1
        )

        analysis = results[0].get("analysis", "")
        clean_summary = remove_csv_block(analysis)

        # Формируем CSV-строку из csv_rows
        csv_rows = results[0].get("csv_rows", [])
        csv_str = None
        if csv_rows and len(csv_rows) > 1:   # первая строка — заголовок
            output = StringIO()
            writer = csv.writer(output)
            writer.writerows(csv_rows)
            csv_str = output.getvalue()

        return SummarizeResponse(
            summary=clean_summary,
            csv_data=csv_str
        )

    except Exception as e:
        return SummarizeResponse(
            summary=f"Ошибка анализа: {str(e)}",
            csv_data=None
        )