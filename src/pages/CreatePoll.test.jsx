import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { PollProvider } from '../context/PollContext'
import CreatePoll from './CreatePoll'
import * as authApi from '../api/auth.js'
import * as pollsApi from '../api/polls.js'

vi.mock('../api/auth.js')
vi.mock('../api/polls.js')

function renderCreate() {
  return render(
    <MemoryRouter>
      <PollProvider>
        <CreatePoll />
      </PollProvider>
    </MemoryRouter>
  )
}

describe('<CreatePoll />', () => {
  beforeEach(() => {
    authApi.getUser.mockReturnValue({ nickname: 'A', token: 't' })
    pollsApi.listPolls.mockResolvedValue([])
    pollsApi.createPoll.mockResolvedValue({ id: 5, title: 'Ретро' })
  })

  it('создаёт опрос вручную и шлёт type SURVEY с заголовком', async () => {
    renderCreate()

    await userEvent.type(screen.getByPlaceholderText('Ретроспектива спринта'), 'Ретро')
    await userEvent.type(screen.getByPlaceholderText('Введите вопрос'), 'Как прошёл спринт?')
    await userEvent.click(screen.getByRole('button', { name: 'Создать опрос' }))

    expect(pollsApi.createPoll).toHaveBeenCalledTimes(1)
    const arg = pollsApi.createPoll.mock.calls[0][0]
    expect(arg.type).toBe('SURVEY')
    expect(arg.title).toBe('Ретро')
    expect(arg.pages[0].question).toBe('Как прошёл спринт?')
  })

  it('требует название перед созданием', async () => {
    renderCreate()
    await userEvent.click(screen.getByRole('button', { name: 'Создать опрос' }))
    expect(pollsApi.createPoll).not.toHaveBeenCalled()
    expect(screen.getByText('Введите название')).toBeInTheDocument()
  })
})