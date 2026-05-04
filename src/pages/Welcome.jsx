import Logo from '../components/Logo'
import { Link } from 'react-router-dom'

export default function Welcome() {
  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '80px 20px',
      minHeight: '100vh',
      background: 'var(--bg-page)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ marginBottom: '24px' }}>
        <Logo size={80} />
      </div>
      <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-secondary)' }}>
        PulseRoom
      </h1>
      <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '40px' }}>
        Live-опросы, которые сразу объясняют ответы
      </p>
      
      <div style={{
        background: 'var(--bg-white)',
        borderRadius: 'var(--radius-lg)',
        padding: '40px',
        border: '1px solid var(--border)',
        maxWidth: '420px',
        width: '100%',
        boxShadow: 'var(--shadow-md)',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-secondary)' }}>
          Участвуйте в опросах
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
          Откройте ссылку на опрос или голосование, чтобы участвовать. Никакой регистрации не требуется.
        </p>
        <Link to="/login" className="btn-primary btn-large" style={{ display: 'block', textAlign: 'center' }}>
          Создать свой опрос
        </Link>
      </div>
    </div>
  )
}