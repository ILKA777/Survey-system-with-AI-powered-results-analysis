import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePoll } from '../context/PollContext'

export default function TakePoll() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getPoll } = usePoll()
  const poll = getPoll(id)
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [textInput, setTextInput] = useState('')

  if (!poll || poll.type !== 'survey') return <div className="survey-container" style={{ color: 'var(--text-2)' }}>Опрос не найден</div>

  const pages = poll.pages || []
  const step = pages[currentStep]
  const progress = pages.length > 0 ? (currentStep / pages.length) * 100 : 0

  const handleNext = (answer) => {
    const newAnswers = { ...answers, [currentStep]: answer }
    setAnswers(newAnswers)
    setTextInput('')
    if (currentStep < pages.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      navigate('/thanks')
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setTextInput(answers[currentStep - 1] || '')
    }
  }

  if (!step) return <div className="survey-container" style={{ color: 'var(--text-2)' }}>Вопросов нет</div>

  return (
    <div className="survey-container">
      <div className="survey-card">
        <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '8px' }}>
          Вопрос {currentStep + 1} из {pages.length}
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <h3 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '24px', color: 'var(--text)' }}>
          {step.question}
        </h3>

        {step.questionType !== 'TEXT' ? (
          <div className="vote-options">
            {(step.options || []).map(opt => (
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
                background: 'var(--bg-raised)',
                color: 'var(--text)',
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
