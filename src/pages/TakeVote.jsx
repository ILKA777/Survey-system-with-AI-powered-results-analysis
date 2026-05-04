import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePoll } from '../context/PollContext'

export default function TakeVote() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getPoll, updatePoll } = usePoll()
  const poll = getPoll(id)
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  if (!poll) return <div className="vote-container" style={{ color: 'var(--text-muted)' }}>Опрос не найден</div>

  const handleVote = () => {
    if (!selected) return
    const votes = { ...(poll.votes || {}) }
    votes[selected] = (votes[selected] || 0) + 1
    updatePoll(id, { votes })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="vote-container">
        <div className="success-card">
          <div className="checkmark">✓</div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Голос принят!
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Ваш ответ записан</p>
          <button className="btn-primary btn-large" onClick={() => navigate(`/results/${id}`)}>
            Смотреть результаты
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="vote-container">
      <div className="vote-card">
        <h2 className="vote-question">{poll.question}</h2>
        <div className="vote-options">
          {poll.options.map(opt => (
            <button key={opt} className={`vote-option${selected === opt ? ' selected' : ''}`} onClick={() => setSelected(opt)}>
              {opt}
            </button>
          ))}
        </div>
        <button className="vote-submit" onClick={handleVote} disabled={!selected}>
          Отправить голос
        </button>
      </div>
    </div>
  )
}