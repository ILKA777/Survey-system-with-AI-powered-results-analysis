import { Link } from 'react-router-dom'

export default function Thanks() {
  return (
    <div className="survey-container">
      <div className="success-card">
        <div className="checkmark">✓</div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Ответ принят!</h2>
        <p style={{ color: 'var(--text-2)', fontSize: '14px', marginBottom: '28px' }}>
          Спасибо за участие
        </p>
        <Link to="/" className="btn btn-outline">На главную</Link>
      </div>
    </div>
  )
}
