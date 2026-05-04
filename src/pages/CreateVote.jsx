import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePoll } from '../context/PollContext'

export default function CreateVote() {
  const { addVote } = usePoll()
  const navigate = useNavigate()
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])

  const addOption = () => setOptions([...options, ''])
  const removeOption = (i) => { if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i)) }
  const updateOption = (i, v) => { const o = [...options]; o[i] = v; setOptions(o) }

  const handleSubmit = () => {
    if (!question.trim() || options.some(o => !o.trim())) return
    addVote({ question, options: options.filter(o => o.trim()), votes: {} })
    navigate('/')
  }

  return (
    <div className="form-container">
      <h1 className="form-title">Создание голосования</h1>
      <div className="form-card">
        <label className="form-label">Вопрос</label>
        <input className="form-input" placeholder="Например: Какую фичу делаем следующей?" value={question} onChange={e => setQuestion(e.target.value)} />

        <label className="form-label" style={{ marginTop: '20px' }}>Варианты ответа</label>
        {options.map((opt, i) => (
          <div key={i} className="option-row">
            <input className="form-input" placeholder={`Вариант ${i + 1}`} value={opt} onChange={e => updateOption(i, e.target.value)} />
            {options.length > 2 && <button className="btn-remove" onClick={() => removeOption(i)}>×</button>}
          </div>
        ))}
        <button className="btn-add" onClick={addOption}>+ Добавить вариант</button>
      </div>
      <button className="btn-primary btn-large" onClick={handleSubmit}>Создать голосование</button>
    </div>
  )
}