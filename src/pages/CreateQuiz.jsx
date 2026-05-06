import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePoll } from '../context/PollContext'

export default function CreateQuiz() {
  const { addPoll } = usePoll()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [pages, setPages] = useState([{
    pageOrder: 1,
    question: '',
    questionType: 'SINGLE_CHOICE',
    options: ['', ''],
    correctOptions: [],
    required: true,
  }])

  const addPage = () => setPages(prev => [...prev, {
    pageOrder: prev.length + 1,
    question: '',
    questionType: 'SINGLE_CHOICE',
    options: ['', ''],
    correctOptions: [],
    required: true,
  }])

  const removePage = (i) => {
    if (pages.length > 1) setPages(prev => prev.filter((_, idx) => idx !== i))
  }

  const updatePage = (i, field, value) => {
    setPages(prev => prev.map((p, idx) => {
      if (idx !== i) return p
      const updated = { ...p, [field]: value }
      if (field === 'questionType') updated.correctOptions = []
      return updated
    }))
  }

  const updateOption = (pi, oi, value) => {
    setPages(prev => prev.map((p, idx) => {
      if (idx !== pi) return p
      const oldVal = p.options[oi]
      const options = [...p.options]
      options[oi] = value
      const correctOptions = p.correctOptions.map(c => c === oldVal ? value : c)
      return { ...p, options, correctOptions }
    }))
  }

  const addOption = (pi) => setPages(prev => prev.map((p, idx) => idx !== pi ? p : { ...p, options: [...p.options, ''] }))

  const removeOption = (pi, oi) => setPages(prev => prev.map((p, idx) => {
    if (idx !== pi) return p
    const removedOpt = p.options[oi]
    return {
      ...p,
      options: p.options.length > 2 ? p.options.filter((_, i) => i !== oi) : p.options,
      correctOptions: p.correctOptions.filter(c => c !== removedOpt),
    }
  }))

  const toggleCorrect = (pi, opt) => {
    if (!opt.trim()) return
    setPages(prev => prev.map((p, idx) => {
      if (idx !== pi) return p
      const isSingle = p.questionType === 'SINGLE_CHOICE'
      const correctOptions = p.correctOptions.includes(opt)
        ? p.correctOptions.filter(c => c !== opt)
        : isSingle ? [opt] : [...p.correctOptions, opt]
      return { ...p, correctOptions }
    }))
  }

  const handleSubmit = async () => {
    if (!title.trim()) return
    const cleanPages = pages.map((p, i) => ({
      ...p,
      pageOrder: i + 1,
      options: p.options.filter(o => o.trim()),
    }))
    const poll = await addPoll({ type: 'QUIZ', title, pages: cleanPages })
    navigate(`/poll/${poll.id}`)
  }

  return (
    <div className="form-container">
      <h1 className="form-title">Создание викторины</h1>
      <div className="form-card">
        <label className="form-label">Название викторины</label>
        <input className="form-input" placeholder="Знаешь ли ты React?" value={title} onChange={e => setTitle(e.target.value)} />
      </div>

      {pages.map((page, i) => (
        <div key={i} className="form-card step-card">
          <div className="step-header">
            <span className="form-label" style={{ marginBottom: 0 }}>Вопрос {i + 1}</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select className="form-select" value={page.questionType} onChange={e => updatePage(i, 'questionType', e.target.value)}>
                <option value="SINGLE_CHOICE">Один правильный</option>
                <option value="MULTIPLE_CHOICE">Несколько правильных</option>
              </select>
              {pages.length > 1 && <button className="btn-remove" onClick={() => removePage(i)}>×</button>}
            </div>
          </div>
          <input className="form-input" placeholder="Введите вопрос" value={page.question} onChange={e => updatePage(i, 'question', e.target.value)} />

          <label className="form-label">
            Варианты ответа
            <span style={{ fontWeight: 400, color: 'var(--text-3)', marginLeft: '6px', textTransform: 'none', letterSpacing: 0 }}>
              — нажмите кружок чтобы отметить правильный
            </span>
          </label>
          {page.options.map((opt, oi) => {
            const isCorrect = page.correctOptions.includes(opt)
            const isSingle = page.questionType === 'SINGLE_CHOICE'
            return (
              <div key={oi} className="option-row">
                <button
                  onClick={() => toggleCorrect(i, opt)}
                  style={{
                    width: '22px', height: '22px', flexShrink: 0,
                    borderRadius: isSingle ? '50%' : '4px',
                    border: `2px solid ${isCorrect ? 'var(--green)' : 'var(--border-3)'}`,
                    background: isCorrect ? 'var(--green)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  {isCorrect && <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>✓</span>}
                </button>
                <input
                  className="form-input"
                  style={{ marginBottom: 0 }}
                  placeholder={`Вариант ${oi + 1}`}
                  value={opt}
                  onChange={e => updateOption(i, oi, e.target.value)}
                />
                {page.options.length > 2 && <button className="btn-remove" onClick={() => removeOption(i, oi)}>×</button>}
              </div>
            )
          })}
          <button className="btn-add" onClick={() => addOption(i)}>+ Добавить вариант</button>
        </div>
      ))}

      <button className="btn-add" onClick={addPage} style={{ marginBottom: '20px', fontSize: '14px' }}>+ Добавить вопрос</button>
      <br />
      <button className="btn btn-primary btn-lg" onClick={handleSubmit}>Создать викторину</button>
    </div>
  )
}
