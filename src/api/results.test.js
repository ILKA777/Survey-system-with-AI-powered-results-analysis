import { describe, it, expect, beforeEach } from 'vitest'
import { getResults, exportJSON, exportCSV } from './results.js'
import { fetchResolving, lastFetchUrl, lastFetchInit } from '../test/utils.js'

const USER = { token: 'tok-1' }

const RESULTS = {
  rawResults: [
    { participantNickname: 'Вася', submittedAt: '2026-06-08T12:00:00Z',
      answers: [{ pageId: 1, selectedOptions: ['Хорошо'], textAnswer: '' },
                { pageId: 2, selectedOptions: [], textAnswer: 'Супер' }] },
    { participantNickname: '', submittedAt: '2026-06-08T12:01:00Z',
      answers: [{ pageId: 1, selectedOptions: ['Плохо'], textAnswer: '' }] },
  ],
  aiSummary: 'Всё хорошо',
}

const PAGES = [
  { id: 1, question: 'Как дела?', questionType: 'SINGLE_CHOICE', options: ['Хорошо', 'Плохо'] },
  { id: 2, question: 'Комментарий', questionType: 'TEXT', options: [] },
]

describe('results api', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('pulseroom_user', JSON.stringify(USER))
  })

  it('getResults идёт на admin results с токеном', async () => {
    globalThis.fetch = fetchResolving(RESULTS)
    const res = await getResults(5)
    expect(lastFetchUrl(globalThis.fetch)).toContain('/api/admin/polls/5/results')
    expect(lastFetchInit(globalThis.fetch).headers['X-Auth-Token']).toBe('tok-1')
    expect(res.aiSummary).toBe('Всё хорошо')
  })

  it('exportJSON нормализует rawResults (ник, дата, ответы)', async () => {
    globalThis.fetch = fetchResolving(RESULTS)
    const data = await exportJSON(5)
    expect(data).toHaveLength(2)
    expect(data[0]).toEqual({
      submittedAt: '2026-06-08T12:00:00Z',
      nickname: 'Вася',
      answers: RESULTS.rawResults[0].answers,
    })
    expect(data[1].nickname).toBe('Анонимно')
  })

  it('exportCSV матчит ответы по page.id, а не по индексу', () => {
    const rows = [
      { submittedAt: 't1', nickname: 'Вася',
        answers: [{ pageId: 1, selectedOptions: ['Хорошо'], textAnswer: '' },
                  { pageId: 2, selectedOptions: [], textAnswer: 'Супер' }] },
    ]
    const csv = exportCSV(rows, PAGES)
    const lines = csv.split('\n')
    expect(lines[0]).toContain('submitted_at')
    expect(lines[0]).toContain('q1: Как дела?')
    expect(lines[1]).toContain('Хорошо')
    expect(lines[1]).toContain('Супер')
  })

  it('exportCSV на пустых данных возвращает пустую строку', () => {
    expect(exportCSV([], PAGES)).toBe('')
  })
})
