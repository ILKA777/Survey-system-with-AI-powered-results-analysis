# PulseRoom — система опросов с AI-аналитикой

Платформа для опросов и голосований: организатор создаёт опрос, участники проходят его
по короткому коду комнаты (или QR), а результаты собираются и анализируются в реальном
времени. Проект состоит из трёх частей — фронтенд, бэкенд и ML-сервис.

**Живой фронтенд:** https://pulseroom-five.vercel.app

## Архитектура

```
Браузер
  │
  ▼
Фронтенд (React + Vite, Vercel)
  │   запросы на /api/* (прокси, без CORS)
  ▼
Бэкенд (Java Spring Boot, Render)  ←→  PostgreSQL
  │   AI-вызовы
  ▼
ML-сервис (Python FastAPI)  — генерация/саммаризация
```

Фронт никогда не ходит в бэкенд по абсолютному URL — он зовёт `/api/*` относительно
своего домена, а проксирование на бэкенд делает Vite (в деве) и `vercel.json` (в проде).
Это убирает проблемы с CORS.

## Структура репозитория

```
src/            # Фронтенд (React 19 + Vite 8)
  api/          #   слой данных: http, auth, polls, responses, results, ai
  components/   #   Layout и общие компоненты
  context/      #   PollContext — глобальное состояние
  pages/        #   Welcome, Login, Dashboard, CreatePoll, CreateVote, PollDetail, Join, Thanks, Analytics
  config/       #   фича-флаги
  test/         #   настройка тестов и хелперы
backend/        # Бэкенд (Java 17, Spring Boot 3, Maven)
ml/             # ML-сервис (Python 3.11, FastAPI)
docs/           # документация и спецификации
api-docs.yaml   # OpenAPI-описание REST API бэкенда
```

## Возможности

- Создание опросов и голосований вручную или по шаблону
- Коды комнат — участники заходят по короткому коду (например `ABC12`) без регистрации
- QR-код для быстрого шаринга
- Результаты в реальном времени: столбчатые диаграммы и процентные бары
- AI-саммари по ответам участников (через ML-сервис)
- Экспорт результатов в CSV и JSON
- Дашборд организатора: статусы опросов (Черновик → Опубликован → Закрыт)
- Страница аналитики с агрегированной статистикой

## Запуск

### Фронтенд

```bash
npm install
npm run dev          # дев-сервер на http://localhost:5173
```

`/api/*` в деве проксируется на бэкенд (настроено в `vite.config.js`).
По умолчанию `VITE_API_URL` пустой — фронт ходит на `/api/*` относительно.

Сборка прода: `npm run build` · превью: `npm run preview`.

### Бэкенд (`backend/`)

Java 17, Spring Boot 3, сборка через Maven.

```bash
cd backend
./mvnw spring-boot:run        # http://localhost:8080
```

REST API описан в `api-docs.yaml` (Swagger UI: `/swagger-ui.html`). Группы ручек:
авторизация (`/api/auth/*`), админ-опросы (`/api/admin/polls/*`, токен `X-Auth-Token`),
прохождение участником (`/api/participant/*`). Детали деплоя — `backend/DEPLOY_RENDER.md`.

### ML-сервис (`ml/`)

Python 3.11, FastAPI.

```bash
cd ml
pip install -r requirements.txt
uvicorn server:app --port 8001
```

Эндпоинты: `POST /summarize` (саммаризация ответов) и `GET /health`. Бэкенд вызывает
ML по URL из переменной `AI_SERVICE_URL` при `AI_ENABLED=true`.

## Тесты

Фронтенд покрыт автотестами на **Vitest + React Testing Library** — 26 тестов
(API-слой и ключевые страницы).

```bash
npm test             # watch-режим
npm run test:run     # разовый прогон (для CI)
```

- **API-слой** — проверяют, что запросы уходят на правильные эндпоинты с нужными
  заголовками/телом и что ответы и ошибки обрабатываются корректно.
- **Компоненты** — рендерят страницы (Login, CreatePoll, Join, PollDetail), эмулируют
  действия пользователя и проверяют поведение интерфейса.

Бэкенд содержит свои тесты (unit/integration/system) в `backend/src/test`.

## Деплой

- **Фронтенд** — Vercel (`pulseroom-five.vercel.app`). `vercel.json` проксирует
  `/api/*` на бэкенд и отдаёт `index.html` для SPA-роутов.
- **Бэкенд** — Render (Docker + PostgreSQL), Blueprint в `backend/render.yaml`.
- **ML-сервис** — Render (`ml/render.yaml`).

## Стек

- Фронт: React 19, Vite 8, react-router, Chart.js, собственная дизайн-система на CSS
- Бэк: Java 17, Spring Boot 3, PostgreSQL
- ML: Python 3.11, FastAPI
