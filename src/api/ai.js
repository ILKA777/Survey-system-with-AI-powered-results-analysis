// МОК — Иван заменит fetch() на свой Python-сервис не трогая компоненты

export async function generatePoll(prompt, type, pagesCount = 5) {
  await new Promise(r => setTimeout(r, 1400))

  const base = [
    { question: `Как вы оцениваете "${prompt}"?`, questionType: 'SINGLE_CHOICE', options: ['Отлично', 'Хорошо', 'Нейтрально', 'Плохо'] },
    { question: 'Что можно улучшить?', questionType: 'TEXT', options: [] },
    { question: 'Насколько вы рекомендуете это коллегам?', questionType: 'SINGLE_CHOICE', options: ['Определённо да', 'Скорее да', 'Скорее нет', 'Нет'] },
    { question: 'Как давно вы используете это?', questionType: 'SINGLE_CHOICE', options: ['Меньше месяца', '1–6 месяцев', 'Более 6 месяцев'] },
    { question: 'Дополнительные комментарии:', questionType: 'TEXT', options: [] },
  ]

  return {
    type,
    title: prompt,
    pages: base.slice(0, Math.min(pagesCount, base.length)).map((q, i) => ({
      ...q,
      pageOrder: i + 1,
      required: true,
    })),
  }
}

export async function summarize(poll, responses) {
  await new Promise(r => setTimeout(r, 900))

  const total = responses.length
  if (!total) return 'Ответов пока нет. Поделитесь ссылкой с участниками!'

  if (poll.type === 'VOTE') {
    const tally = {}
    responses.forEach(r => r.answers.forEach(a =>
      (a.selectedOptions || []).forEach(opt => { tally[opt] = (tally[opt] || 0) + 1 })
    ))
    const [winner, count] = Object.entries(tally).sort((a, b) => b[1] - a[1])[0] ?? ['—', 0]
    const pct = total ? ((count / total) * 100).toFixed(0) : 0
    return `«${winner}» лидирует с ${pct}% голосов (${count} из ${total}). Участники чётко выразили предпочтение этому варианту.`
  }

  return `${total} участников прошли опрос. Открытые ответы демонстрируют общую позитивную тенденцию. Рекомендуется детально изучить текстовые ответы для выявления конкретных точек роста.`
}
