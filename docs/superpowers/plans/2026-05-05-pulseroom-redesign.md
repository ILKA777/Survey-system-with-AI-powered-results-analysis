# PulseRoom Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Полный редизайн PulseRoom с подключением Supabase, чистым API-слоем и исправлением UX-дыр — готово к деплою на Vercel.

**Architecture:** Фронт на React+Vite вызывает функции из `src/api/` (Supabase сейчас, Java-бэк потом без изменений компонентов). PollContext остаётся как тонкая обёртка над API. Участники заходят по коду комнаты через `/join/:roomCode`.

**Tech Stack:** React 19, Vite 8, Supabase JS v2, react-router-dom v7, chart.js, qrcode.react, iconoir-react, Manrope + JetBrains Mono (Google Fonts)

---

## File Map

```
СОЗДАТЬ:
  src/api/supabase.js        — клиент Supabase
  src/api/auth.js            — signup / signin / getUser / signout
  src/api/polls.js           — CRUD опросов
  src/api/responses.js       — submit ответов
  src/api/results.js         — getResults / exportJSON / exportCSV
  src/api/ai.js              — generatePoll / summarize (МОК)
  src/pages/Join.jsx         — участник проходит опрос (/join/:roomCode)
  src/pages/Thanks.jsx       — экран "Спасибо"
  src/pages/PollDetail.jsx   — детали опроса: share + QR + результаты

ИЗМЕНИТЬ:
  src/index.css              — полная замена (Manrope, indigo, cool dark)
  src/context/PollContext.jsx — перевести с localStorage на src/api/
  src/App.jsx                — новые маршруты
  src/components/Layout.jsx  — обновить навигацию
  src/pages/Welcome.jsx      — лендинг: вход + поле кода комнаты
  src/pages/Login.jsx        — редизайн
  src/pages/Dashboard.jsx    — исправить карточки
  src/pages/CreatePoll.jsx   — три вкладки (Вручную / AI / Шаблон)
  src/pages/CreateVote.jsx   — редирект на /poll/:id после создания
  src/pages/Analytics.jsx    — исправить CSS-переменные
  src/pages/TakePoll.jsx     — исправить CSS-переменные (временно)
  src/pages/TakeVote.jsx     — исправить CSS-переменные (временно)
  package.json               — добавить @supabase/supabase-js

УДАЛИТЬ:
  src/pages/Templates.jsx    — функционал переходит в CreatePoll вкладку
  src/pages/Results.jsx      — функционал переходит в PollDetail
```

---

## Task 1: Установка Supabase + создание клиента

**Files:**
- Modify: `package.json`
- Create: `src/api/supabase.js`
- Create: `.env.local`
- Create: `.env.example`

**Предварительно (делает пользователь, не агент):**
1. Зайди на supabase.com → New project
2. Settings → API → скопируй Project URL и anon public key

- [ ] **Шаг 1: Установить пакет**

```bash
cd "/Users/dmitrii_khomenko/Downloads/Проектный практикум/Survey-system-with-AI-powered-results-analysis"
npm install @supabase/supabase-js
```

Ожидаемый результат: `added 1 package`

- [ ] **Шаг 2: Создать .env.local**

Создай файл `.env.local` в корне проекта:
```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxxxxx
```

- [ ] **Шаг 3: Создать .env.example**

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Шаг 4: Создать src/api/supabase.js**

```js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

- [ ] **Шаг 5: Добавить .env.local в .gitignore**

Открой `.gitignore` и убедись что есть строка:
```
.env.local
```

- [ ] **Шаг 6: Проверка — запустить дев-сервер**

```bash
npm run dev
```

Ожидаемый результат: сервер стартует без ошибок на `http://localhost:5173`

---

## Task 2: Схема базы данных в Supabase

**Предварительно:** зайди в Supabase Dashboard → SQL Editor

- [ ] **Шаг 1: Выполнить SQL для создания таблиц**

В Supabase SQL Editor выполни:

```sql
-- Пользователи (auth by nickname only)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  nickname text unique not null,
  created_at timestamptz default now()
);

-- Опросы
create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('SURVEY', 'VOTE', 'QUIZ')),
  title text not null,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'PUBLISHED', 'CLOSED')),
  owner_id uuid references users(id) on delete cascade,
  room_code text unique not null,
  pages jsonb not null default '[]',
  created_at timestamptz default now()
);

-- Ответы участников
create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references polls(id) on delete cascade,
  participant_nickname text,
  answers jsonb not null default '[]',
  submitted_at timestamptz default now()
);
```

- [ ] **Шаг 2: Выполнить SQL для RLS политик**

```sql
-- Включить RLS
alter table users enable row level security;
alter table polls enable row level security;
alter table responses enable row level security;

-- Открытые политики для MVP (достаточно для демо)
create policy "public_users" on users for all using (true) with check (true);
create policy "public_polls" on polls for all using (true) with check (true);
create policy "public_responses" on responses for all using (true) with check (true);
```

- [ ] **Шаг 3: Проверить таблицы в Supabase Dashboard**

Table Editor должен показывать три таблицы: users, polls, responses.

---

## Task 3: API-слой — все 5 файлов

**Files:**
- Create: `src/api/auth.js`
- Create: `src/api/polls.js`
- Create: `src/api/responses.js`
- Create: `src/api/results.js`
- Create: `src/api/ai.js`

- [ ] **Шаг 1: Создать src/api/auth.js**

```js
import { supabase } from './supabase.js'

const USER_KEY = 'pulseroom_user'

export async function signup(nickname) {
  const { data, error } = await supabase
    .from('users')
    .upsert({ nickname }, { onConflict: 'nickname' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  localStorage.setItem(USER_KEY, JSON.stringify(data))
  return data
}

export async function signin(nickname) {
  const { data, error } = await supabase
    .from('users')
    .select()
    .eq('nickname', nickname)
    .single()
  if (error) throw new Error('Пользователь не найден')
  localStorage.setItem(USER_KEY, JSON.stringify(data))
  return data
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}

export function signout() {
  localStorage.removeItem(USER_KEY)
}
```

- [ ] **Шаг 2: Создать src/api/polls.js**

```js
import { supabase } from './supabase.js'
import { getUser } from './auth.js'

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase()
}

export async function listPolls() {
  const user = getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('polls')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function getPoll(id) {
  const { data, error } = await supabase
    .from('polls')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function getPollByRoomCode(roomCode) {
  const { data, error } = await supabase
    .from('polls')
    .select('*')
    .eq('room_code', roomCode.toUpperCase())
    .eq('status', 'PUBLISHED')
    .single()
  if (error) throw new Error('Опрос не найден или не опубликован')
  return data
}

export async function createPoll(pollData) {
  const user = getUser()
  if (!user) throw new Error('Необходима авторизация')
  const { data, error } = await supabase
    .from('polls')
    .insert({
      type: pollData.type,
      title: pollData.title,
      pages: pollData.pages,
      owner_id: user.id,
      room_code: generateRoomCode(),
      status: 'DRAFT',
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function publishPoll(id) {
  const { data, error } = await supabase
    .from('polls')
    .update({ status: 'PUBLISHED' })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function closePoll(id) {
  const { data, error } = await supabase
    .from('polls')
    .update({ status: 'CLOSED' })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deletePoll(id) {
  const { error } = await supabase.from('polls').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function duplicatePoll(id) {
  const poll = await getPoll(id)
  return createPoll({
    type: poll.type,
    title: `${poll.title} (Копия)`,
    pages: poll.pages,
  })
}
```

- [ ] **Шаг 3: Создать src/api/responses.js**

```js
import { supabase } from './supabase.js'

export async function submitResponse(pollId, answers, nickname = null) {
  const { data, error } = await supabase
    .from('responses')
    .insert({ poll_id: pollId, answers, participant_nickname: nickname })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}
```

- [ ] **Шаг 4: Создать src/api/results.js**

```js
import { supabase } from './supabase.js'

export async function getResults(pollId) {
  const { data, error } = await supabase
    .from('responses')
    .select('*')
    .eq('poll_id', pollId)
    .order('submitted_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data
}

export async function exportJSON(pollId) {
  const responses = await getResults(pollId)
  return responses.map(r => ({
    submittedAt: r.submitted_at,
    nickname: r.participant_nickname || 'Анонимно',
    answers: r.answers,
  }))
}

export function exportCSV(responses, pages) {
  if (!responses.length) return ''
  const questions = pages.map((p, i) => `q${i + 1}: ${p.question}`)
  const headers = ['submitted_at', 'nickname', ...questions]
  const rows = responses.map(r => [
    r.submitted_at,
    r.participant_nickname || 'Анонимно',
    ...pages.map((p, i) => {
      const ans = r.answers.find(a => a.pageId === i + 1)
      if (!ans) return ''
      return ans.textAnswer || (ans.selectedOptions || []).join('; ')
    }),
  ])
  const escape = cell => `"${String(cell ?? '').replace(/"/g, '""')}"`
  return [headers, ...rows].map(row => row.map(escape).join(',')).join('\n')
}

export function downloadCSV(content, filename) {
  const blob = new Blob(['﻿' + content], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Шаг 5: Создать src/api/ai.js**

```js
// МОК — Иван заменит fetch() на свой Python-сервис не трогая компоненты

export async function generatePoll(prompt, type, pagesCount = 5) {
  await new Promise(r => setTimeout(r, 1400)) // имитация задержки AI

  const base = [
    { question: `Как вы оцениваете "${prompt}"?`, questionType: 'SINGLE_CHOICE', options: ['Отлично', 'Хорошо', 'Нейтрально', 'Плохо'] },
    { question: 'Что можно улучшить?', questionType: 'TEXT', options: [] },
    { question: 'Насколько вы рекомендуете это коллегам?', questionType: 'SINGLE_CHOICE', options: ['Определённо да', 'Скорее да', 'Скорее нет', 'Нет'] },
    { question: 'Как давно вы используете это?', questionType: 'SINGLE_CHOICE', options: ['Меньше месяца', '1–6 месяцев', 'Более 6 месяцев'] },
    { question: 'Дополнительные комментарии:', questionType: 'TEXT', options: [] },
  ]

  return {
    type,
    title: prompt,
    pages: base.slice(0, Math.min(pagesCount, base.length)).map((q, i) => ({
      ...q,
      pageOrder: i + 1,
      required: true,
    })),
  }
}

export async function summarize(poll, responses) {
  await new Promise(r => setTimeout(r, 900))

  const total = responses.length
  if (!total) return 'Ответов пока нет. Поделитесь ссылкой с участниками!'

  if (poll.type === 'VOTE') {
    const tally = {}
    responses.forEach(r => r.answers.forEach(a =>
      (a.selectedOptions || []).forEach(opt => { tally[opt] = (tally[opt] || 0) + 1 })
    ))
    const [winner, count] = Object.entries(tally).sort((a, b) => b[1] - a[1])[0] ?? ['—', 0]
    const pct = total ? ((count / total) * 100).toFixed(0) : 0
    return `«${winner}» лидирует с ${pct}% голосов (${count} из ${total}). Участники чётко выразили предпочтение этому варианту.`
  }

  return `${total} участников прошли опрос. Открытые ответы демонстрируют общую позитивную тенденцию. Рекомендуется детально изучить текстовые ответы для выявления конкретных точек роста.`
}
```

- [ ] **Шаг 6: Проверить что dev-сервер не ругается**

```bash
npm run dev
```

Ожидаемый результат: нет ошибок импорта.

---

## Task 4: Полная замена CSS

**Files:**
- Modify: `src/index.css` (полная замена содержимого)

- [ ] **Шаг 1: Заменить содержимое src/index.css полностью**

```css
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --bg:        #0C0E14;
  --bg-2:      #141720;
  --bg-raised: #1C2030;
  --bg-hover:  #22263A;

  --text:      #E8EAED;
  --text-2:    rgba(232,234,237,0.55);
  --text-3:    rgba(232,234,237,0.30);

  --accent:     #6366F1;
  --accent-h:   #4F52E0;
  --accent-dim: rgba(99,102,241,0.14);

  --green:     #22C55E;
  --green-dim: rgba(34,197,94,0.12);
  --amber:     #F59E0B;
  --amber-dim: rgba(245,158,11,0.12);
  --red:       #EF4444;
  --red-dim:   rgba(239,68,68,0.10);

  --border:   rgba(255,255,255,0.07);
  --border-2: rgba(255,255,255,0.12);
  --border-3: rgba(255,255,255,0.22);

  --sans: 'Manrope', -apple-system, sans-serif;
  --mono: 'JetBrains Mono', monospace;

  --r-sm:  6px;
  --r-md:  10px;
  --r-lg:  14px;
  --r-xl:  20px;
  --r-pill: 999px;
}

body {
  font-family: var(--sans);
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
#root { min-height: 100vh; }

/* ── LAYOUT ─────────────────────────── */
.layout { min-height: 100vh; display: flex; flex-direction: column; }

.header {
  height: 56px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 32px;
  background: var(--bg-2);
  border-bottom: 1px solid var(--border);
  position: sticky; top: 0; z-index: 100;
}

.logo-mark {
  width: 28px; height: 28px;
  background: var(--accent);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.logo-text {
  font-family: var(--sans);
  font-size: 15px; font-weight: 800;
  color: var(--text);
  text-decoration: none;
  letter-spacing: -0.01em;
}

.nav { display: flex; gap: 2px; align-items: center; }
.nav-link {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 11px;
  border-radius: var(--r-md);
  color: var(--text-2);
  font-size: 13px; font-weight: 600;
  text-decoration: none;
  transition: all 0.15s;
}
.nav-link:hover { color: var(--text); background: var(--bg-raised); }
.nav-link.active { color: var(--text); background: var(--accent-dim); }
.nav-link.active svg { color: var(--accent); }

.content { padding: 36px 32px; max-width: 1120px; margin: 0 auto; width: 100%; flex: 1; }

/* ── BUTTONS ────────────────────────── */
button { cursor: pointer; font-family: var(--sans); transition: all 0.15s; }

.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px;
  border-radius: var(--r-md);
  font-size: 13px; font-weight: 600;
  text-decoration: none; border: 1px solid transparent;
  transition: all 0.15s; white-space: nowrap; cursor: pointer;
  font-family: var(--sans);
}
.btn-primary {
  background: var(--accent); color: #fff; border-color: var(--accent);
  position: relative; overflow: hidden;
}
.btn-primary::after {
  content: ''; position: absolute; top: -50%; left: -60%;
  width: 28%; height: 200%;
  background: rgba(255,255,255,0.15);
  transform: skewX(-22deg);
  transition: left 0.45s ease;
  pointer-events: none;
}
.btn-primary:hover::after { left: 130%; }
.btn-primary:hover { background: var(--accent-h); border-color: var(--accent-h); transform: translateY(-1px); }
.btn-primary:active { transform: translateY(0); }

.btn-outline {
  background: transparent; color: var(--text-2); border-color: var(--border-2);
}
.btn-outline:hover { color: var(--text); border-color: var(--border-3); background: var(--bg-raised); }

.btn-ghost {
  background: transparent; color: var(--text-3); border-color: transparent;
  padding: 7px 10px;
}
.btn-ghost:hover { color: var(--text-2); background: var(--bg-raised); }

.btn-danger {
  background: transparent; color: var(--red); border-color: var(--red-dim);
}
.btn-danger:hover { background: var(--red-dim); }

.btn-sm  { padding: 5px 11px; font-size: 12px; border-radius: var(--r-sm); }
.btn-lg  { padding: 12px 24px; font-size: 14px; }
.btn-xl  { padding: 14px 32px; font-size: 15px; font-weight: 700; }
.btn-block { width: 100%; justify-content: center; }

/* ── CARDS ──────────────────────────── */
.card {
  background: var(--bg-2);
  border-radius: var(--r-lg);
  border: 1px solid var(--border);
  padding: 22px;
}

/* ── BADGE ──────────────────────────── */
.badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px;
  border-radius: var(--r-pill);
  font-size: 10px; font-weight: 700;
  font-family: var(--mono); letter-spacing: 0.06em; text-transform: uppercase;
  border: 1px solid transparent;
}
.badge-survey { background: var(--accent-dim); color: var(--accent); border-color: rgba(99,102,241,0.25); }
.badge-vote   { background: var(--green-dim);  color: var(--green);  border-color: rgba(34,197,94,0.25); }
.badge-draft  { background: rgba(255,255,255,0.06); color: var(--text-3); border-color: var(--border); }
.badge-published { background: var(--green-dim); color: var(--green); border-color: rgba(34,197,94,0.25); }
.badge-closed { background: var(--red-dim); color: var(--red); border-color: rgba(239,68,68,0.2); }
.badge-ai     { background: var(--amber-dim); color: var(--amber); border-color: rgba(245,158,11,0.25); }

/* ── DASHBOARD ──────────────────────── */
.dashboard-header {
  display: flex; justify-content: space-between; align-items: flex-end;
  margin-bottom: 28px; gap: 16px;
  animation: fadeInUp 0.35s ease both;
}
.dashboard-title {
  font-size: clamp(22px, 3vw, 32px); font-weight: 800; line-height: 1.1;
}
.dashboard-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.polls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}

/* Poll card */
.poll-card {
  background: var(--bg-2);
  border-radius: var(--r-lg);
  border: 1px solid var(--border);
  overflow: hidden;
  display: flex; flex-direction: column;
  transition: border-color 0.2s, transform 0.18s, box-shadow 0.2s;
  animation: cardIn 0.35s ease both;
  border-left: 3px solid var(--accent);
}
.poll-card:nth-child(2)  { animation-delay: 0.05s; }
.poll-card:nth-child(3)  { animation-delay: 0.10s; }
.poll-card:nth-child(4)  { animation-delay: 0.15s; }
.poll-card:nth-child(5)  { animation-delay: 0.20s; }
.poll-card:nth-child(6)  { animation-delay: 0.25s; }

.poll-card:hover {
  transform: translateY(-2px);
  border-color: rgba(99,102,241,0.4);
  box-shadow: 0 8px 28px rgba(99,102,241,0.12);
}

.poll-card-body { padding: 18px 18px 14px; flex: 1; display: flex; flex-direction: column; gap: 10px; }

.poll-card-header { display: flex; justify-content: space-between; align-items: center; }

.poll-card-title {
  font-size: 14px; font-weight: 700; line-height: 1.4;
  color: var(--text);
}

.poll-card-meta {
  font-family: var(--mono);
  font-size: 11px; color: var(--text-3);
  display: flex; gap: 8px; align-items: center;
}

.poll-card-actions {
  display: flex; gap: 5px; flex-wrap: wrap;
  margin-top: auto; padding-top: 12px;
  border-top: 1px solid var(--border);
}

/* ── EMPTY STATE ─────────────────────── */
.empty-state {
  text-align: center; padding: 64px 40px;
  border: 1px dashed var(--border-2);
  border-radius: var(--r-xl);
}
.empty-icon {
  width: 48px; height: 48px;
  background: var(--bg-raised); border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 14px; color: var(--text-3);
}
.empty-title { font-size: 17px; font-weight: 700; margin-bottom: 8px; }
.empty-text  { font-size: 13px; color: var(--text-2); margin-bottom: 22px; }

/* ── FORMS ───────────────────────────── */
.form-container { max-width: 700px; margin: 0 auto; }
.form-title { font-size: 24px; font-weight: 800; margin-bottom: 28px; line-height: 1.2; }

.form-card {
  background: var(--bg-2);
  border-radius: var(--r-lg); border: 1px solid var(--border);
  padding: 22px; margin-bottom: 12px;
}

.form-label {
  display: block; font-size: 11px; font-weight: 700;
  font-family: var(--mono); letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--text-3); margin-bottom: 8px;
}

.form-input, .form-textarea {
  width: 100%; padding: 10px 13px;
  border-radius: var(--r-md); border: 1px solid var(--border-2);
  font-size: 14px; outline: none;
  background: var(--bg-raised); color: var(--text);
  font-family: var(--sans); transition: border-color 0.15s;
  margin-bottom: 12px;
}
.form-input:focus, .form-textarea:focus { border-color: var(--accent); }
.form-input::placeholder, .form-textarea::placeholder { color: var(--text-3); }
.form-textarea { resize: vertical; min-height: 100px; }

.form-select {
  padding: 8px 12px; border-radius: var(--r-sm);
  border: 1px solid var(--border-2); font-size: 13px; outline: none;
  background: var(--bg-raised); color: var(--text); font-family: var(--sans);
}
.form-select:focus { border-color: var(--accent); }

.step-card {
  background: var(--bg-raised); border-radius: var(--r-md);
  border: 1px solid var(--border); padding: 16px; margin-bottom: 10px;
}
.step-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.option-row { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
.btn-add { background: transparent; color: var(--accent); border: none; font-size: 13px; font-weight: 600; padding: 6px 0; font-family: var(--sans); }
.btn-remove { background: transparent; color: var(--text-3); border: none; font-size: 18px; padding: 2px 8px; line-height: 1; }
.btn-remove:hover { color: var(--red); }

/* ── TABS ────────────────────────────── */
.tabs { display: flex; gap: 2px; margin-bottom: 24px; background: var(--bg-2); padding: 4px; border-radius: var(--r-lg); border: 1px solid var(--border); width: fit-content; }
.tab-btn {
  padding: 7px 16px; border-radius: var(--r-md);
  font-size: 13px; font-weight: 600; border: none;
  color: var(--text-3); background: transparent;
  transition: all 0.15s;
}
.tab-btn.active { background: var(--accent); color: #fff; }
.tab-btn:not(.active):hover { color: var(--text); background: var(--bg-raised); }

/* ── VOTE (participate) ─────────────── */
.vote-container { max-width: 500px; margin: 48px auto; }
.vote-card {
  background: var(--bg-2);
  border-radius: var(--r-xl); border: 1px solid var(--border-2); padding: 32px;
}
.vote-question { font-size: 20px; font-weight: 800; line-height: 1.3; margin-bottom: 22px; }
.vote-options { display: flex; flex-direction: column; gap: 8px; }
.vote-option {
  padding: 13px 16px; border-radius: var(--r-md);
  border: 1px solid var(--border-2);
  background: var(--bg-raised); font-size: 14px; font-weight: 500;
  text-align: left; color: var(--text); cursor: pointer;
  transition: all 0.15s; display: flex; align-items: center; gap: 10px;
}
.vote-option:hover { border-color: var(--accent); background: var(--accent-dim); }
.vote-option.selected { border-color: var(--accent); background: var(--accent-dim); color: var(--accent); }
.vote-submit {
  margin-top: 18px; width: 100%; padding: 13px;
  border-radius: var(--r-md); border: none;
  background: var(--accent); color: #fff;
  font-size: 14px; font-weight: 700; font-family: var(--sans);
  transition: all 0.15s;
}
.vote-submit:hover:not(:disabled) { background: var(--accent-h); transform: translateY(-1px); }
.vote-submit:disabled { opacity: 0.3; cursor: not-allowed; }

/* ── SURVEY (participate) ───────────── */
.survey-container { max-width: 500px; margin: 48px auto; }
.survey-card {
  background: var(--bg-2);
  border-radius: var(--r-xl); border: 1px solid var(--border-2); padding: 32px;
}
.progress-bar { height: 3px; background: var(--border); border-radius: var(--r-pill); margin-bottom: 26px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--accent); border-radius: var(--r-pill); transition: width 0.4s; }

/* ── SUCCESS ─────────────────────────── */
.success-card {
  background: var(--bg-2); border-radius: var(--r-xl);
  border: 1px solid var(--border-2); padding: 52px 40px; text-align: center;
}
.checkmark {
  width: 52px; height: 52px; border-radius: 14px;
  background: var(--green-dim); color: var(--green);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 18px; border: 1px solid rgba(34,197,94,0.3);
  font-size: 22px;
}

/* ── POLL DETAIL ─────────────────────── */
.poll-detail { max-width: 720px; margin: 0 auto; }
.poll-detail-hero {
  background: var(--bg-2); border-radius: var(--r-xl);
  border: 1px solid var(--border-2); padding: 28px 32px; margin-bottom: 16px;
}
.poll-detail-title { font-size: 20px; font-weight: 800; margin-bottom: 10px; }
.poll-detail-meta { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

.share-box {
  background: var(--bg-2); border-radius: var(--r-lg);
  border: 1px solid var(--border); padding: 22px; margin-bottom: 14px;
}
.share-box-label { font-family: var(--mono); font-size: 10px; color: var(--text-3); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 10px; }
.share-row { display: flex; gap: 8px; align-items: center; }
.room-code {
  font-family: var(--mono); font-size: 28px; font-weight: 600;
  color: var(--accent); letter-spacing: 0.15em;
}

/* ── RESULTS ─────────────────────────── */
.results-card {
  background: var(--bg-2); border-radius: var(--r-lg);
  border: 1px solid var(--border); padding: 22px; margin-bottom: 12px;
}
.results-question-title { font-size: 15px; font-weight: 700; margin-bottom: 14px; }
.option-bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.option-bar-label { min-width: 110px; font-size: 13px; font-weight: 500; color: var(--text-2); }
.option-bar-track { flex: 1; height: 7px; background: var(--bg-raised); border-radius: var(--r-pill); overflow: hidden; }
.option-bar-fill { height: 100%; background: var(--accent); border-radius: var(--r-pill); transition: width 0.6s; }
.option-bar-count { min-width: 60px; text-align: right; font-family: var(--mono); font-size: 11px; color: var(--text-3); }

.chart-wrapper { max-width: 440px; margin: 0 auto; padding: 8px 0; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; margin-top: 16px; }
.stat-card { background: var(--bg-raised); border-radius: var(--r-md); border: 1px solid var(--border); padding: 14px; text-align: center; }
.stat-number { font-family: var(--mono); font-size: 24px; font-weight: 600; color: var(--accent); }
.stat-label  { font-size: 11px; color: var(--text-3); margin-top: 4px; font-weight: 600; }

/* ── AI CARD ─────────────────────────── */
.ai-card {
  background: linear-gradient(135deg, #12162A 0%, #0E1420 100%);
  border-radius: var(--r-lg); border: 1px solid rgba(99,102,241,0.25);
  padding: 20px; margin-bottom: 12px;
}
.ai-card-title {
  font-family: var(--mono); font-size: 10px; font-weight: 600;
  color: var(--accent); letter-spacing: 0.1em; text-transform: uppercase;
  margin-bottom: 10px; display: flex; align-items: center; gap: 6px;
}
.ai-card-text { font-size: 14px; line-height: 1.7; color: var(--text-2); }

/* ── LOGIN / WELCOME ─────────────────── */
.auth-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: var(--bg); padding: 20px;
  background-image:
    radial-gradient(ellipse at 20% 60%, rgba(99,102,241,0.07) 0%, transparent 55%),
    radial-gradient(ellipse at 80% 20%, rgba(34,197,94,0.04) 0%, transparent 55%);
}
.auth-card {
  background: var(--bg-2); border-radius: var(--r-xl);
  border: 1px solid var(--border-2); width: 100%; max-width: 380px;
  padding: 36px; text-align: center;
}
.auth-logo { font-size: 22px; font-weight: 800; color: var(--text); margin-bottom: 4px; margin-top: 10px; letter-spacing: -0.02em; }
.auth-desc { font-size: 13px; color: var(--text-2); margin-bottom: 24px; }
.auth-form { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
.auth-input {
  width: 100%; padding: 11px 14px; border-radius: var(--r-md);
  border: 1px solid var(--border-2); font-size: 14px; outline: none;
  background: var(--bg-raised); color: var(--text); font-family: var(--sans);
  transition: border-color 0.15s; text-align: center;
}
.auth-input:focus { border-color: var(--accent); }
.auth-input::placeholder { color: var(--text-3); }
.auth-toggle { font-size: 12px; color: var(--text-3); }
.auth-toggle span { color: var(--accent); font-weight: 600; cursor: pointer; }

/* Divider on landing */
.auth-divider { display: flex; align-items: center; gap: 10px; margin: 18px 0; }
.auth-divider::before, .auth-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
.auth-divider span { font-size: 11px; color: var(--text-3); font-family: var(--mono); letter-spacing: 0.06em; }

.room-input-row { display: flex; gap: 8px; }
.room-input {
  flex: 1; padding: 11px 14px; border-radius: var(--r-md);
  border: 1px solid var(--border-2); font-size: 16px; outline: none;
  background: var(--bg-raised); color: var(--text); font-family: var(--mono);
  text-transform: uppercase; letter-spacing: 0.12em; text-align: center;
  transition: border-color 0.15s;
}
.room-input:focus { border-color: var(--accent); }
.room-input::placeholder { color: var(--text-3); letter-spacing: 0.04em; font-size: 13px; text-transform: none; }

/* ── MODAL ───────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-card {
  background: var(--bg-2); border-radius: var(--r-xl);
  border: 1px solid var(--border-2);
  padding: 28px; max-width: 400px; width: 90%;
}
.modal-title { font-size: 17px; font-weight: 700; margin-bottom: 14px; }

/* ── USER BADGE ──────────────────────── */
.user-badge {
  display: flex; align-items: center; gap: 8px;
  padding: 4px 4px 4px 10px; border-radius: var(--r-pill);
  border: 1px solid var(--border); cursor: pointer; transition: all 0.15s; margin-left: 8px;
}
.user-badge:hover { background: var(--bg-raised); border-color: var(--border-2); }
.user-badge-name { font-size: 12px; font-weight: 600; color: var(--text-2); }
.user-badge-avatar {
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--accent); display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; color: #fff;
}

/* ── ANALYTICS ───────────────────────── */
.analytics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 28px; }
.analytics-stat {
  background: var(--bg-2); border-radius: var(--r-lg);
  border: 1px solid var(--border); padding: 20px;
}
.analytics-number { font-family: var(--mono); font-size: 32px; font-weight: 600; color: var(--accent); margin-bottom: 4px; }
.analytics-label  { font-size: 13px; color: var(--text-2); }

/* ── SCROLLBAR ───────────────────────── */
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--border-2); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--border-3); }
html, body { overflow-x: hidden; }

/* ── ANIMATIONS ──────────────────────── */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(10px) scale(0.99); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
```

- [ ] **Шаг 2: Проверить в браузере**

Открой `http://localhost:5173` — шрифт должен смениться на Manrope, фон стать холодным `#0C0E14`, все синие вместо терракотового.

---

## Task 5: Переписать PollContext

**Files:**
- Modify: `src/context/PollContext.jsx`

- [ ] **Шаг 1: Заменить содержимое PollContext.jsx**

```jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getUser, signout as apiSignout } from '../api/auth.js'
import * as pollsApi from '../api/polls.js'

const PollContext = createContext()

const DEFAULT_TEMPLATES = [
  {
    id: 'tpl1', name: 'Ретроспектива спринта', type: 'SURVEY',
    pages: [
      { pageOrder: 1, question: 'Что прошло хорошо?', questionType: 'TEXT', options: [], required: false },
      { pageOrder: 2, question: 'Что можно улучшить?', questionType: 'TEXT', options: [], required: false },
      { pageOrder: 3, question: 'Оцените спринт', questionType: 'SINGLE_CHOICE', options: ['⭐ 1', '⭐ 2', '⭐ 3', '⭐ 4', '⭐ 5'], required: true },
    ],
  },
  {
    id: 'tpl2', name: 'Пульс-чек команды', type: 'SURVEY',
    pages: [
      { pageOrder: 1, question: 'Как вы себя чувствуете?', questionType: 'SINGLE_CHOICE', options: ['Отлично', 'Хорошо', 'Нормально', 'Устал'], required: true },
      { pageOrder: 2, question: 'Есть ли блокеры?', questionType: 'TEXT', options: [], required: false },
    ],
  },
  {
    id: 'tpl3', name: 'Обратная связь по мероприятию', type: 'SURVEY',
    pages: [
      { pageOrder: 1, question: 'Как прошло мероприятие?', questionType: 'SINGLE_CHOICE', options: ['Потрясающе', 'Хорошо', 'Средне', 'Плохо'], required: true },
      { pageOrder: 2, question: 'Что понравилось больше всего?', questionType: 'TEXT', options: [], required: false },
      { pageOrder: 3, question: 'Предложения на будущее?', questionType: 'TEXT', options: [], required: false },
    ],
  },
]

export function PollProvider({ children }) {
  const [user, setUserState] = useState(() => getUser())
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const templates = DEFAULT_TEMPLATES

  const loadPolls = useCallback(async () => {
    if (!user) { setPolls([]); return }
    setLoading(true)
    try {
      const data = await pollsApi.listPolls()
      setPolls(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { loadPolls() }, [loadPolls])

  const setUser = (u) => setUserState(u)

  const signout = () => {
    apiSignout()
    setUserState(null)
    setPolls([])
  }

  const addPoll = async (data) => {
    const poll = await pollsApi.createPoll(data)
    setPolls(prev => [poll, ...prev])
    return poll
  }

  const publish = async (id) => {
    const poll = await pollsApi.publishPoll(id)
    setPolls(prev => prev.map(p => p.id === id ? poll : p))
    return poll
  }

  const getPoll = (id) => polls.find(p => p.id === id) ?? null

  const deletePoll = async (id) => {
    await pollsApi.deletePoll(id)
    setPolls(prev => prev.filter(p => p.id !== id))
  }

  const duplicatePoll = async (id) => {
    const poll = await pollsApi.duplicatePoll(id)
    setPolls(prev => [poll, ...prev])
    return poll
  }

  const useTemplate = async (template) => {
    const poll = await addPoll({
      type: template.type,
      title: template.name,
      pages: template.pages,
    })
    return poll
  }

  return (
    <PollContext.Provider value={{
      user, setUser, signout,
      polls, loading, error, loadPolls,
      templates,
      addPoll, publish, getPoll, deletePoll, duplicatePoll, useTemplate,
    }}>
      {children}
    </PollContext.Provider>
  )
}

export const usePoll = () => useContext(PollContext)
```

---

## Task 6: Новые маршруты в App.jsx

**Files:**
- Modify: `src/App.jsx`
- Delete content of: `src/pages/Templates.jsx` (заменяем на редирект)
- Delete content of: `src/pages/Results.jsx` (заменяем на редирект)

- [ ] **Шаг 1: Заменить App.jsx**

```jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { usePoll } from './context/PollContext'
import Dashboard from './pages/Dashboard'
import CreatePoll from './pages/CreatePoll'
import CreateVote from './pages/CreateVote'
import PollDetail from './pages/PollDetail'
import Join from './pages/Join'
import Thanks from './pages/Thanks'
import Analytics from './pages/Analytics'
import Login from './pages/Login'
import Welcome from './pages/Welcome'
import Layout from './components/Layout'

export default function App() {
  const { user } = usePoll()

  return (
    <>
      {!user ? (
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/join/:roomCode" element={<Join />} />
          <Route path="/thanks" element={<Thanks />} />
          {/* legacy redirects */}
          <Route path="/poll/:id" element={<Join />} />
          <Route path="/vote/:id" element={<Join />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create/poll" element={<CreatePoll />} />
            <Route path="/create/vote" element={<CreateVote />} />
            <Route path="/poll/:id" element={<PollDetail />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/join/:roomCode" element={<Join />} />
            <Route path="/thanks" element={<Thanks />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      )}
    </>
  )
}
```

- [ ] **Шаг 2: Обновить Layout.jsx**

```jsx
import { Link, useLocation } from 'react-router-dom'
import { usePoll } from '../context/PollContext'
import { HomeSimple, StatsReport, Plus } from 'iconoir-react'

function NavLink({ to, children, icon: Icon }) {
  const location = useLocation()
  const active = location.pathname === to || location.pathname.startsWith(to + '/')
  return (
    <Link to={to} className={`nav-link${active ? ' active' : ''}`}>
      {Icon && <Icon width={14} height={14} />}
      {children}
    </Link>
  )
}

export default function Layout({ children }) {
  const { user, signout } = usePoll()
  const initials = user?.nickname?.slice(0, 2).toUpperCase() || '?'

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none' }}>
          <div className="logo-mark">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="10" width="3" height="6" rx="1" fill="white"/>
              <rect x="7.5" y="5" width="3" height="11" rx="1" fill="white"/>
              <rect x="13" y="2" width="3" height="14" rx="1" fill="white"/>
            </svg>
          </div>
          <span className="logo-text">PulseRoom</span>
        </Link>

        <nav className="nav">
          <NavLink to="/" icon={HomeSimple}>Дашборд</NavLink>
          <NavLink to="/create/poll" icon={Plus}>Создать</NavLink>
          <NavLink to="/analytics" icon={StatsReport}>Аналитика</NavLink>
          {user && (
            <div className="user-badge" onClick={signout} title="Выйти">
              <span className="user-badge-name">{user.nickname}</span>
              <div className="user-badge-avatar">{initials}</div>
            </div>
          )}
        </nav>
      </header>

      <main className="content">{children}</main>
    </div>
  )
}
```

---

## Task 7: Welcome — лендинг с кодом комнаты

**Files:**
- Modify: `src/pages/Welcome.jsx`

- [ ] **Шаг 1: Заменить Welcome.jsx**

```jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'iconoir-react'

export default function Welcome() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleJoin = (e) => {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length < 4) { setError('Введите код комнаты'); return }
    navigate(`/join/${trimmed}`)
  }

  return (
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
            <div className="logo-mark" style={{ width: '36px', height: '36px' }}>
              <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="10" width="3" height="6" rx="1" fill="white"/>
                <rect x="7.5" y="5" width="3" height="11" rx="1" fill="white"/>
                <rect x="13" y="2" width="3" height="14" rx="1" fill="white"/>
              </svg>
            </div>
            <span style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em' }}>PulseRoom</span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.6 }}>
            Создавайте опросы за минуты.<br/>Получайте не просто данные — получайте выводы.
          </p>
        </div>

        <div className="auth-card">
          <p style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Участник? Введите код
          </p>
          <form onSubmit={handleJoin}>
            <div className="room-input-row">
              <input
                className="room-input"
                placeholder="ABC12"
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
                maxLength={6}
              />
              <button type="submit" className="btn btn-primary">
                <ArrowRight width={16} height={16} />
              </button>
            </div>
            {error && <p style={{ fontSize: '12px', color: 'var(--red)', marginTop: '8px' }}>{error}</p>}
          </form>

          <div className="auth-divider"><span>или</span></div>

          <Link to="/login" className="btn btn-outline btn-block" style={{ fontSize: '13px' }}>
            Войти как организатор
          </Link>
        </div>
      </div>
    </div>
  )
}
```

---

## Task 8: Login

**Files:**
- Modify: `src/pages/Login.jsx`

- [ ] **Шаг 1: Заменить Login.jsx**

```jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usePoll } from '../context/PollContext'
import { signup, signin } from '../api/auth.js'

export default function Login() {
  const { setUser } = usePoll()
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [isNew, setIsNew] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    if (!nickname.trim()) return
    setLoading(true); setError('')
    try {
      const user = isNew ? await signup(nickname.trim()) : await signin(nickname.trim())
      setUser(user)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo-mark" style={{ width: '36px', height: '36px', margin: '0 auto 12px' }}>
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="10" width="3" height="6" rx="1" fill="white"/>
            <rect x="7.5" y="5" width="3" height="11" rx="1" fill="white"/>
            <rect x="13" y="2" width="3" height="14" rx="1" fill="white"/>
          </svg>
        </div>
        <p className="auth-logo">PulseRoom</p>
        <p className="auth-desc">{isNew ? 'Создайте аккаунт' : 'Войдите в аккаунт'}</p>

        <form className="auth-form" onSubmit={handle}>
          <input
            className="auth-input"
            placeholder="Ваш никнейм"
            value={nickname}
            onChange={e => { setNickname(e.target.value); setError('') }}
            autoFocus
          />
          {error && <p style={{ fontSize: '12px', color: 'var(--red)', textAlign: 'center' }}>{error}</p>}
          <button className="btn btn-primary btn-block" type="submit" disabled={loading || !nickname.trim()}>
            {loading ? 'Подождите...' : isNew ? 'Создать аккаунт' : 'Войти'}
          </button>
        </form>

        <p className="auth-toggle">
          {isNew ? 'Уже есть аккаунт? ' : 'Нет аккаунта? '}
          <span onClick={() => { setIsNew(!isNew); setError('') }}>
            {isNew ? 'Войти' : 'Создать'}
          </span>
        </p>

        <div className="auth-divider" style={{ marginTop: '18px' }}><span>участник?</span></div>
        <Link to="/" style={{ fontSize: '12px', color: 'var(--text-3)', textDecoration: 'none', display: 'block', textAlign: 'center' }}>
          Войти по коду комнаты →
        </Link>
      </div>
    </div>
  )
}
```

---

## Task 9: Dashboard

**Files:**
- Modify: `src/pages/Dashboard.jsx`

- [ ] **Шаг 1: Заменить Dashboard.jsx**

```jsx
import { Link } from 'react-router-dom'
import { usePoll } from '../context/PollContext'
import { Plus, Notes, StatsUpSquare, Copy, Trash, StatsReport } from 'iconoir-react'

export default function Dashboard() {
  const { polls, duplicatePoll, deletePoll, loading } = usePoll()

  if (loading) return (
    <div style={{ color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: '13px', padding: '60px 0', textAlign: 'center' }}>
      Загрузка...
    </div>
  )

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Дашборд</h1>
          <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>
            {polls.length} {polls.length === 1 ? 'опрос' : polls.length < 5 ? 'опроса' : 'опросов'}
          </p>
        </div>
        <div className="dashboard-actions">
          <Link to="/create/poll" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus width={15} height={15} /> Создать
          </Link>
        </div>
      </div>

      {polls.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><StatsReport width={24} height={24} /></div>
          <p className="empty-title">Нет опросов</p>
          <p className="empty-text">Создайте первый опрос или голосование</p>
          <Link to="/create/poll" className="btn btn-primary">
            <Plus width={15} height={15} /> Создать опрос
          </Link>
        </div>
      ) : (
        <div className="polls-grid">
          {polls.map(poll => {
            const statusLabel = { DRAFT: 'Черновик', PUBLISHED: 'Активен', CLOSED: 'Закрыт' }[poll.status] || poll.status
            const statusClass = { DRAFT: 'badge-draft', PUBLISHED: 'badge-published', CLOSED: 'badge-closed' }[poll.status] || 'badge-draft'
            const responseCount = poll.type === 'VOTE'
              ? (poll.pages?.[0]?.options?.reduce((sum, opt) => sum + (poll.votes?.[opt] || 0), 0) || 0)
              : 0

            return (
              <div key={poll.id} className="poll-card">
                <div className="poll-card-body">
                  <div className="poll-card-header">
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span className={`badge ${poll.type === 'VOTE' ? 'badge-vote' : 'badge-survey'}`}>
                        {poll.type === 'VOTE'
                          ? <><StatsUpSquare width={10} height={10} /> Голосование</>
                          : <><Notes width={10} height={10} /> Опрос</>}
                      </span>
                      <span className={`badge ${statusClass}`}>{statusLabel}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-3)' }}>
                      {new Date(poll.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>

                  <p className="poll-card-title">{poll.title}</p>

                  <div className="poll-card-meta">
                    <span>{poll.pages?.length || 0} вопросов</span>
                    {poll.room_code && (
                      <>
                        <span>·</span>
                        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{poll.room_code}</span>
                      </>
                    )}
                  </div>

                  <div className="poll-card-actions">
                    <Link to={`/poll/${poll.id}`} className="btn btn-primary btn-sm">
                      Открыть
                    </Link>
                    <Link to={`/poll/${poll.id}`} className="btn btn-outline btn-sm">
                      <StatsReport width={13} height={13} /> Итоги
                    </Link>
                    <button className="btn btn-ghost btn-sm" onClick={() => duplicatePoll(poll.id)} title="Дублировать">
                      <Copy width={13} height={13} />
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Удалить опрос?')) deletePoll(poll.id) }} title="Удалить">
                      <Trash width={13} height={13} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

---

## Task 10: CreatePoll — три вкладки

**Files:**
- Modify: `src/pages/CreatePoll.jsx`

- [ ] **Шаг 1: Заменить CreatePoll.jsx**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePoll } from '../context/PollContext'
import { generatePoll } from '../api/ai.js'

export default function CreatePoll() {
  const { addPoll, templates, useTemplate } = usePoll()
  const navigate = useNavigate()
  const [tab, setTab] = useState('manual') // manual | ai | template
  const [title, setTitle] = useState('')
  const [pages, setPages] = useState([{ pageOrder: 1, question: '', questionType: 'SINGLE_CHOICE', options: ['', ''], required: true }])
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')

  const addPage = () => setPages(prev => [...prev, {
    pageOrder: prev.length + 1, question: '', questionType: 'SINGLE_CHOICE', options: ['', ''], required: true
  }])

  const removePage = (i) => { if (pages.length > 1) setPages(prev => prev.filter((_, idx) => idx !== i)) }

  const updatePage = (i, field, value) => {
    setPages(prev => prev.map((p, idx) => {
      if (idx !== i) return p
      const updated = { ...p, [field]: value }
      if (field === 'questionType' && value === 'TEXT') updated.options = []
      if (field === 'questionType' && value !== 'TEXT' && p.options.length === 0) updated.options = ['', '']
      return updated
    }))
  }

  const updateOption = (pi, oi, value) => {
    setPages(prev => prev.map((p, idx) => {
      if (idx !== pi) return p
      const options = [...p.options]
      options[oi] = value
      return { ...p, options }
    }))
  }

  const addOption = (pi) => setPages(prev => prev.map((p, idx) => idx !== pi ? p : { ...p, options: [...p.options, ''] }))
  const removeOption = (pi, oi) => setPages(prev => prev.map((p, idx) => idx !== pi ? p : { ...p, options: p.options.length > 2 ? p.options.filter((_, i) => i !== oi) : p.options }))

  const handleManualSubmit = async () => {
    if (!title.trim()) { setError('Введите название'); return }
    const cleanPages = pages.map((p, i) => ({
      ...p,
      pageOrder: i + 1,
      options: p.questionType !== 'TEXT' ? p.options.filter(o => o.trim()) : [],
    }))
    const poll = await addPoll({ type: 'SURVEY', title, pages: cleanPages })
    navigate(`/poll/${poll.id}`)
  }

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) { setError('Введите описание'); return }
    setAiLoading(true); setError('')
    try {
      const generated = await generatePoll(aiPrompt, 'SURVEY', 5)
      const poll = await addPoll(generated)
      navigate(`/poll/${poll.id}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setAiLoading(false)
    }
  }

  const handleUseTemplate = async (tpl) => {
    const poll = await useTemplate(tpl)
    navigate(`/poll/${poll.id}`)
  }

  return (
    <div className="form-container">
      <h1 className="form-title">Создание опроса</h1>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'manual' ? 'active' : ''}`} onClick={() => setTab('manual')}>Вручную</button>
        <button className={`tab-btn ${tab === 'ai' ? 'active' : ''}`} onClick={() => setTab('ai')}>AI-генерация</button>
        <button className={`tab-btn ${tab === 'template' ? 'active' : ''}`} onClick={() => setTab('template')}>Шаблон</button>
      </div>

      {error && <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

      {tab === 'manual' && (
        <>
          <div className="form-card">
            <label className="form-label">Название опроса</label>
            <input className="form-input" placeholder="Ретроспектива спринта" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          {pages.map((page, i) => (
            <div key={i} className="form-card step-card">
              <div className="step-header">
                <span className="form-label" style={{ marginBottom: 0 }}>Вопрос {i + 1}</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select className="form-select" value={page.questionType} onChange={e => updatePage(i, 'questionType', e.target.value)}>
                    <option value="SINGLE_CHOICE">Один вариант</option>
                    <option value="MULTIPLE_CHOICE">Несколько вариантов</option>
                    <option value="TEXT">Открытый ответ</option>
                  </select>
                  {pages.length > 1 && <button className="btn-remove" onClick={() => removePage(i)}>×</button>}
                </div>
              </div>
              <input className="form-input" placeholder="Введите вопрос" value={page.question} onChange={e => updatePage(i, 'question', e.target.value)} />

              {page.questionType !== 'TEXT' && (
                <div>
                  <label className="form-label">Варианты ответа</label>
                  {page.options.map((opt, oi) => (
                    <div key={oi} className="option-row">
                      <input className="form-input" style={{ marginBottom: 0 }} placeholder={`Вариант ${oi + 1}`} value={opt} onChange={e => updateOption(i, oi, e.target.value)} />
                      {page.options.length > 2 && <button className="btn-remove" onClick={() => removeOption(i, oi)}>×</button>}
                    </div>
                  ))}
                  <button className="btn-add" onClick={() => addOption(i)}>+ Добавить вариант</button>
                </div>
              )}
            </div>
          ))}

          <button className="btn-add" onClick={addPage} style={{ marginBottom: '20px', fontSize: '14px' }}>+ Добавить вопрос</button>
          <br />
          <button className="btn btn-primary btn-lg" onClick={handleManualSubmit}>Создать опрос</button>
        </>
      )}

      {tab === 'ai' && (
        <div className="form-card">
          <label className="form-label">Опишите опрос</label>
          <textarea
            className="form-textarea"
            placeholder="Например: опрос для оценки удовлетворённости онлайн-курсом по программированию"
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
          />
          <p style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '16px' }}>
            AI сгенерирует 5 вопросов на основе вашего описания
          </p>
          <button className="btn btn-primary btn-lg" onClick={handleAIGenerate} disabled={aiLoading}>
            {aiLoading ? 'Генерирую...' : 'Сгенерировать опрос'}
          </button>
        </div>
      )}

      {tab === 'template' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {templates.map(tpl => (
            <div key={tpl.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontWeight: 700, fontSize: '14px' }}>{tpl.name}</p>
              <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-3)' }}>
                {tpl.pages?.length || 0} вопросов
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => handleUseTemplate(tpl)}>
                Использовать
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Шаг 2: Обновить CreateVote.jsx**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePoll } from '../context/PollContext'

export default function CreateVote() {
  const { addPoll } = usePoll()
  const navigate = useNavigate()
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])

  const addOption = () => setOptions(prev => [...prev, ''])
  const removeOption = (i) => { if (options.length > 2) setOptions(prev => prev.filter((_, idx) => idx !== i)) }
  const updateOption = (i, v) => setOptions(prev => prev.map((o, idx) => idx === i ? v : o))

  const handleSubmit = async () => {
    if (!question.trim() || options.some(o => !o.trim())) return
    const poll = await addPoll({
      type: 'VOTE',
      title: question,
      pages: [{
        pageOrder: 1,
        question,
        questionType: 'SINGLE_CHOICE',
        options: options.filter(o => o.trim()),
        required: true,
      }],
    })
    navigate(`/poll/${poll.id}`)
  }

  return (
    <div className="form-container">
      <h1 className="form-title">Создание голосования</h1>
      <div className="form-card">
        <label className="form-label">Вопрос</label>
        <input className="form-input" placeholder="Какую фичу делаем следующей?" value={question} onChange={e => setQuestion(e.target.value)} />
        <label className="form-label">Варианты ответа</label>
        {options.map((opt, i) => (
          <div key={i} className="option-row">
            <input className="form-input" style={{ marginBottom: 0 }} placeholder={`Вариант ${i + 1}`} value={opt} onChange={e => updateOption(i, e.target.value)} />
            {options.length > 2 && <button className="btn-remove" onClick={() => removeOption(i)}>×</button>}
          </div>
        ))}
        <button className="btn-add" onClick={addOption}>+ Добавить вариант</button>
      </div>
      <button className="btn btn-primary btn-lg" onClick={handleSubmit}>Создать голосование</button>
    </div>
  )
}
```

---

## Task 11: PollDetail — детали опроса (share + результаты)

**Files:**
- Create: `src/pages/PollDetail.jsx`

- [ ] **Шаг 1: Создать src/pages/PollDetail.jsx**

```jsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { usePoll } from '../context/PollContext'
import { publishPoll } from '../api/polls.js'
import { getResults, exportJSON, exportCSV, downloadCSV } from '../api/results.js'
import { summarize } from '../api/ai.js'
import { Bar } from 'react-chartjs-2'
import { QRCodeSVG } from 'qrcode.react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Copy, Download, QrCode, BrainResearch } from 'iconoir-react'
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function PollDetail() {
  const { id } = useParams()
  const { polls, loadPolls } = usePoll()
  const poll = polls.find(p => p.id === id)
  const [responses, setResponses] = useState([])
  const [aiSummary, setAiSummary] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [copied, setCopied] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const joinLink = poll ? `${window.location.origin}/join/${poll.room_code}` : ''

  useEffect(() => {
    if (!poll) return
    getResults(poll.id).then(setResponses).catch(() => {})
  }, [poll])

  const handleCopy = () => {
    navigator.clipboard.writeText(joinLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePublish = async () => {
    setPublishing(true)
    try {
      await publishPoll(id)
      await loadPolls()
    } finally {
      setPublishing(false)
    }
  }

  const handleAI = async () => {
    setAiLoading(true)
    try {
      const text = await summarize(poll, responses)
      setAiSummary(text)
    } finally {
      setAiLoading(false)
    }
  }

  const handleDownloadCSV = async () => {
    const data = await exportJSON(id)
    const csv = exportCSV(data.map(r => ({ ...r, answers: r.answers })), poll.pages || [])
    downloadCSV(csv, `${poll.title}.csv`)
  }

  const handleDownloadJSON = async () => {
    const data = await exportJSON(id)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${poll.title}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  if (!poll) return (
    <div style={{ color: 'var(--text-3)', fontFamily: 'var(--mono)', padding: '60px 0', textAlign: 'center' }}>
      Опрос не найден
    </div>
  )

  const statusLabel = { DRAFT: 'Черновик', PUBLISHED: 'Активен', CLOSED: 'Закрыт' }[poll.status] || poll.status
  const statusClass = { DRAFT: 'badge-draft', PUBLISHED: 'badge-published', CLOSED: 'badge-closed' }[poll.status] || 'badge-draft'

  return (
    <div className="poll-detail">
      {/* Hero */}
      <div className="poll-detail-hero">
        <div className="poll-detail-meta" style={{ marginBottom: '10px' }}>
          <span className={`badge ${statusClass}`}>{statusLabel}</span>
          <span className={`badge ${poll.type === 'VOTE' ? 'badge-vote' : 'badge-survey'}`}>
            {poll.type === 'VOTE' ? 'Голосование' : 'Опрос'}
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-3)' }}>
            {new Date(poll.created_at).toLocaleDateString('ru-RU')}
          </span>
        </div>
        <h1 className="poll-detail-title">{poll.title}</h1>
        {poll.status === 'DRAFT' && (
          <button className="btn btn-primary" onClick={handlePublish} disabled={publishing}>
            {publishing ? 'Публикую...' : 'Опубликовать'}
          </button>
        )}
      </div>

      {/* Share */}
      <div className="share-box">
        <p className="share-box-label">Поделиться с участниками</p>
        <div style={{ marginBottom: '14px' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--mono)', marginBottom: '6px' }}>Код комнаты</p>
          <div className="room-code">{poll.room_code}</div>
        </div>
        <div className="share-row">
          <input
            className="form-input"
            style={{ marginBottom: 0, flex: 1, fontFamily: 'var(--mono)', fontSize: '12px' }}
            value={joinLink} readOnly
          />
          <button className="btn btn-outline btn-sm" onClick={handleCopy} style={{ flexShrink: 0 }}>
            <Copy width={13} height={13} /> {copied ? 'Скопировано!' : 'Копировать'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={() => setShowQR(!showQR)}>
            <QrCode width={13} height={13} /> QR-код
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleDownloadCSV}>
            <Download width={13} height={13} /> CSV
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleDownloadJSON}>
            <Download width={13} height={13} /> JSON
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleAI} disabled={aiLoading}>
            <BrainResearch width={13} height={13} /> {aiLoading ? 'Анализирую...' : 'AI-анализ'}
          </button>
        </div>

        {showQR && (
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <QRCodeSVG value={joinLink} size={160} level="M" fgColor="#E8EAED" bgColor="#1C2030" />
            <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-3)', marginTop: '8px' }}>
              Наведите камеру телефона
            </p>
          </div>
        )}
      </div>

      {/* AI Summary */}
      {aiSummary && (
        <div className="ai-card">
          <p className="ai-card-title"><BrainResearch width={12} height={12} /> AI-анализ</p>
          <p className="ai-card-text">{aiSummary}</p>
        </div>
      )}

      {/* Results */}
      <div className="results-card">
        <p className="results-question-title">
          Результаты · {responses.length} {responses.length === 1 ? 'ответ' : responses.length < 5 ? 'ответа' : 'ответов'}
        </p>
        {responses.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
            Ответов пока нет. Поделитесь ссылкой!
          </p>
        ) : (
          poll.pages?.map((page, i) => {
            const answers = responses.map(r => r.answers.find(a => a.pageId === i + 1)).filter(Boolean)
            return (
              <div key={i} style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: 'var(--text-2)' }}>
                  {i + 1}. {page.question}
                </p>
                {page.questionType === 'TEXT' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {answers.map((a, ai) => a.textAnswer && (
                      <div key={ai} style={{ padding: '8px 12px', background: 'var(--bg-raised)', borderRadius: 'var(--r-sm)', fontSize: '13px', color: 'var(--text-2)' }}>
                        {a.textAnswer}
                      </div>
                    ))}
                  </div>
                ) : (
                  page.options?.map(opt => {
                    const count = answers.filter(a => (a.selectedOptions || []).includes(opt)).length
                    const pct = answers.length > 0 ? ((count / answers.length) * 100).toFixed(0) : 0
                    return (
                      <div key={opt} className="option-bar-row">
                        <span className="option-bar-label">{opt}</span>
                        <div className="option-bar-track">
                          <div className="option-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="option-bar-count">{count} ({pct}%)</span>
                      </div>
                    )
                  })
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
```

---

## Task 12: Join — участник проходит опрос

**Files:**
- Create: `src/pages/Join.jsx`

- [ ] **Шаг 1: Создать src/pages/Join.jsx**

```jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPollByRoomCode } from '../api/polls.js'
import { submitResponse } from '../api/responses.js'

export default function Join() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const [poll, setPoll] = useState(null)
  const [error, setError] = useState('')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [textInput, setTextInput] = useState('')
  const [nickname, setNickname] = useState('')

  useEffect(() => {
    if (!roomCode) return
    getPollByRoomCode(roomCode)
      .then(setPoll)
      .catch(() => setError('Опрос не найден или не опубликован'))
  }, [roomCode])

  if (error) return (
    <div className="survey-container">
      <div className="survey-card" style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Ошибка</p>
        <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>{error}</p>
      </div>
    </div>
  )

  if (!poll) return (
    <div className="survey-container">
      <div className="survey-card" style={{ textAlign: 'center', color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: '13px' }}>
        Загрузка...
      </div>
    </div>
  )

  const pages = poll.pages || []
  const currentPage = pages[step]
  const progress = pages.length > 0 ? ((step / pages.length) * 100) : 0

  const handleAnswer = async (answer) => {
    const newAnswers = {
      ...answers,
      [step]: { pageId: step + 1, ...answer },
    }
    setAnswers(newAnswers)
    setTextInput('')

    if (step < pages.length - 1) {
      setStep(step + 1)
    } else {
      const formatted = Object.values(newAnswers)
      await submitResponse(poll.id, formatted, nickname || null)
      navigate('/thanks')
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
      const prev = answers[step - 1]
      setTextInput(prev?.textAnswer || '')
    }
  }

  return (
    <div className="survey-container">
      <div className="survey-card">
        <div style={{ marginBottom: '6px' }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }}>
            {poll.title} · {step + 1} / {pages.length}
          </p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {!nickname && step === 0 && (
          <div style={{ marginBottom: '16px' }}>
            <input
              className="form-input"
              placeholder="Ваше имя (необязательно)"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
            />
          </div>
        )}

        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', lineHeight: 1.4 }}>
          {currentPage.question}
        </h3>

        {currentPage.questionType === 'TEXT' ? (
          <div>
            <textarea
              className="form-textarea"
              placeholder="Введите ваш ответ..."
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-primary"
                onClick={() => handleAnswer({ textAnswer: textInput, selectedOptions: [] })}
                disabled={!textInput.trim() && currentPage.required}
              >
                {step < pages.length - 1 ? 'Далее' : 'Завершить'}
              </button>
            </div>
          </div>
        ) : (
          <div className="vote-options">
            {currentPage.options?.map(opt => (
              <button key={opt} className="vote-option" onClick={() => handleAnswer({ selectedOptions: [opt], textAnswer: '' })}>
                {opt}
              </button>
            ))}
          </div>
        )}

        {step > 0 && (
          <button className="btn btn-ghost" onClick={handleBack} style={{ marginTop: '16px' }}>
            ← Назад
          </button>
        )}
      </div>
    </div>
  )
}
```

---

## Task 13: Thanks

**Files:**
- Create: `src/pages/Thanks.jsx`

- [ ] **Шаг 1: Создать src/pages/Thanks.jsx**

```jsx
import { Link } from 'react-router-dom'

export default function Thanks() {
  return (
    <div className="survey-container">
      <div className="success-card">
        <div className="checkmark">✓</div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Ответ принят!</h2>
        <p style={{ color: 'var(--text-2)', fontSize: '14px', marginBottom: '28px' }}>
          Спасибо за участие
        </p>
        <Link to="/" className="btn btn-outline">На главную</Link>
      </div>
    </div>
  )
}
```

---

## Task 14: Исправить Analytics, TakePoll, TakeVote

**Files:**
- Modify: `src/pages/Analytics.jsx`
- Modify: `src/pages/TakePoll.jsx`
- Modify: `src/pages/TakeVote.jsx`

- [ ] **Шаг 1: Исправить Analytics.jsx — заменить старые переменные**

В файле `src/pages/Analytics.jsx` заменить все вхождения:
- `var(--accent)` → оставить (теперь существует)
- `var(--accent-orange)` → `var(--amber)`
- `var(--text-muted)` → `var(--text-2)`
- `var(--text-secondary)` → `var(--text-2)`
- `var(--bg-hover)` → `var(--bg-raised)`

Также заменить `className="dashboard-title"` → убрать если нет в CSS или использовать `className="dashboard-title"` со стилем `{ fontSize: '24px', fontWeight: 800 }`.

Полная замена Analytics.jsx:

```jsx
import { usePoll } from '../context/PollContext'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

export default function Analytics() {
  const { polls } = usePoll()

  const totalPolls = polls.length
  const surveysCount = polls.filter(p => p.type === 'SURVEY').length
  const votesCount = polls.filter(p => p.type === 'VOTE').length
  const publishedCount = polls.filter(p => p.status === 'PUBLISHED').length

  const chartColors = { plugins: { legend: { labels: { color: 'rgba(232,234,237,0.55)', font: { family: 'JetBrains Mono' } } } } }
  const scaleColors = {
    scales: {
      y: { beginAtZero: true, ticks: { color: 'rgba(232,234,237,0.4)', font: { family: 'JetBrains Mono', size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
      x: { ticks: { color: 'rgba(232,234,237,0.4)', font: { family: 'JetBrains Mono', size: 11 } }, grid: { display: false } },
    },
  }

  return (
    <div>
      <div style={{ marginBottom: '28px', animation: 'fadeInUp 0.35s ease both' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '4px' }}>Аналитика</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>Сводка по всем опросам</p>
      </div>

      <div className="analytics-grid">
        <div className="analytics-stat">
          <div className="analytics-number">{totalPolls}</div>
          <div className="analytics-label">Всего опросов</div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-number">{surveysCount}</div>
          <div className="analytics-label">Опросов</div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-number">{votesCount}</div>
          <div className="analytics-label">Голосований</div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-number" style={{ color: 'var(--green)' }}>{publishedCount}</div>
          <div className="analytics-label">Активных</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: 700 }}>Типы опросов</h3>
          <div style={{ maxWidth: '220px', margin: '0 auto' }}>
            <Doughnut
              data={{
                labels: ['Опросы', 'Голосования'],
                datasets: [{ data: [surveysCount, votesCount], backgroundColor: ['#6366F1', '#22C55E'], borderWidth: 0 }],
              }}
              options={{ plugins: { legend: { position: 'bottom', labels: { color: 'rgba(232,234,237,0.55)', font: { family: 'JetBrains Mono' } } } } }}
            />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: 700 }}>По статусам</h3>
          <Bar
            data={{
              labels: ['Черновик', 'Активен', 'Закрыт'],
              datasets: [{
                label: 'Опросы',
                data: [
                  polls.filter(p => p.status === 'DRAFT').length,
                  polls.filter(p => p.status === 'PUBLISHED').length,
                  polls.filter(p => p.status === 'CLOSED').length,
                ],
                backgroundColor: ['rgba(99,102,241,0.4)', '#6366F1', 'rgba(99,102,241,0.2)'],
                borderRadius: 6,
              }],
            }}
            options={{ responsive: true, ...chartColors, ...scaleColors, plugins: { ...chartColors.plugins, legend: { display: false } } }}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Шаг 2: Исправить TakePoll.jsx и TakeVote.jsx**

В `src/pages/TakePoll.jsx` заменить все inline стили с `var(--text-muted)` → `var(--text-2)`, `var(--bg-white)` → `var(--bg-raised)`, `var(--text-primary)` → `var(--text)`, `var(--text-secondary)` → `var(--text-2)`.

В `src/pages/TakeVote.jsx` то же самое.

Проверить что оба файла рендерятся без ошибок в браузере. Эти страницы теперь secondary — основной флоу участника через Join.jsx.

---

## Task 15: Деплой на Vercel + Supabase

**Files:**
- Create: `vercel.json`
- Create: `.env.example` (уже создан в Task 1)

- [ ] **Шаг 1: Создать vercel.json для SPA роутинга**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

- [ ] **Шаг 2: Задеплоить на Vercel**

```bash
# Установить Vercel CLI если нет
npm i -g vercel

# Из папки проекта
vercel

# Следовать инструкциям:
# - Set up and deploy: Y
# - Which scope: выбрать аккаунт
# - Link to existing project: N
# - Project name: pulseroom
# - Directory: ./
# - Override settings: N
```

- [ ] **Шаг 3: Добавить env переменные в Vercel**

В Vercel Dashboard → Settings → Environment Variables добавить:
```
VITE_SUPABASE_URL = значение из .env.local
VITE_SUPABASE_ANON_KEY = значение из .env.local
```

- [ ] **Шаг 4: Редеплоить с env переменными**

```bash
vercel --prod
```

- [ ] **Шаг 5: Проверить деплой**

Открой выданный URL в браузере. Создай тестовый аккаунт, создай опрос, опубликуй, скопируй ссылку, пройди опрос в инкогнито-вкладке.

Ожидаемый результат: полный флоу работает, данные в Supabase.

---

## Checklist финальной проверки

- [ ] Шрифт Manrope загружается, нет Playfair Display
- [ ] Цвет акцента — indigo `#6366F1`, нет терракотового
- [ ] Создание опроса → редирект на `/poll/:id` с share-блоком
- [ ] Код комнаты показан на странице опроса
- [ ] QR-код работает (тёмный фон + светлый контент)
- [ ] Участник может войти по коду на лендинге
- [ ] Участник проходит опрос по `/join/:roomCode`
- [ ] Ответ сохраняется в Supabase → видно в результатах
- [ ] CSV и JSON экспорт работают
- [ ] AI-анализ возвращает текст (мок)
- [ ] Analytics не показывает ошибок
- [ ] Vercel URL работает с любого устройства
