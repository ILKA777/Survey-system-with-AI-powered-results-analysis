# PulseRoom — Redesign & Architecture Spec
**Date:** 2026-05-05  
**Scope:** Frontend redesign + Supabase integration + UX overhaul  
**Goal:** Презентабельный, задеплоенный продукт с чистым API-слоем для подключения Java-бэка и Python ML-модуля

---

## 1. Design System

### Цвета
```
--bg:        #0C0E14   /* холодный near-black */
--bg-2:      #141720
--bg-raised: #1C2030
--accent:    #6366F1   /* indigo — единственный акцент, без ротации */
--accent-h:  #4F52E0   /* hover */
--text:      #E8EAED
--text-2:    rgba(232,234,237,0.55)
--text-3:    rgba(232,234,237,0.32)
--border:    rgba(255,255,255,0.07)
--border-2:  rgba(255,255,255,0.12)
--green:     #22C55E
--amber:     #F59E0B
```

### Типографика
- **Manrope** (Google Fonts, кириллица) — всё: заголовки 700–800, текст 400–500
- **JetBrains Mono** — только данные: счётчики, коды, даты
- Playfair Display, Golos Text, Space Mono — удалить

### Карточки опросов
- Все карточки одного стиля: тёмный фон `#141720`, левая полоска 3px в `#6366F1`
- Никакой ротации цветов между карточками
- Заголовок опроса крупно, под ним мета (тип, кол-во ответов, статус) в mono

---

## 2. Информационная архитектура

### Маршруты

```
Публичные:
  /                    Landing — вход для админа + поле кода комнаты для участника
  /join/:roomCode      Участник проходит опрос/голосование
  /thanks              Экран "Спасибо" после прохождения

Админ (требует логина):
  /dashboard           Список опросов со статусами
  /create              Создание: три вкладки (Вручную | AI | Шаблон)
  /poll/:id            Детали: ссылка + QR + код комнаты + результаты + AI-анализ
  /analytics           Сводная аналитика
```

### Навигация
```
[PulseRoom logo]   Дашборд | Создать | Аналитика   [аватар / выйти]
```
Шаблоны убраны из навбара — они внутри `/create`.

---

## 3. User Flows

### Администратор
```
/ → войти (никнейм) → /dashboard
  → "Создать" → /create
    Вкладка 1: Вручную — форма добавления вопросов
    Вкладка 2: AI-генерация — промпт → генерируем опрос (мок)
    Вкладка 3: Из шаблона — выбрать → редактировать
  → Сохранить → /poll/:id
    • Ссылка для участников (/join/ABC123)
    • QR-код
    • Код комнаты (ABC123)
    • Кнопка "Опубликовать" (DRAFT → PUBLISHED)
    • Счётчик ответов в реальном времени
    • Результаты + AI-саммари (мок) — сразу на этой странице
```

### Участник
```
Получил ссылку /join/ABC123
  ИЛИ открыл / и ввёл код ABC123
→ Видит вопросы (один компонент на SURVEY и VOTE)
→ Отправил → /thanks
→ (опционально) кнопка "Смотреть результаты"
```

### Никита (Java backend, позже)
```
src/api/polls.js  — заменить Supabase-вызовы на fetch() к Java API
src/api/auth.js   — заменить на Java auth
Компоненты не трогает
```

### Иван (Python ML, позже)
```
src/api/ai.js     — заменить мок на fetch() к Python-сервису
Компоненты не трогают
```

---

## 4. Данные (Supabase)

### Таблицы

```sql
users
  id uuid primary key
  nickname text unique not null
  created_at timestamptz default now()

polls
  id uuid primary key
  type text not null              -- SURVEY | VOTE | QUIZ (UI только для SURVEY и VOTE в MVP)
  title text not null
  status text default 'DRAFT'    -- DRAFT | PUBLISHED | CLOSED
  owner_id uuid references users
  room_code text unique not null  -- короткий код типа XK7P2
  pages jsonb not null            -- массив вопросов/вариантов
  created_at timestamptz default now()

responses
  id uuid primary key
  poll_id uuid references polls
  participant_nickname text
  answers jsonb not null          -- массив AnswerPayload (совместим с api-docs.yaml)
  submitted_at timestamptz default now()
```

### Формат answers (JSONB)
```json
[
  { "pageId": 1, "question": "Как дела?", "textAnswer": "Хорошо", "selectedOptions": [] },
  { "pageId": 2, "question": "Оцените", "textAnswer": null, "selectedOptions": ["5"] }
]
```
Совместим с `AnswerPayload` из api-docs.yaml — Никита подключится без изменений.

### Экспорт
- `exportJSON(pollId)` → массив объектов
- `exportCSV(pollId)` → строка CSV
Оба в `src/api/results.js`, оба доступны через кнопки в интерфейсе.

---

## 5. API-слой (src/api/)

```
src/api/
  auth.js      — signup(nickname), signin(nickname), signout()
  polls.js     — list(), get(id), create(data), publish(id), close(id)
  results.js   — getResults(pollId), exportJSON(pollId), exportCSV(pollId)
  ai.js        — generatePoll(prompt, type) [МОК], summarize(results) [МОК]
  responses.js — submit(roomCode, answers, nickname)
```

Каждый файл экспортирует функции. Компоненты импортируют функции, не знают про Supabase или fetch.

---

## 6. AI-анализ (мок)

На странице `/poll/:id` кнопка "AI-анализ" вызывает `ai.summarize(results)`.  
Сейчас возвращает заготовленный текст на основе реальных данных:
- Для VOTE: "X% проголосовали за вариант [winner]..."
- Для SURVEY: топ-темы из открытых ответов (простое matching), тональность

Когда Иван подключает Python — меняет только `ai.js`, компонент не трогает.

---

## 7. Деплой

- **Frontend**: Vercel (GitHub auto-deploy, free tier)
- **Database**: Supabase (free tier: 500MB, 50k requests/month — достаточно для презентации)
- **Backend Java**: Railway.app когда Никита готов (free tier, подключить GitHub)
- **Python ML**: Railway.app или Supabase Edge Functions когда Иван готов

Переключение с Supabase на Java: меняем env-переменную `VITE_API_MODE=supabase|java`.

---

## 8. Что исправляем из текущего кода

| Проблема | Файл | Исправление |
|---|---|---|
| Старые CSS-переменные | Analytics, TakePoll, TakeVote | Заменить на новые |
| `btn-primary btn-large` | CreatePoll, CreateVote | → `btn btn-primary btn-lg` |
| Шаблон → TakePoll | Dashboard | → `/poll/:id` |
| Нет share после создания | CreatePoll, CreateVote | Редирект на `/poll/:id` |
| Карточки без `.poll-card-accent` | Templates | Обновить разметку |
| Rotating colors | CSS | Один цвет indigo |

---

## 9. Ограничения MVP

- AI-генерация и AI-анализ — мок, реалистичный текст
- Нет email-уведомлений
- Нет real-time обновления счётчика (polling раз в 10 сек)
- Максимум 20 вопросов в опросе
- Данные хранятся до 3 месяцев (Supabase free tier)
