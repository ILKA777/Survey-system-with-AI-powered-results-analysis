# Фаза 1: подключение фронта к Java-бэкенду + фронт-тесты

Дата: 2026-06-08
Ветка: `Frontend`
Бэкенд (задеплоен): `https://survey-system-with-ai-powered-results-xnhl.onrender.com`

## Цель

Переключить фронт PulseRoom с прямого Supabase на Java-бэкенд (контракт `api-docs.yaml`),
сохранив структуру компонентов. Покрыть результат тестами (Vitest + React Testing Library).

Викторина (правильные ответы) и публичные результаты голосования бэком пока не
поддерживаются — **викторину прячем за фича-флагом, код не удаляем**; голосование
остаётся обычным (без экрана публичных результатов).

## Подтверждённый контракт бэкенда (проверен на живом сервере)

- **Auth** `POST /api/auth/signup` (201) и `POST /api/auth/signin` (200/404) →
  `{ userId, nickname, anonymous, token }`. Токен — в заголовке `X-Auth-Token`.
- **PollResponse** (camelCase): `id` (число), `type`, `title`, `description`, `roomCode`,
  `joinLink`, `qrPayload`, `allowAnonymous`, `status`, `aiSummary`, `createdAt`,
  `pages: [{ id, pageOrder, question, questionType, required, options }]`.
- **Admin**: `GET /api/admin/polls`, `POST /api/admin/polls`,
  `POST /api/admin/polls/{id}/publish`, `GET /api/admin/polls/{id}/results`,
  `POST /api/admin/polls/ai-generate` — все требуют `X-Auth-Token`.
- **Participant**: `GET /api/participant/polls/room/{roomCode}`,
  `POST /api/participant/polls/room/{roomCode}/submit` —
  тело `{ nickname, answers: [{ pageId, selectedOptions, textAnswer }] }` → `{ message }`.
  **`pageId` = реальный `id` страницы**, не индекс.
- **Results**: `{ rawResults, aggregatedChoiceResults, textAnswers, chartData, aiSummary }`.
  `rawResults[i] = { participantNickname, submittedAt, answers }`.
  AI-суммаризация на free-Render может отдавать строку-ошибку (таймаут) — обрабатываем мягко.

## Расхождения и как закрываем

1. **snake_case → camelCase**: `room_code`→`roomCode`, `created_at`→`createdAt`. Правим в Dashboard, PollDetail.
2. **`id` стал числом**, `useParams` даёт строку → сравнение `p.id === id` ломается. Везде сравниваем `String(p.id) === id`.
3. **Submit по `roomCode`**, `pageId` = `page.id`. Переписываем `submitResponse(roomCode, answers, nickname)`; в Join слать `currentPage.id`.
4. **Формат результатов другой**: `getResults` отдаёт весь объект; PollDetail рендерит `rawResults`, матчит ответы по `page.id`, `aiSummary` берёт с бэка.
5. **Нет ручек delete/close/duplicate**: убираем кнопки из Dashboard и методы из контекста/`polls.js`.
6. **AI-генерация создаёт опрос сразу**: `generatePoll` зовёт `/ai-generate`, возвращает готовый `PollResponse`; CreatePoll сразу переходит на него (без второго `addPoll`).
7. **Викторина/публичное голосование** не в контракте: викторина скрыта фича-флагом; код Join/CreateQuiz сохранён.

## Архитектура API-слоя (`src/api/`)

Новый `http.js`:
- `BASE = import.meta.env.VITE_API_URL`
- `getToken()` — из `pulseroom_user` в localStorage
- `request(path, { method, body, auth })` — fetch + JSON + бросок ошибки с сообщением

Переписываем, **сохраняя имена экспортов**:
- `auth.js`: `signup`, `signin` (POST, кладут `{ userId, nickname, anonymous, token }` в localStorage), `getUser`, `signout` — без изменений.
- `polls.js`: `listPolls`, `getPollByRoomCode`, `createPoll`, `publishPoll`. Удаляем `closePoll`, `deletePoll`, `duplicatePoll`, `generateRoomCode`.
- `responses.js`: `submitResponse(roomCode, answers, nickname)`.
- `results.js`: `getResults(pollId)` → полный объект; `exportJSON`/`exportCSV`/`downloadCSV` адаптируем под `rawResults` (`participantNickname`, `submittedAt`, матч по `page.id`).
- `ai.js`: `generatePoll` → `/ai-generate`. Старый мок `summarize` убираем (используем `results.aiSummary`).
- `supabase.js` удаляем; зависимость `@supabase/supabase-js` убираем из `package.json`.

## Контекст (`PollContext.jsx`)

- Убрать `deletePoll`, `duplicatePoll` из value (и `duplicatePoll` из импорта).
- `getPoll(id)` — сравнение через `String(p.id) === String(id)`.
- `addPoll` зовёт `createPoll`; `publish` — `publishPoll`; `useTemplate` — без изменений.
- `listPolls` фильтрует по токену (бэк сам отдаёт опросы владельца).

## Компоненты

- **Dashboard**: `roomCode`/`createdAt`; убрать кнопки дублирования и удаления; скрыть пункт «Викторина» в дропдауне (фича-флаг).
- **PollDetail**: `roomCode`/`createdAt`; `String(p.id)===id`; `getResults` → `rawResults` + `aiSummary`; матч ответов по `page.id`; экспорт адаптирован. AI-блок показывает `aiSummary` с бэка (если строка-ошибка/пусто — мягкий фолбэк).
- **CreatePoll**: AI-генерация переходит сразу на созданный опрос; ручное создание шлёт `pages` (+`allowAnonymous` по умолчанию `true`).
- **CreateVote**: остаётся; тоггл публичности оставляем, но экран публичных результатов в фазе 1 не триггерится — голосование завершается на `/thanks`.
- **Join**: `submitResponse(roomCode, ...)`; `pageId = currentPage.id`. Ветки quiz/public сохраняются, но в фазе 1 неактивны.
- **Фича-флаг**: `src/config/features.js` → `{ quiz: false }`. Dashboard скрывает пункт викторины; маршрут `/create/quiz` закрыт, когда флаг выключен. Файлы `CreateQuiz.jsx` и quiz-ветки Join не удаляются.

## Переменные окружения

- `.env.local` и `.env.example`: добавить `VITE_API_URL`. Supabase-переменные убрать.

## Тесты (Vitest + React Testing Library)

Настройка: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`,
`@testing-library/user-event`; конфиг с `environment: 'jsdom'` и setup-файлом;
скрипт `"test": "vitest"` (+`"test:run": "vitest run"`).

- **API-слой** (мок `global.fetch`): корректные URL/метод, заголовок `X-Auth-Token`,
  формат тела, разбор ответа, обработка ошибок — для auth, polls, responses, results
  (включая маппинг `exportCSV`).
- **Компоненты** (провайдеры + router, мок `src/api/*`): Login (submit → signup → переход),
  CreatePoll ручное создание, Join (рендер вопроса + сабмит), PollDetail (рендер результатов).

## CORS (важно, выяснилось при e2e-проверке)

У бэкенда **не настроен CORS** — браузер не может ходить к нему напрямую ни с
localhost, ни с домена Vercel (preflight → 403 «Invalid CORS request»). curl проходит,
т.к. без заголовка `Origin`. Чтобы не менять бэкенд в фазе 1, приложение зовёт `/api/*`
**относительно своего origin**, а проксирование делается на стороне фронта:
- дев: `server.proxy` в `vite.config.js` → бэкенд (server-to-server, без CORS);
- прод: rewrite `/api/:path*` в `vercel.json` → бэкенд.

`VITE_API_URL` оставлен пустым (относительный режим). Абсолютный URL имеет смысл только
после того, как на бэкенде включат CORS (кандидат в фазу 2 — одна Spring-конфигурация).

## Критерии готовности

- Логин, создание (ручное/AI/шаблон), публикация, прохождение по `roomCode`, результаты с
  графиками и AI-сводкой работают против задеплоенного бэка.
- Supabase из кода удалён.
- `npm run test:run` зелёный; `npm run build` собирается; `npm run lint` чистый.
- Викторина скрыта, но код на месте и включается флагом.
