import { request } from './http.js'

// Полный объект результатов с бэка:
// { rawResults, aggregatedChoiceResults, textAnswers, chartData, aiSummary }
// rawResults[i] = { participantNickname, submittedAt, answers: [{ pageId, selectedOptions, textAnswer }] }
export async function getResults(pollId) {
  return request(`/api/admin/polls/${pollId}/results`, { auth: true })
}

// Нормализованный список ответов для экспорта.
export async function exportJSON(pollId) {
  const results = await getResults(pollId)
  return (results.rawResults || []).map(r => ({
    submittedAt: r.submittedAt,
    nickname: r.participantNickname || 'Анонимно',
    answers: r.answers || [],
  }))
}

// responses — результат exportJSON; pages — страницы опроса (с реальными id).
export function exportCSV(responses, pages) {
  if (!responses.length) return ''
  const questions = pages.map((p, i) => `q${i + 1}: ${p.question}`)
  const headers = ['submitted_at', 'nickname', ...questions]
  const rows = responses.map(r => [
    r.submittedAt,
    r.nickname || 'Анонимно',
    ...pages.map(p => {
      const ans = (r.answers || []).find(a => a.pageId === p.id)
      if (!ans) return ''
      return ans.textAnswer || (ans.selectedOptions || []).join('; ')
    }),
  ])
  const escape = cell => `"${String(cell ?? '').replace(/"/g, '""')}"`
  return [headers, ...rows].map(row => row.map(escape).join(',')).join('\n')
}

export function downloadCSV(content, filename) {
  const blob = new Blob(['﻿' + content], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
