# Что было сделано — PulseRoom Frontend

Документация по изменениям в ветке `Frontend`. Описывает всё, что было переработано начиная с `c23a3de`.

---

## Общий итог

Полный редизайн и рефакторинг фронтенда. До этого — базовый React без дизайн-системы, без реальной БД, с хранением данных в localStorage. После — тёмная дизайн-система, Supabase, нормальный UX.

---

## 1. Дизайн-система (src/index.css)

Полностью переписан. Старые классы удалены, введена единая дизайн-система через CSS-переменные.

**Цвета:**
```css
--bg:        #0C0E14   /* основной фон */
--bg-2:      #141720   /* карточки, хедер */
--bg-raised: #1C2030   /* инпуты, вложенные элементы */
--accent:    #6366F1   /* индиго — основной акцент */
--green:     #22C55E
--amber:     #F59E0B
--red:       #EF4444
```

**Шрифты:**
- `Manrope` — основной (заголовки, текст, кнопки)
- `JetBrains Mono` — моноширинный (коды комнат, бейджи, метаданные)

**Компоненты в CSS:** `.btn`, `.btn-primary`, `.btn-outline`, `.btn-ghost`, `.btn-danger`, `.card`, `.badge`, `.form-input`, `.form-select`, `.auth-card`, `.poll-card`, `.room-input`, и т.д.

---

## 2. Supabase — база данных (src/api/)

Вместо localStorage — реальная PostgreSQL через Supabase.

### Таблицы

**`users`**
```sql
id uuid, nickname text unique, created_at timestamptz
```

**`polls`**
```sql
id uuid, user_id uuid, type text,        -- SURVEY | VOTE
title text, pages jsonb,                  -- массив вопросов
status text,                              -- DRAFT | PUBLISHED | CLOSED
room_code text unique,                    -- короткий код типа ABC12
created_at timestamptz
```

**`responses`**
```sql
id uuid, poll_id uuid, nickname text,
answers jsonb, created_at timestamptz
```

RLS включён, политики разрешающие (MVP — всё открыто).

### Файлы API

| Файл | Что делает |
|------|-----------|
| `src/api/supabase.js` | Инициализация клиента Supabase |
| `src/api/auth.js` | `signup(nickname)`, `signin(nickname)`, `signout()` |
| `src/api/polls.js` | `listPolls()`, `createPoll()`, `publishPoll()`, `closePoll()`, `deletePoll()`, `duplicatePoll()`, `getPollByRoomCode()` |
| `src/api/responses.js` | `submitResponse(pollId, answers, nickname)` |
| `src/api/results.js` | `getResults(pollId)`, `exportCSV()`, `exportJSON()` |
| `src/api/ai.js` | `generatePoll(prompt)` — мок с задержкой, `summarize(results)` — мок |

**Переменные окружения** (нужны в `.env.local` и Vercel):
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

---

## 3. Авторизация

Только никнейм — без паролей, без email.

- `signup(nickname)` — создаёт пользователя в таблице `users`
- `signin(nickname)` — находит по никнейму
- Сессия хранится в `localStorage` по ключу `pulseroom_user`
- `signout()` — очищает localStorage

Страницы: `Welcome.jsx` (вход по коду комнаты для участников) и `Login.jsx` (вход для организаторов).

---

## 4. Система кодов комнат

Опубликованный опрос получает короткий код (например `K7MNP`). Участники заходят по этому коду — без регистрации.

**Флоу:**
1. Организатор создаёт опрос → статус `DRAFT`
2. Нажимает «Опубликовать» → статус `PUBLISHED`, генерируется `room_code`
3. Участник заходит на главную, вводит код → редирект на `/join/K7MNP`
4. Отвечает на вопросы → ответ сохраняется в `responses`
5. Организатор видит результаты в реальном времени в `PollDetail`

---

## 5. Страницы — что где

| Страница | Файл | Кто видит |
|----------|------|-----------|
| Главная / ввод кода | `Welcome.jsx` | Все |
| Вход организатора | `Login.jsx` | Все |
| Дашборд | `Dashboard.jsx` | Только авторизованные |
| Создание опроса | `CreatePoll.jsx` | Только авторизованные |
| Создание голосования | `CreateVote.jsx` | Только авторизованные |
| Детали опроса / результаты | `PollDetail.jsx` | Только авторизованные |
| Участие в опросе | `Join.jsx` | Все (по коду) |
| Спасибо за участие | `Thanks.jsx` | Все |
| Аналитика | `Analytics.jsx` | Только авторизованные |

**Удалены:** `Templates.jsx`, `Results.jsx` — объединены в `CreatePoll` и `PollDetail`.

---

## 6. PollDetail — страница опроса

Главная страница для организатора. Находится по `/poll/:id`.

**Что есть:**
- Статус опроса и кнопки управления (Опубликовать / Закрыть)
- Share-блок: код комнаты + полная ссылка + кнопка копирования
- QR-код (раскрывается по клику)
- Результаты: прогресс-бары по вариантам ответа
- AI-саммари ответов (мок)
- Экспорт: CSV и JSON

---

## 7. CreatePoll — создание опроса

Три вкладки:
- **Вручную** — добавляешь вопросы сам
- **AI-генерация** — описываешь тему, получаешь 5 вопросов
- **Шаблон** — выбираешь готовый шаблон

Типы вопросов:
- `SINGLE_CHOICE` — варианты ответа (радио)
- `TEXT` — открытый ответ

> `MULTIPLE_CHOICE` убран — создавал путаницу.

---

## 8. Что было пофикшено отдельно

- **Стрелка в select** — исправлена через `appearance: none` + custom SVG в `background-image`
- **Выравнивание Welcome** — внешний wrapper изменён с 400px на 380px (совпадает с шириной карточки)
- **Счётчик "0 опросов"** — исправлена логика склонения (`< 5` → проверка диапазона `2–4`)
- **Фиолетовая линия на карточках** — убрана (`border-left: 3px solid var(--accent)` из `.poll-card`)
- **TakePoll / TakeVote** — убраны вызовы `updatePoll`, исправлены CSS-переменные
- **Analytics** — обновлены CSS-переменные под новую дизайн-систему

---

## 9. Деплой

**Хостинг:** Vercel  
**URL:** https://pulseroom-five.vercel.app  
**Ветка:** `Frontend`

Автодеплоя нет — деплоится вручную через `npx vercel --prod` из корня проекта.

Для работы нужно добавить в Vercel Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 10. Как запустить локально

```bash
git clone https://github.com/ILKA777/Survey-system-with-AI-powered-results-analysis
cd Survey-system-with-AI-powered-results-analysis
git checkout Frontend
npm install
```

Создай `.env.local`:
```
VITE_SUPABASE_URL=https://hrqmjqivrezwhgriakgi.supabase.co
VITE_SUPABASE_ANON_KEY=<ключ из Supabase Dashboard → Settings → API>
```

```bash
npm run dev
```

Открой `http://localhost:5173`.

---

## 11. Что ещё можно сделать (backlog)

- Реальный AI (подключить Claude/OpenAI вместо мока в `src/api/ai.js`)
- Realtime-результаты через Supabase Realtime subscriptions
- Множественный выбор (`MULTIPLE_CHOICE`) — был убран, можно вернуть
- Авторизация через email/пароль или OAuth
- Автодеплой при пуше в `Frontend` через Vercel Git Integration
- Таймер для опросов
