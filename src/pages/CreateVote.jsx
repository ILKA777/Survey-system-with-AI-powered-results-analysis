import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePoll } from '../context/PollContext'

export default function CreateVote() {
  const { addPoll } = usePoll()
  const navigate = useNavigate()
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [questionType, setQuestionType] = useState('SINGLE_CHOICE')
  const [isPublic, setIsPublic] = useState(true)

  const addOption = () => setOptions(prev => [...prev, ''])
  const removeOption = (i) => { if (options.length > 2) setOptions(prev => prev.filter((_, idx) => idx !== i)) }
  const updateOption = (i, v) => setOptions(prev => prev.map((o, idx) => idx === i ? v : o))

  const handleSubmit = async () => {
    if (!question.trim() || options.some(o => !o.trim())) return
    const poll = await addPoll({
      type: 'VOTE',
      title: question,
      pages: [{
        pageOrder: 1,
        question,
        questionType,
        options: options.filter(o => o.trim()),
        required: true,
        is_public: isPublic,
      }],
    })
    navigate(`/poll/${poll.id}`)
  }

  return (
    <div className="form-container">
      <h1 className="form-title">Создание голосования</h1>
      <div className="form-card">
        <label className="form-label">Вопрос</label>
        <input className="form-input" placeholder="Какую фичу делаем следующей?" value={question} onChange={e => setQuestion(e.target.value)} />

        <label className="form-label">Тип выбора</label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            className={`btn btn-sm ${questionType === 'SINGLE_CHOICE' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setQuestionType('SINGLE_CHOICE')}
          >
            Один вариант
          </button>
          <button
            className={`btn btn-sm ${questionType === 'MULTIPLE_CHOICE' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setQuestionType('MULTIPLE_CHOICE')}
          >
            Несколько вариантов
          </button>
        </div>

        <label className="form-label">Варианты ответа</label>
        {options.map((opt, i) => (
          <div key={i} className="option-row">
            <input className="form-input" style={{ marginBottom: 0 }} placeholder={`Вариант ${i + 1}`} value={opt} onChange={e => updateOption(i, e.target.value)} />
            {options.length > 2 && <button className="btn-remove" onClick={() => removeOption(i)}>×</button>}
          </div>
        ))}
        <button className="btn-add" onClick={addOption}>+ Добавить вариант</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px', padding: '12px', background: 'var(--bg-raised)', borderRadius: 'var(--r-sm)', cursor: 'pointer' }} onClick={() => setIsPublic(v => !v)}>
          <div style={{
            width: '18px', height: '18px', flexShrink: 0, borderRadius: '4px',
            border: `2px solid ${isPublic ? 'var(--accent)' : 'var(--border-3)'}`,
            background: isPublic ? 'var(--accent)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isPublic && <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>✓</span>}
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-2)', userSelect: 'none' }}>
            Публичное — участники видят результаты сразу после голосования
          </span>
        </div>
      </div>
      <button className="btn btn-primary btn-lg" onClick={handleSubmit}>Создать голосование</button>
    </div>
  )
}
