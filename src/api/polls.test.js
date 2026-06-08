import { describe, it, expect, beforeEach } from 'vitest'
import { listPolls, createPoll, publishPoll, getPollByRoomCode } from './polls.js'
import { fetchResolving, lastFetchUrl, lastFetchInit, lastFetchBody } from '../test/utils.js'

const USER = { userId: 1, nickname: 'Вася', token: 'tok-1' }

describe('polls api', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('pulseroom_user', JSON.stringify(USER))
  })

  it('listPolls шлёт GET с токеном в X-Auth-Token', async () => {
    globalThis.fetch = fetchResolving([{ id: 1 }])
    const res = await listPolls()

    expect(lastFetchUrl(globalThis.fetch)).toContain('/api/admin/polls')
    expect(lastFetchInit(globalThis.fetch).headers['X-Auth-Token']).toBe('tok-1')
    expect(res).toEqual([{ id: 1 }])
  })

  it('createPoll шлёт POST с телом опроса и дефолтным allowAnonymous', async () => {
    globalThis.fetch = fetchResolving({ id: 7 }, { status: 201 })
    await createPoll({ type: 'SURVEY', title: 'T', pages: [{ question: 'Q' }] })

    const init = lastFetchInit(globalThis.fetch)
    expect(init.method).toBe('POST')
    expect(init.headers['X-Auth-Token']).toBe('tok-1')
    const body = lastFetchBody(globalThis.fetch)
    expect(body.type).toBe('SURVEY')
    expect(body.title).toBe('T')
    expect(body.allowAnonymous).toBe(true)
    expect(body.pages).toEqual([{ question: 'Q' }])
  })

  it('publishPoll бьёт по нужному URL методом POST', async () => {
    globalThis.fetch = fetchResolving({ id: 7, status: 'PUBLISHED' })
    await publishPoll(7)
    expect(lastFetchUrl(globalThis.fetch)).toContain('/api/admin/polls/7/publish')
    expect(lastFetchInit(globalThis.fetch).method).toBe('POST')
  })

  it('getPollByRoomCode идёт на участника без токена', async () => {
    globalThis.fetch = fetchResolving({ id: 1, roomCode: 'ABCDE' })
    await getPollByRoomCode('ABCDE')
    expect(lastFetchUrl(globalThis.fetch)).toContain('/api/participant/polls/room/ABCDE')
    expect(lastFetchInit(globalThis.fetch).headers['X-Auth-Token']).toBeUndefined()
  })

  it('getPollByRoomCode на 404 бросает понятную ошибку', async () => {
    globalThis.fetch = fetchResolving({}, { ok: false, status: 404 })
    await expect(getPollByRoomCode('XXXXX')).rejects.toThrow('Опрос не найден или не опубликован')
  })
})
