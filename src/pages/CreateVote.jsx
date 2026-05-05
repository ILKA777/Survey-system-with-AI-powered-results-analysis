import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePoll } from '../context/PollContext'

export default function CreateVote() {
  const { addPoll } = usePoll()
  const navigate = useNavigate()
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])

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
        questionType: 'SINGLE_CHOICE',
        options: options.filter(o => o.trim()),
        required: true,
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
        <label className="form-label">Варианты ответа</label>
        {options.map((opt, i) => (
          <div key={i} className="option-row">
            <input className="form-input" style={{ marginBottom: 0 }} placeholder={`Вариант ${i + 1}`} value={opt} onChange={e => updateOption(i, e.target.value)} />
            {options.length > 2 && <button className="btn-remove" onClick={() => removeOption(i)}>×</button>}
          </div>
        ))}
        <button className="btn-add" onClick={addOption}>+ Добавить вариант</button>
      </div>
      <button className="btn btn-primary btn-lg" onClick={handleSubmit}>Создать голосование</button>
    </div>
  )
}
