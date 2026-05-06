import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPollByRoomCode } from '../api/polls.js'
import { submitResponse } from '../api/responses.js'
import { getResults } from '../api/results.js'

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
  const [submitted, setSubmitted] = useState(false)
  const [voteResults, setVoteResults] = useState([])
  const [quizScore, setQuizScore] = useState(null)
  const [quizBreakdown, setQuizBreakdown] = useState([])

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
  const isPublicVote = poll.type === 'VOTE' && pages[0]?.is_public
  const isQuiz = poll.type === 'QUIZ'

  // Public vote results screen
  if (submitted && isPublicVote) {
    const page = pages[0]
    const allAnswers = voteResults.flatMap(r => r.answers || [])
    const pageAnswers = allAnswers.filter(a => a.pageId === 1)
    return (
      <div className="survey-container">
        <div className="survey-card">
          <p style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Результаты голосования
          </p>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', lineHeight: 1.4 }}>
            {page.question}
          </h3>
          {page.options?.map(opt => {
            const count = pageAnswers.filter(a => (a.selectedOptions || []).includes(opt)).length
            const pct = pageAnswers.length > 0 ? ((count / pageAnswers.length) * 100).toFixed(0) : 0
            return (
              <div key={opt} className="option-bar-row">
                <span className="option-bar-label">{opt}</span>
                <div className="option-bar-track">
                  <div className="option-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="option-bar-count">{count} ({pct}%)</span>
              </div>
            )
          })}
          <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-3)', marginTop: '16px' }}>
            Всего голосов: {pageAnswers.length}
          </p>
        </div>
      </div>
    )
  }

  // Quiz results screen
  if (submitted && isQuiz) {
    return (
      <div className="survey-container">
        <div className="survey-card">
          <p style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--amber)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Результаты викторины
          </p>
          <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
            <p style={{ fontSize: '48px', fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>
              {quizScore}<span style={{ fontSize: '24px', color: 'var(--text-3)', fontWeight: 400 }}> / {pages.length}</span>
            </p>
            <p style={{ color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: '12px', marginTop: '6px' }}>
              правильных ответов
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {quizBreakdown.map((item, i) => (
              <div key={i} style={{
                padding: '12px 14px',
                borderRadius: 'var(--r-sm)',
                background: item.correct ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)',
                borderLeft: `3px solid ${item.correct ? 'var(--green)' : 'var(--red)'}`,
              }}>
                <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: 'var(--text)' }}>
                  {i + 1}. {item.question}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
                  Ваш ответ: {item.yourAnswer || '—'}
                </p>
                {!item.correct && item.correctAnswer && (
                  <p style={{ fontSize: '12px', color: 'var(--green)', fontFamily: 'var(--mono)', marginTop: '2px' }}>
                    Правильно: {item.correctAnswer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

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

      if (isPublicVote) {
        try {
          const results = await getResults(poll.id)
          setVoteResults(results)
        } catch {}
        setSubmitted(true)
      } else if (isQuiz) {
        let score = 0
        const breakdown = pages.map((page, i) => {
          const ans = newAnswers[i]
          const selected = ans?.selectedOptions || []
          const correct = page.correctOptions || []
          const isCorrect = correct.length > 0 &&
            correct.length === selected.length &&
            correct.every(c => selected.includes(c))
          if (isCorrect) score++
          return {
            question: page.question,
            yourAnswer: selected.join(', '),
            correctAnswer: correct.join(', '),
            correct: isCorrect,
          }
        })
        setQuizScore(score)
        setQuizBreakdown(breakdown)
        setSubmitted(true)
      } else {
        navigate('/thanks')
      }
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

  const isSingleChoice = currentPage.questionType === 'SINGLE_CHOICE'
  const needsConfirm = currentPage.questionType === 'MULTIPLE_CHOICE' || (isQuiz && isSingleChoice)

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

        {step === 0 && (
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
        ) : needsConfirm ? (
          <div>
            <div className="vote-options">
              {currentPage.options?.map(opt => {
                const checked = multiSelected.includes(opt)
                return (
                  <button
                    key={opt}
                    className={`vote-option${checked ? ' selected' : ''}`}
                    onClick={() => {
                      if (isSingleChoice) {
                        setMultiSelected([opt])
                      } else {
                        toggleMulti(opt)
                      }
                    }}
                  >
                    <span style={{
                      width: '16px', height: '16px',
                      borderRadius: isSingleChoice ? '50%' : '4px',
                      flexShrink: 0,
                      border: `2px solid ${checked ? 'var(--accent)' : 'var(--border-3)'}`,
                      background: checked ? 'var(--accent)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {checked && <span style={{ color: '#fff', fontSize: '8px', fontWeight: 700 }}>●</span>}
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
