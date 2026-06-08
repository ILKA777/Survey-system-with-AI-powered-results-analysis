import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { PollProvider } from '../context/PollContext'
import PollDetail from './PollDetail'
import * as authApi from '../api/auth.js'
import * as pollsApi from '../api/polls.js'
import * as resultsApi from '../api/results.js'

vi.mock('../api/auth.js')
vi.mock('../api/polls.js')
vi.mock('../api/results.js')

const POLL = {
  id: 1, type: 'SURVEY', title: 'Ретроспектива', roomCode: 'ABCDE', status: 'PUBLISHED',
  createdAt: '2026-06-08T12:00:00Z',
  pages: [
    { id: 10, pageOrder: 1, question: 'Как прошёл спринт?', questionType: 'SINGLE_CHOICE', options: ['Хорошо', 'Плохо'] },
  ],
}

const RESULTS = {
  rawResults: [
    { participantNickname: 'Вася', submittedAt: 't1', answers: [{ pageId: 10, selectedOptions: ['Хорошо'], textAnswer: '' }] },
    { participantNickname: 'Петя', submittedAt: 't2', answers: [{ pageId: 10, selectedOptions: ['Плохо'], textAnswer: '' }] },
  ],
  aiSummary: 'Мнения разделились поровну',
}

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/poll/1']}>
      <PollProvider>
        <Routes>
          <Route path="/poll/:id" element={<PollDetail />} />
        </Routes>
      </PollProvider>
    </MemoryRouter>
  )
}

describe('<PollDetail />', () => {
  beforeEach(() => {
    authApi.getUser.mockReturnValue({ nickname: 'A', token: 't' })
    pollsApi.listPolls.mockResolvedValue([POLL])
    resultsApi.getResults.mockResolvedValue(RESULTS)
  })

  it('рендерит опрос, код комнаты и AI-сводку с бэка', async () => {
    renderDetail()
    expect(await screen.findByText('Ретроспектива')).toBeInTheDocument()
    expect(screen.getByText('ABCDE')).toBeInTheDocument()
    expect(await screen.findByText('Мнения разделились поровну')).toBeInTheDocument()
  })

  it('показывает количество ответов и агрегирует по page.id', async () => {
    renderDetail()
    expect(await screen.findByText(/Результаты · 2/)).toBeInTheDocument()
    expect(resultsApi.getResults).toHaveBeenCalledWith(1)
  })

  it('прячет строку-ошибку AI вместо анализа', async () => {
    resultsApi.getResults.mockResolvedValue({
      ...RESULTS,
      aiSummary: 'AI суммаризация недоступна: Timeout on blocking read',
    })
    renderDetail()
    expect(await screen.findByText('Ретроспектива')).toBeInTheDocument()
    expect(screen.queryByText(/AI суммаризация недоступна/)).not.toBeInTheDocument()
  })
})