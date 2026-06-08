// Тонкая обёртка над fetch для Java-бэкенда.
// BASE берётся из VITE_API_URL; токен — из localStorage (см. auth.js).

const BASE = import.meta.env.VITE_API_URL || ''
const USER_KEY = 'pulseroom_user'

export function getToken() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw).token ?? null
  } catch {
    return null
  }
}

/**
 * @param {string} path путь от BASE, начиная со слэша
 * @param {object} [opts]
 * @param {string} [opts.method='GET']
 * @param {object} [opts.body] тело — сериализуется в JSON
 * @param {boolean} [opts.auth=false] добавить заголовок X-Auth-Token
 * @param {string} [opts.errorMessage] сообщение при !res.ok вместо тела ответа
 */
export async function request(path, { method = 'GET', body, auth = false, errorMessage } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const token = getToken()
    if (token) headers['X-Auth-Token'] = token
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  const data = text ? safeJson(text) : null

  if (!res.ok) {
    const message = errorMessage || data?.message || `Ошибка запроса (${res.status})`
    throw new Error(message)
  }
  return data
}

function safeJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}
