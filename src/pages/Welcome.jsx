import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'iconoir-react'

export default function Welcome() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleJoin = (e) => {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length < 4) { setError('Введите код комнаты'); return }
    navigate(`/join/${trimmed}`)
  }

  return (
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
            <div className="logo-mark" style={{ width: '36px', height: '36px' }}>
              <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
                <polyline points="0,7 4,7 6,4 8,12 10,1 12,13 14,7 22,7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em' }}>PulseRoom</span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.6 }}>
            Создавайте опросы за минуты.<br/>Получайте не просто данные — получайте выводы.
          </p>
        </div>

        <div className="auth-card">
          <p style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Участник? Введите код
          </p>
          <form onSubmit={handleJoin}>
            <div className="room-input-row">
              <input
                className="room-input"
                placeholder="ABC12"
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
                maxLength={6}
              />
              <button type="submit" className="btn btn-primary">
                <ArrowRight width={16} height={16} />
              </button>
            </div>
            {error && <p style={{ fontSize: '12px', color: 'var(--red)', marginTop: '8px' }}>{error}</p>}
          </form>

          <div className="auth-divider"><span>или</span></div>

          <Link to="/login" className="btn btn-outline btn-block" style={{ fontSize: '13px' }}>
            Войти как организатор
          </Link>
        </div>
      </div>
    </div>
  )
}
