import { vi } from 'vitest'

// Мок fetch, возвращающий один ответ (как ждёт src/api/http.js: res.text()).
export function fetchResolving(data, { ok = true, status = 200 } = {}) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
  })
}

// Достаёт тело последнего вызова fetch как объект.
export function lastFetchBody(fetchMock) {
  const call = fetchMock.mock.calls.at(-1)
  return JSON.parse(call[1].body)
}

export function lastFetchUrl(fetchMock) {
  return fetchMock.mock.calls.at(-1)[0]
}

export function lastFetchInit(fetchMock) {
  return fetchMock.mock.calls.at(-1)[1]
}
