# PulseRoom — Система опросов с AI-аналитикой

Ссылка на таблицу работы команды по спринтам:

https://docs.google.com/spreadsheets/d/1BkcZKUAzvsXprzzqZeOAhhJ30pCN3Rwnp7uRECx3dJU/edit?usp=sharing

Ссылка на итоговый проект:

https://pulseroom-five.vercel.app/

React-фронтенд для платформы опросов и голосований с AI-генерацией вопросов и аналитикой результатов.

## Стек

- **React 19** + **Vite 8**
- **Supabase** — база данных (PostgreSQL) + авторизация
- **Plain CSS** — собственная дизайн-система без Tailwind
- Шрифты: **Manrope** + **JetBrains Mono**

## Возможности

- Создание опросов и голосований вручную, через AI-генерацию или по шаблону
- Система кодов комнат — участники заходят по короткому коду (например `ABC12`) без регистрации
- Генерация QR-кода для быстрого шаринга
- Результаты в реальном времени: столбчатые диаграммы и процентные бары
- AI-саммари по ответам участников
- Экспорт результатов в CSV и JSON
- Дашборд организатора: управление статусами опросов (Черновик → Опубликован → Закрыт)
- Страница аналитики с агрегированной статистикой по всем опросам

## Запуск

```bash
npm install
```
Фронт для проекта на React
Что может:
1. Окно входа
2. Создание опросов
3. Создание голосований
4. Аналитика
5. Шаблоны опросов
6. Ссылки и qr-коды для опросов
7. Возможность голосовать по ссылке без логина

Создай `.env.local`:
```
VITE_SUPABASE_URL=твой_supabase_url
VITE_SUPABASE_ANON_KEY=твой_supabase_anon_key
```

```bash
npm run dev
```

## Структура проекта

```
src/
  api/          # Supabase-клиент и слой данных (auth, polls, responses, results, ai)
  components/   # Layout и общие компоненты
  context/      # PollContext — глобальное состояние
  pages/        # Welcome, Login, Dashboard, CreatePoll, PollDetail, Join, Thanks, Analytics
```

## База данных

Три таблицы в Supabase:
- `users` — аккаунты на основе никнейма
- `polls` — метаданные опросов, вопросы (JSONB), код комнаты, статус
- `responses` — ответы участников (JSONB)

## Деплой

Деплоится на Vercel. В `vercel.json` настроен rewrite для SPA — все роуты отдают `index.html`.

Переменные окружения в настройках проекта Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
