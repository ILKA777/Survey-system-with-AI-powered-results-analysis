import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Join from './Join'
import * as pollsApi from '../api/polls.js'
import * as responsesApi from '../api/responses.js'

vi.mock('../api/polls.js')
vi.mock('../api/responses.js')
vi.mock('../api/results.js')

const POLL = {
  id: 1, type: 'SURVEY', title: 'Опрос', roomCode: 'ABCDE', status: 'PUBLISHED',
  pages: [
    { id: 10, pageOrder: 1, question: 'Ваш выбор?', questionType: 'SINGLE_CHOICE', required: true, options: ['Вариант A', 'Вариант B'] },
  ],
}

function renderJoin() {
  return render(
    <MemoryRouter initialEntries={['/join/ABCDE']}>
      <Routes>
        <Route path="/join/:roomCode" element={<Join />} />
        <Route path="/thanks" element={<div>Спасибо!</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('<Join />', () => {
  beforeEach(() => {
    pollsApi.getPollByRoomCode.mockResolvedValue(POLL)
    responsesApi.submitResponse.mockResolvedValue({ message: 'ok' })
  })

  it('загружает опрос по roomCode и рендерит вопрос', async () => {
    renderJoin()
    expect(await screen.findByText('Ваш выбор?')).toBeInTheDocument()
    expect(pollsApi.getPollByRoomCode).toHaveBeenCalledWith('ABCDE')
  })

  it('отправляет ответ с pageId страницы и roomCode', async () => {
    renderJoin()
    await userEvent.click(await screen.findByText('Вариант A'))

    expect(responsesApi.submitResponse).toHaveBeenCalledTimes(1)
    const [roomCode, answers, nickname] = responsesApi.submitResponse.mock.calls[0]
    expect(roomCode).toBe('ABCDE')
    expect(answers).toEqual([{ pageId: 10, selectedOptions: ['Вариант A'], textAnswer: '' }])
    expect(nickname).toBeNull()
    expect(await screen.findByText('Спасибо!')).toBeInTheDocument()
  })

  it('показывает ошибку, если опрос не найден', async () => {
    pollsApi.getPollByRoomCode.mockRejectedValue(new Error('нет'))
    renderJoin()
    expect(await screen.findByText('Опрос не найден или не опубликован')).toBeInTheDocument()
  })
})