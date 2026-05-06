import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePoll } from '../context/PollContext'

export default function TakeVote() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getPoll } = usePoll()
  const poll = getPoll(id)
  const [selected, setSelected] = useState(null)

  if (!poll) return <div className="vote-container" style={{ color: 'var(--text-2)' }}>Опрос не найден</div>

  const handleVote = () => {
    if (!selected) return
    navigate('/thanks')
  }

  return (
    <div className="vote-container">
      <div className="vote-card">
        <h2 className="vote-question">{poll.question}</h2>
        <div className="vote-options">
          {(poll.options || []).map(opt => (
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
