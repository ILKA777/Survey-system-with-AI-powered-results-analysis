import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { PollProvider } from '../context/PollContext'
import Login from './Login'
import * as authApi from '../api/auth.js'
import * as pollsApi from '../api/polls.js'

vi.mock('../api/auth.js')
vi.mock('../api/polls.js')

function renderLogin() {
  return render(
    <MemoryRouter>
      <PollProvider>
        <Login />
      </PollProvider>
    </MemoryRouter>
  )
}

describe('<Login />', () => {
  beforeEach(() => {
    authApi.getUser.mockReturnValue(null)
    pollsApi.listPolls.mockResolvedValue([])
  })

  it('регистрирует пользователя по нику', async () => {
    authApi.signup.mockResolvedValue({ nickname: 'Катя', token: 't' })
    renderLogin()

    await userEvent.type(screen.getByPlaceholderText('Ваш никнейм'), 'Катя')
    await userEvent.click(screen.getByRole('button', { name: /Создать аккаунт/ }))

    expect(authApi.signup).toHaveBeenCalledWith('Катя')
  })

  it('переключается на вход и зовёт signin', async () => {
    authApi.signin.mockResolvedValue({ nickname: 'Катя', token: 't' })
    renderLogin()

    await userEvent.click(screen.getByText('Войти'))
    await userEvent.type(screen.getByPlaceholderText('Ваш никнейм'), 'Катя')
    await userEvent.click(screen.getByRole('button', { name: /^Войти$/ }))

    expect(authApi.signin).toHaveBeenCalledWith('Катя')
  })

  it('показывает ошибку, если signin упал', async () => {
    authApi.signin.mockRejectedValue(new Error('Пользователь не найден'))
    renderLogin()

    await userEvent.click(screen.getByText('Войти'))
    await userEvent.type(screen.getByPlaceholderText('Ваш никнейм'), 'Неизвестный')
    await userEvent.click(screen.getByRole('button', { name: /^Войти$/ }))

    expect(await screen.findByText('Пользователь не найден')).toBeInTheDocument()
  })
})