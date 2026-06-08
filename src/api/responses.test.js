import { describe, it, expect, beforeEach } from 'vitest'
import { submitResponse } from './responses.js'
import { fetchResolving, lastFetchUrl, lastFetchInit, lastFetchBody } from '../test/utils.js'

describe('responses api', () => {
  beforeEach(() => localStorage.clear())

  it('submitResponse шлёт ответы по roomCode без токена', async () => {
    globalThis.fetch = fetchResolving({ message: 'Спасибо за прохождение опроса' })
    const answers = [{ pageId: 1, selectedOptions: ['Да'], textAnswer: '' }]
    const res = await submitResponse('ABCDE', answers, 'Вася')

    expect(lastFetchUrl(globalThis.fetch)).toContain('/api/participant/polls/room/ABCDE/submit')
    const init = lastFetchInit(globalThis.fetch)
    expect(init.method).toBe('POST')
    expect(init.headers['X-Auth-Token']).toBeUndefined()
    expect(lastFetchBody(globalThis.fetch)).toEqual({ nickname: 'Вася', answers })
    expect(res.message).toContain('Спасибо')
  })

  it('пустой ник превращается в пустую строку', async () => {
    globalThis.fetch = fetchResolving({ message: 'ok' })
    await submitResponse('ABCDE', [], null)
    expect(lastFetchBody(globalThis.fetch).nickname).toBe('')
  })
})
