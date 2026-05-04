import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePoll } from '../context/PollContext'
import Logo from '../components/Logo'

export default function Login() {
  const { setUser } = usePoll()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isRegister) {
      if (name.trim() && email.trim() && password.trim()) {
        setUser({ name, email, role: 'admin' })
        navigate('/')
      }
    } else {
      if (email.trim() && password.trim()) {
        setUser({ name: email.split('@')[0], email, role: 'admin' })
        navigate('/')
      }
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ marginBottom: '16px' }}>
          <Logo size={64} />
        </div>
        <h1 className="login-brand">PulseRoom</h1>
        <p className="login-desc">
          {isRegister ? 'Создайте аккаунт' : 'Войдите, чтобы создавать опросы'}
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          {isRegister && (
            <input type="text" className="login-input" placeholder="Имя" value={name} onChange={e => setName(e.target.value)} required />
          )}
          <input type="email" className="login-input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" className="login-input" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="login-btn">
            {isRegister ? 'Создать аккаунт' : 'Войти'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          или
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px', textAlign: 'center' }}>
          У вас есть ссылка на опрос?{' '}
          <span style={{ color: 'var(--accent)', fontWeight: '500' }}>
            Просто откройте её в браузере
          </span>
        </p>

        <p className="login-toggle">
          {isRegister ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}{' '}
          <span onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? 'Войти' : 'Регистрация'}
          </span>
        </p>
      </div>
    </div>
  )
}