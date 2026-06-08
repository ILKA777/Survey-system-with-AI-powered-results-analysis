import { request } from './http.js'

// Список опросов текущего админа (бэк фильтрует по токену).
export async function listPolls() {
  return request('/api/admin/polls', { auth: true })
}

// Получить опубликованный опрос участником по коду комнаты.
export async function getPollByRoomCode(roomCode) {
  return request(`/api/participant/polls/room/${encodeURIComponent(roomCode)}`, {
    errorMessage: 'Опрос не найден или не опубликован',
  })
}

// Создать опрос вручную. pollData: { type, title, description?, allowAnonymous?, pages }
export async function createPoll(pollData) {
  return request('/api/admin/polls', {
    method: 'POST',
    auth: true,
    body: {
      type: pollData.type,
      title: pollData.title,
      description: pollData.description ?? '',
      allowAnonymous: pollData.allowAnonymous ?? true,
      pages: pollData.pages,
    },
  })
}

export async function publishPoll(id) {
  return request(`/api/admin/polls/${id}/publish`, { method: 'POST', auth: true })
}
