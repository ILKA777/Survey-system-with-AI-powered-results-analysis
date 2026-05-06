import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usePoll } from '../context/PollContext'
import { signup, signin } from '../api/auth.js'

export default function Login() {
  const { setUser } = usePoll()
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [isNew, setIsNew] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    if (!nickname.trim()) return
    setLoading(true); setError('')
    try {
      const user = isNew ? await signup(nickname.trim()) : await signin(nickname.trim())
      setUser(user)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo-mark" style={{ width: '36px', height: '36px', margin: '0 auto 12px' }}>
          <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
            <polyline points="0,7 4,7 6,4 8,12 10,1 12,13 14,7 22,7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="auth-logo">PulseRoom</p>
        <p className="auth-desc">{isNew ? 'Создайте аккаунт' : 'Войдите в аккаунт'}</p>

        <form className="auth-form" onSubmit={handle}>
          <input
            className="auth-input"
            placeholder="Ваш никнейм"
            value={nickname}
            onChange={e => { setNickname(e.target.value); setError('') }}
            autoFocus
          />
          {error && <p style={{ fontSize: '12px', color: 'var(--red)', textAlign: 'center' }}>{error}</p>}
          <button className="btn btn-primary btn-block" type="submit" disabled={loading || !nickname.trim()}>
            {loading ? 'Подождите...' : isNew ? 'Создать аккаунт' : 'Войти'}
          </button>
        </form>

        <p className="auth-toggle">
          {isNew ? 'Уже есть аккаунт? ' : 'Нет аккаунта? '}
          <span onClick={() => { setIsNew(!isNew); setError('') }}>
            {isNew ? 'Войти' : 'Создать'}
          </span>
        </p>

        <div className="auth-divider" style={{ marginTop: '18px' }}><span>участник?</span></div>
        <Link to="/" style={{ fontSize: '12px', color: 'var(--text-3)', textDecoration: 'none', display: 'block', textAlign: 'center' }}>
          Войти по коду комнаты →
        </Link>
      </div>
    </div>
  )
}
