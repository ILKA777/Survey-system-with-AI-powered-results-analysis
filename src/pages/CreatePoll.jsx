import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePoll } from '../context/PollContext'

export default function CreatePoll() {
  const { addPoll } = usePoll()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [steps, setSteps] = useState([{ question: '', type: 'closed', options: ['', ''] }])

  const addStep = () => setSteps([...steps, { question: '', type: 'closed', options: ['', ''] }])
  const removeStep = (i) => { if (steps.length > 1) setSteps(steps.filter((_, idx) => idx !== i)) }

  const updateStep = (i, field, value) => {
    const newSteps = [...steps]
    newSteps[i][field] = value
    if (field === 'type' && value === 'open') newSteps[i].options = []
    else if (field === 'type' && value === 'closed') newSteps[i].options = ['', '']
    setSteps(newSteps)
  }

  const updateOption = (si, oi, value) => {
    const newSteps = [...steps]
    newSteps[si].options[oi] = value
    setSteps(newSteps)
  }

  const addOption = (si) => {
    const newSteps = [...steps]
    newSteps[si].options.push('')
    setSteps(newSteps)
  }

  const removeOption = (si, oi) => {
    const newSteps = [...steps]
    if (newSteps[si].options.length > 2) {
      newSteps[si].options.splice(oi, 1)
      setSteps(newSteps)
    }
  }

  const handleSubmit = () => {
    if (!title.trim()) return
    addPoll({
      type: 'survey',
      title,
      steps: steps.map(s => ({
        ...s,
        options: s.type === 'closed' ? s.options.filter(o => o.trim()) : []
      })),
      responses: [],
    })
    navigate('/')
  }

  return (
    <div className="form-container">
      <h1 className="form-title">Создание опроса</h1>
      <div className="form-card">
        <label className="form-label">Название опроса</label>
        <input className="form-input" placeholder="Например: Ретроспектива спринта" value={title} onChange={e => setTitle(e.target.value)} />
      </div>

      {steps.map((step, i) => (
        <div key={i} className="form-card step-card">
          <div className="step-header">
            <span className="form-label" style={{ marginBottom: 0 }}>Вопрос {i + 1}</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select className="form-select" value={step.type} onChange={e => updateStep(i, 'type', e.target.value)}>
                <option value="closed">С вариантами ответа</option>
                <option value="open">Открытый вопрос</option>
              </select>
              {steps.length > 1 && <button className="btn-remove" onClick={() => removeStep(i)}>×</button>}
            </div>
          </div>
          <input className="form-input" placeholder="Введите вопрос" value={step.question} onChange={e => updateStep(i, 'question', e.target.value)} />

          {step.type === 'closed' && (
            <div>
              <label className="form-label" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Варианты ответа</label>
              {step.options.map((opt, oi) => (
                <div key={oi} className="option-row">
                  <input className="form-input" placeholder={`Вариант ${oi + 1}`} value={opt} onChange={e => updateOption(i, oi, e.target.value)} />
                  {step.options.length > 2 && <button className="btn-remove" onClick={() => removeOption(i, oi)}>×</button>}
                </div>
              ))}
              <button className="btn-add" onClick={() => addOption(i)}>+ Добавить вариант</button>
            </div>
          )}
        </div>
      ))}

      <button className="btn-add" onClick={addStep} style={{ marginBottom: '24px', fontSize: '15px' }}>+ Добавить вопрос</button>
      <br />
      <button className="btn-primary btn-large" onClick={handleSubmit}>Создать опрос</button>
    </div>
  )
}