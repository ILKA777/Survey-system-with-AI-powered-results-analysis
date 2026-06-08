import { describe, it, expect, beforeEach } from 'vitest'
import { signup, signin, getUser, signout } from './auth.js'
import { fetchResolving, lastFetchUrl, lastFetchBody } from '../test/utils.js'

const USER = { userId: 1, nickname: 'Вася', anonymous: false, token: 'tok-1' }

describe('auth api', () => {
  beforeEach(() => localStorage.clear())

  it('signup шлёт ник на /signup и сохраняет пользователя', async () => {
    globalThis.fetch = fetchResolving(USER, { status: 201 })
    const res = await signup('Вася')

    expect(lastFetchUrl(globalThis.fetch)).toContain('/api/auth/signup')
    expect(lastFetchBody(globalThis.fetch)).toEqual({ nickname: 'Вася' })
    expect(res).toEqual(USER)
    expect(JSON.parse(localStorage.getItem('pulseroom_user'))).toEqual(USER)
  })

  it('signin сохраняет токен в localStorage', async () => {
    globalThis.fetch = fetchResolving(USER)
    await signin('Вася')
    expect(lastFetchUrl(globalThis.fetch)).toContain('/api/auth/signin')
    expect(getUser().token).toBe('tok-1')
  })

  it('signin на 404 бросает понятную ошибку', async () => {
    globalThis.fetch = fetchResolving({}, { ok: false, status: 404 })
    await expect(signin('Неизвестный')).rejects.toThrow('Пользователь не найден')
  })

  it('signout очищает пользователя', () => {
    localStorage.setItem('pulseroom_user', JSON.stringify(USER))
    expect(getUser()).toEqual(USER)
    signout()
    expect(getUser()).toBeNull()
  })
})
