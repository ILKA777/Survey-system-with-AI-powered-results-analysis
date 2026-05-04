import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePoll } from '../context/PollContext'
import Logo from '../components/Logo'

export default function Dashboard() {
  const { polls, templates, duplicatePoll, deletePoll, saveAsTemplate, useTemplate } = usePoll()
  const [показатьШаблоны, setПоказатьШаблоны] = useState(false)
  const [имяШаблона, setИмяШаблона] = useState('')
  const [сохраняемыйId, setСохраняемыйId] = useState(null)
  const navigate = useNavigate()

  const обработатьШаблон = (шаблон) => {
    const новый = useTemplate(шаблон)
    navigate(`/poll/${новый.id}`)
  }

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Панель управления</h1>
          <p className="dashboard-subtitle">{polls.length} активных сессий</p>
        </div>
        <div className="dashboard-actions">
          <button className="btn-outline" onClick={() => setПоказатьШаблоны(!показатьШаблоны)}>
            📋 Шаблоны
          </button>
          <Link to="/create/poll" className="btn-primary">+ Новый опрос</Link>
          <Link to="/create/vote" className="btn-outline">+ Голосование</Link>
        </div>
      </div>

      {сохраняемыйId && (
        <div className="modal-overlay" onClick={() => setСохраняемыйId(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Сохранить как шаблон</h3>
            <input
              className="form-input"
              placeholder="Название шаблона"
              value={имяШаблона}
              onChange={e => setИмяШаблона(e.target.value)}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button className="btn-primary" onClick={() => {
                saveAsTemplate(сохраняемыйId, имяШаблона)
                setСохраняемыйId(null)
                setИмяШаблона('')
              }}>
                Сохранить
              </button>
              <button className="btn-outline" onClick={() => setСохраняемыйId(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}

     {показатьШаблоны && (
  <div className="card" style={{ marginBottom: '24px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <h3 style={{ color: 'var(--text-secondary)' }}>Быстрые шаблоны</h3>
      <Link to="/templates" className="btn-outline" style={{ fontSize: '13px' }}>Все шаблоны</Link>
    </div>
    <div className="polls-grid">
      {templates.slice(0, 6).map((ш, i) => (
        <div key={ш.id || i} className="poll-card">
          <h4 style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>{ш.name}</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            {ш.steps?.length || 0} вопросов
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-primary" onClick={() => обработатьШаблон(ш)}>
              Использовать
            </button>
            {/* Показываем кнопку удаления только для своих шаблонов */}
            {!ш.id.toString().startsWith('tpl') && (
              <button
                className="btn-outline"
                style={{ color: '#E06A4A', borderColor: '#E06A4A', fontSize: '13px' }}
                onClick={() => { if (confirm('Удалить шаблон?')) deleteTemplate(ш.id) }}
              >
                🗑
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
)}

      {polls.length === 0 ? (
        <div className="empty-state">
          <h3 className="empty-title">Пока нет опросов</h3>
          <p className="empty-text">Создайте свой первый опрос или голосование</p>
          <Link to="/create/poll" className="btn-primary">Создать опрос</Link>
        </div>
      ) : (
        <div className="polls-grid">
          {polls.map(опрос => (
            <div key={опрос.id} className="poll-card">
              <div className="poll-card-header">
                <span className={`badge ${опрос.type === 'vote' ? 'badge-vote' : 'badge-survey'}`}>
                  {опрос.type === 'vote' ? 'Голосование' : 'Опрос'}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {new Date(опрос.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>

              <h3 className="poll-card-title">
                {опрос.type === 'vote' ? опрос.question : опрос.title}
              </h3>

              <div className="poll-card-meta">
                {опрос.type === 'vote'
                  ? `${опрос.options?.length || 0} вариантов · ${Object.values(опрос.votes || {}).reduce((a, b) => a + b, 0)} голосов`
                  : `${опрос.steps?.length || 0} вопросов · ${опрос.responses?.length || 0} ответов`
                }
              </div>

              <div className="poll-card-actions">
                <Link to={опрос.type === 'vote' ? `/vote/${опрос.id}` : `/poll/${опрос.id}`} className="btn-primary">
                  Пройти
                </Link>
                <Link to={`/results/${опрос.id}`} className="btn-outline">Результаты</Link>
                <button className="btn-outline" onClick={() => duplicatePoll(опрос.id)}>📋 Копия</button>
                {опрос.type === 'survey' && (
                  <button className="btn-outline" onClick={() => setСохраняемыйId(опрос.id)}>
                    💾 Шаблон
                  </button>
                )}
                <button
                  className="btn-outline"
                  style={{ color: '#E06A4A', borderColor: '#E06A4A' }}
                  onClick={() => { if (confirm('Удалить этот опрос?')) deletePoll(опрос.id) }}
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}