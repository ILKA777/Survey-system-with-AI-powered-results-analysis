import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPollByRoomCode } from '../api/polls.js'
import { submitResponse } from '../api/responses.js'

export default function Join() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const [poll, setPoll] = useState(null)
  const [error, setError] = useState('')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [textInput, setTextInput] = useState('')
  const [multiSelected, setMultiSelected] = useState([])
  const [nickname, setNickname] = useState('')

  useEffect(() => {
    if (!roomCode) return
    getPollByRoomCode(roomCode)
      .then(setPoll)
      .catch(() => setError('Опрос не найден или не опубликован'))
  }, [roomCode])

  if (error) return (
    <div className="survey-container">
      <div className="survey-card" style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Ошибка</p>
        <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>{error}</p>
      </div>
    </div>
  )

  if (!poll) return (
    <div className="survey-container">
      <div className="survey-card" style={{ textAlign: 'center', color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: '13px' }}>
        Загрузка...
      </div>
    </div>
  )

  const pages = poll.pages || []
  const currentPage = pages[step]
  const progress = pages.length > 0 ? ((step / pages.length) * 100) : 0

  const handleAnswer = async (answer) => {
    const newAnswers = {
      ...answers,
      [step]: { pageId: step + 1, ...answer },
    }
    setAnswers(newAnswers)
    setTextInput('')
    setMultiSelected([])

    if (step < pages.length - 1) {
      setStep(step + 1)
    } else {
      const formatted = Object.values(newAnswers)
      await submitResponse(poll.id, formatted, nickname || null)
      navigate('/thanks')
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
      const prev = answers[step - 1]
      setTextInput(prev?.textAnswer || '')
      setMultiSelected(prev?.selectedOptions || [])
    }
  }

  const toggleMulti = (opt) => {
    setMultiSelected(prev =>
      prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
    )
  }

  return (
    <div className="survey-container">
      <div className="survey-card">
        <div style={{ marginBottom: '6px' }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }}>
            {poll.title} · {step + 1} / {pages.length}
          </p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {!nickname && step === 0 && (
          <div style={{ marginBottom: '16px' }}>
            <input
              className="form-input"
              placeholder="Ваше имя (необязательно)"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
            />
          </div>
        )}

        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', lineHeight: 1.4 }}>
          {currentPage.question}
        </h3>

        {currentPage.questionType === 'TEXT' ? (
          <div>
            <textarea
              className="form-textarea"
              placeholder="Введите ваш ответ..."
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-primary"
                onClick={() => handleAnswer({ textAnswer: textInput, selectedOptions: [] })}
                disabled={!textInput.trim() && currentPage.required}
              >
                {step < pages.length - 1 ? 'Далее' : 'Завершить'}
              </button>
            </div>
          </div>
        ) : currentPage.questionType === 'MULTIPLE_CHOICE' ? (
          <div>
            <div className="vote-options">
              {currentPage.options?.map(opt => {
                const checked = multiSelected.includes(opt)
                return (
                  <button
                    key={opt}
                    className={`vote-option${checked ? ' selected' : ''}`}
                    onClick={() => toggleMulti(opt)}
                  >
                    <span style={{
                      width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                      border: `2px solid ${checked ? 'var(--accent)' : 'var(--border-3)'}`,
                      background: checked ? 'var(--accent)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {checked && <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>✓</span>}
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                className="btn btn-primary"
                onClick={() => handleAnswer({ selectedOptions: multiSelected, textAnswer: '' })}
                disabled={multiSelected.length === 0}
              >
                {step < pages.length - 1 ? 'Далее' : 'Завершить'}
              </button>
            </div>
          </div>
        ) : (
          <div className="vote-options">
            {currentPage.options?.map(opt => (
              <button key={opt} className="vote-option" onClick={() => handleAnswer({ selectedOptions: [opt], textAnswer: '' })}>
                {opt}
              </button>
            ))}
          </div>
        )}

        {step > 0 && (
          <button className="btn btn-ghost" onClick={handleBack} style={{ marginTop: '16px' }}>
            ← Назад
          </button>
        )}
      </div>
    </div>
  )
}
