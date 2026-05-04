import { useNavigate } from 'react-router-dom'
import { usePoll } from '../context/PollContext'

export default function Templates() {
  const { templates, useTemplate, deleteTemplate } = usePoll()
  const navigate = useNavigate()

  return (
    <div className="form-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="form-title" style={{ marginBottom: '8px' }}>Шаблоны опросов</h1>
          <p style={{ color: 'var(--text-muted)' }}>{templates.length} шаблонов</p>
        </div>
      </div>

      <div className="polls-grid">
        {templates.map((ш) => (
          <div key={ш.id} className="poll-card">
            <div className="poll-card-header">
              <span className="badge badge-survey">Опрос</span>
              {ш.id.toString().startsWith('tpl') && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Встроенный</span>
              )}
            </div>
            <h3 className="poll-card-title">{ш.name}</h3>
            <div className="poll-card-meta">
              {ш.steps?.length || 0} вопросов
              {ш.steps && (
                <ul style={{ marginTop: '8px', paddingLeft: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  {ш.steps.slice(0, 3).map((s, i) => (
                    <li key={i}>{s.question}</li>
                  ))}
                  {ш.steps.length > 3 && <li>...</li>}
                </ul>
              )}
            </div>
            <div className="poll-card-actions">
              <button className="btn-primary" onClick={() => {
                const новый = useTemplate(ш)
                navigate(`/poll/${новый.id}`)
              }}>
                Использовать
              </button>
              {!ш.id.toString().startsWith('tpl') && (
                <button
                  className="btn-outline"
                  style={{ color: '#E06A4A', borderColor: '#E06A4A' }}
                  onClick={() => { if (confirm('Удалить шаблон?')) deleteTemplate(ш.id) }}
                >
                  🗑 Удалить
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}