import { request } from './http.js'

// AI-генерация опроса. Бэкенд сразу создаёт и сохраняет опрос,
// возвращая готовый PollResponse (со status: DRAFT, id, roomCode и т.д.).
export async function generatePoll(prompt, type = 'SURVEY', pagesCount = 5) {
  return request('/api/admin/polls/ai-generate', {
    method: 'POST',
    auth: true,
    body: { type, prompt, pagesCount },
  })
}

// Саммаризация результатов приходит готовой в getResults().aiSummary,
// поэтому отдельной ручки на фронте больше нет.
