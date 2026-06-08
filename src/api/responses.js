import { request } from './http.js'

// Отправка ответов участника. roomCode — код комнаты;
// answers: [{ pageId, selectedOptions, textAnswer }], где pageId — реальный id страницы.
export async function submitResponse(roomCode, answers, nickname = null) {
  return request(`/api/participant/polls/room/${encodeURIComponent(roomCode)}/submit`, {
    method: 'POST',
    body: { nickname: nickname || '', answers },
  })
}
