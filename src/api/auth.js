import { request } from './http.js'

const USER_KEY = 'pulseroom_user'

export async function signup(nickname) {
  const data = await request('/api/auth/signup', {
    method: 'POST',
    body: { nickname },
  })
  localStorage.setItem(USER_KEY, JSON.stringify(data))
  return data
}

export async function signin(nickname) {
  const data = await request('/api/auth/signin', {
    method: 'POST',
    body: { nickname },
    errorMessage: 'Пользователь не найден',
  })
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
