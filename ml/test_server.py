# test_server.py
import requests
import pandas as pd

# Читаем CSV с ответами (тот же, что и раньше)
df = pd.read_csv("responses.csv", sep=";")
question = df["question"].iloc[0]
answers = df["answer"].tolist()

payload = {
    "poll": {
        "title": question,
        "pages": [
            {
                "pageOrder": 1,
                "question": question,
                "questionType": "TEXT",
                "required": True
            }
        ]
    },
    "responses": [{"answer": a} for a in answers]
}

resp = requests.post("http://localhost:8000/summarize", json=payload)
data = resp.json()

# Выводим текстовый отчёт
print(data["summary"])

# Сохраняем CSV, если он есть
if data.get("csv_data"):
    with open("analysis_result.csv", "w", encoding="utf-8-sig") as f:
        f.write(data["csv_data"])
    print("\nCSV сохранён в analysis_result.csv")
else:
    print("\nCSV-данные отсутствуют в ответе.")