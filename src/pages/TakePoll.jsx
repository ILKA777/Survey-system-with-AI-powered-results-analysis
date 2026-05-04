import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePoll } from '../context/PollContext'

export default function TakePoll() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getPoll, updatePoll } = usePoll()
  const poll = getPoll(id)
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [textInput, setTextInput] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (!poll || poll.type !== 'survey') return <div className="survey-container" style={{ color: 'var(--text-muted)' }}>Опрос не найден</div>

  const step = poll.steps[currentStep]
  const progress = (currentStep / poll.steps.length) * 100

  const handleNext = (answer) => {
    const newAnswers = { ...answers, [currentStep]: answer }
    setAnswers(newAnswers)
    setTextInput('')
    if (currentStep < poll.steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      const formatted = poll.steps.map((s, i) => ({ question: s.question, answer: newAnswers[i] || '' }))
      updatePoll(id, { responses: [...(poll.responses || []), formatted] })
      setSubmitted(true)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setTextInput(answers[currentStep - 1] || '')
    }
  }

  if (submitted) {
    return (
      <div className="survey-container">
        <div className="success-card">
          <div className="checkmark">✓</div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Опрос пройден!
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Спасибо за ваши ответы</p>
          <button className="btn-primary btn-large" onClick={() => navigate(`/results/${id}`)}>
            Смотреть результаты
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="survey-container">
      <div className="survey-card">
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Вопрос {currentStep + 1} из {poll.steps.length}
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <h3 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '24px', color: 'var(--text-secondary)' }}>
          {step.question}
        </h3>

        {step.type === 'closed' ? (
          <div className="vote-options">
            {step.options.map(opt => (
              <button key={opt} className="vote-option" onClick={() => handleNext(opt)}>{opt}</button>
            ))}
          </div>
        ) : (
          <div>
            <textarea
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '15px',
                minHeight: '120px',
                outline: 'none',
                marginBottom: '20px',
                resize: 'vertical',
                background: 'var(--bg-white)',
                color: 'var(--text-primary)',
              }}
              placeholder="Введите ваш ответ..."
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={() => handleNext(textInput)} disabled={!textInput.trim()}>
                Далее
              </button>
            </div>
          </div>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '24px',
        }}>
          <button
            className="btn-outline"
            onClick={handleBack}
            style={{ visibility: currentStep > 0 ? 'visible' : 'hidden' }}
          >
            ← Назад
          </button>
          <div></div>
        </div>
      </div>
    </div>
  )
}