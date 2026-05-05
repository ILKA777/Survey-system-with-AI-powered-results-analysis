import { supabase } from './supabase.js'

export async function getResults(pollId) {
  const { data, error } = await supabase
    .from('responses')
    .select('*')
    .eq('poll_id', pollId)
    .order('submitted_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data
}

export async function exportJSON(pollId) {
  const responses = await getResults(pollId)
  return responses.map(r => ({
    submittedAt: r.submitted_at,
    nickname: r.participant_nickname || 'Анонимно',
    answers: r.answers,
  }))
}

export function exportCSV(responses, pages) {
  if (!responses.length) return ''
  const questions = pages.map((p, i) => `q${i + 1}: ${p.question}`)
  const headers = ['submitted_at', 'nickname', ...questions]
  const rows = responses.map(r => [
    r.submitted_at,
    r.participant_nickname || 'Анонимно',
    ...pages.map((p, i) => {
      const ans = r.answers.find(a => a.pageId === i + 1)
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
