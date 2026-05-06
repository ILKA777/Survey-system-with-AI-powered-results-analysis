# Интеграция — что нужно сделать ML и бэкенду

Фронтенд задеплоен: **https://pulseroom-five.vercel.app**  
Ветка: `Frontend`  
Текущий стек фронта: React + Supabase напрямую (без Java-бэкенда)

---

## Ситуация

Сейчас фронтенд работает напрямую с Supabase — без Java-бэкенда. В репо есть `api-docs.yaml` с описанием Java API на `localhost:8080`. Когда бэкенд будет готов, фронт нужно переключить с Supabase на него.

---

## Для команды бэкенда (OpenAPI)

### Что уже описано в api-docs.yaml

Три группы ручек:

**Авторизация** (`/api/auth/`)
- `POST /api/auth/signup` — регистрация по никнейму, возвращает `token`
- `POST /api/auth/signin` — вход по никнейму, возвращает `token`

**Администратор** (`/api/admin/polls/`, требует `X-Auth-Token` в заголовке)
- `GET /api/admin/polls` — список опросов
- `POST /api/admin/polls` — создать опрос вручную
- `POST /api/admin/polls/ai-generate` — AI-генерация
- `POST /api/admin/polls/{pollId}/publish` — опубликовать
- `GET /api/admin/polls/{pollId}/results` — результаты

**Участник** (`/api/participant/`, без авторизации)
- `GET /api/participant/polls/room/{roomCode}` — получить опрос по коду
- `POST /api/participant/polls/room/{roomCode}/submit` — отправить ответы

### Как подключить фронт к Java API

Сейчас всё в `src/api/`. Каждый файл — отдельный слой, компоненты не знают об источнике данных.

**Шаг 1.** Добавить в `.env.local`:
```
VITE_API_URL=http://localhost:8080
```

**Шаг 2.** Заменить содержимое `src/api/auth.js`:
```js
const BASE = import.meta.env.VITE_API_URL

export async function signup(nickname) {
  const res = await fetch(`${BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname }),
  })
  const data = await res.json()
  localStorage.setItem('pulseroom_user', JSON.stringify({ nickname: data.nickname, token: data.token }))
  return data
}

export async function signin(nickname) {
  const res = await fetch(`${BASE}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname }),
  })
  if (!res.ok) throw new Error('Пользователь не найден')
  const data = await res.json()
  localStorage.setItem('pulseroom_user', JSON.stringify({ nickname: data.nickname, token: data.token }))
  return data
}

export function getUser() {
  const raw = localStorage.getItem('pulseroom_user')
  return raw ? JSON.parse(raw) : null
}

export function signout() {
  localStorage.removeItem('pulseroom_user')
}
```

**Шаг 3.** Заменить `src/api/polls.js` — вместо Supabase-вызовов слать `fetch` на `/api/admin/polls` с заголовком `X-Auth-Token: <token из localStorage>`.

**Шаг 4.** Заменить `src/api/responses.js`:
```js
export async function submitResponse(pollId, answers, nickname) {
  const roomCode = /* нужно передавать */ ''
  await fetch(`${BASE}/api/participant/polls/room/${roomCode}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, answers }),
  })
}
```

> **Важно:** В OpenAPI `pollId` — это `int64`, а в текущем Supabase — `uuid`. При переходе на Java-бэкенд нужно убедиться что типы совпадают везде, где id используется в роутинге React (`/poll/:id`).

### Форматы данных

Ответы участника — массив объектов:
```json
{
  "nickname": "Вася",
  "answers": [
    { "pageId": 1, "selectedOptions": ["Вариант А"], "textAnswer": "" },
    { "pageId": 2, "selectedOptions": [], "textAnswer": "Свободный ответ" }
  ]
}
```

Страницы опроса:
```json
{
  "question": "Текст вопроса",
  "questionType": "SINGLE_CHOICE",  // | MULTIPLE_CHOICE | TEXT
  "required": true,
  "options": ["Вариант А", "Вариант Б"]
}
```

---

## Для ML команды

### Где сейчас моки

Весь AI — в `src/api/ai.js`. Два метода:

```js
// Генерация опроса по промпту
export async function generatePoll(prompt, type = 'SURVEY', pagesCount = 5)

// Саммаризация результатов
export async function summarize(poll, responses)
```

Сейчас оба возвращают заглушки с задержкой 1.4 сек.

### Что нужно сделать ML

**Вариант A — через Java бэкенд (рекомендуется)**

Бэкенд уже описал ручку `POST /api/admin/polls/ai-generate`. ML делает микросервис или модуль, который вызывает Java-бэкенд дёргает.

Фронт уже вызывает `generatePoll()` из `CreatePoll.jsx` — просто замените тело функции на fetch к бэкенду:
```js
export async function generatePoll(prompt, type = 'SURVEY', pagesCount = 5) {
  const user = getUser()
  const res = await fetch(`${BASE}/api/admin/polls/ai-generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': user.token,
    },
    body: JSON.stringify({ prompt, type, pagesCount }),
  })
  return res.json() // должен вернуть объект в формате PollResponse
}
```

**Вариант B — прямо из фронта (быстрее для прототипа)**

Замените `src/api/ai.js` на вызов напрямую к вашему ML-сервису:
```js
export async function generatePoll(prompt, type = 'SURVEY', pagesCount = 5) {
  const res = await fetch('https://your-ml-service.com/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, type, pagesCount }),
  })
  const data = await res.json()
  // нужно привести к формату { title, type, pages: [{ question, questionType, options }] }
  return data
}
```

### Что должен возвращать ML-эндпоинт генерации

Фронт ждёт объект в таком формате:
```json
{
  "title": "Название опроса",
  "type": "SURVEY",
  "pages": [
    {
      "pageOrder": 1,
      "question": "Текст вопроса?",
      "questionType": "SINGLE_CHOICE",
      "options": ["Вариант А", "Вариант Б", "Вариант В"],
      "required": true
    }
  ]
}
```

### Что должен возвращать ML-эндпоинт саммаризации

`summarize(poll, responses)` сейчас просто возвращает строку. Фронт показывает её как текст:

```js
// src/api/ai.js
export async function summarize(poll, responses) {
  const res = await fetch('https://your-ml-service.com/summarize', {
    method: 'POST',
    body: JSON.stringify({ poll, responses }),
  })
  const data = await res.json()
  return data.summary // строка
}
```

---

## Итоговая схема взаимодействия

```
Фронт (Vercel)
  │
  ├── src/api/auth.js       →  Java /api/auth/*
  ├── src/api/polls.js      →  Java /api/admin/polls/*
  ├── src/api/responses.js  →  Java /api/participant/*
  └── src/api/ai.js         →  ML сервис (или через Java /api/admin/polls/ai-generate)
```

Supabase сейчас используется как временная БД — когда Java-бэкенд будет готов, Supabase можно убрать совсем или оставить только для хранения файлов.

---

## Где найти что

| Что | Где |
|-----|-----|
| OpenAPI spec | `api-docs.yaml` в корне репо |
| Фронт API слой | `src/api/` |
| AI моки | `src/api/ai.js` |
| Контекст / стейт | `src/context/PollContext.jsx` |
| Переменные окружения | `.env.local` (локально), Vercel Dashboard (прод) |
| Живой фронт | https://pulseroom-five.vercel.app |
