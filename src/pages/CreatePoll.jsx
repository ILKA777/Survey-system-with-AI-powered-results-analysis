import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePoll } from '../context/PollContext'
import { FEATURES } from '../config/features'
import { generatePoll } from '../api/ai.js'

export default function CreatePoll() {
  const { addPoll, templates, useTemplate, loadPolls } = usePoll()
  const navigate = useNavigate()
  const [tab, setTab] = useState('manual')
  const [title, setTitle] = useState('')
  const [pages, setPages] = useState([{ pageOrder: 1, question: '', questionType: 'SINGLE_CHOICE', options: ['', ''], required: true }])
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')

  const addPage = () => setPages(prev => [...prev, {
    pageOrder: prev.length + 1, question: '', questionType: 'SINGLE_CHOICE', options: ['', ''], required: true
  }])

  const removePage = (i) => { if (pages.length > 1) setPages(prev => prev.filter((_, idx) => idx !== i)) }

  const updatePage = (i, field, value) => {
    setPages(prev => prev.map((p, idx) => {
      if (idx !== i) return p
      const updated = { ...p, [field]: value }
      if (field === 'questionType' && value === 'TEXT') updated.options = []
      if (field === 'questionType' && value !== 'TEXT' && p.options.length === 0) updated.options = ['', '']
      return updated
    }))
  }

  const updateOption = (pi, oi, value) => {
    setPages(prev => prev.map((p, idx) => {
      if (idx !== pi) return p
      const options = [...p.options]
      options[oi] = value
      return { ...p, options }
    }))
  }

  const addOption = (pi) => setPages(prev => prev.map((p, idx) => idx !== pi ? p : { ...p, options: [...p.options, ''] }))
  const removeOption = (pi, oi) => setPages(prev => prev.map((p, idx) => idx !== pi ? p : { ...p, options: p.options.length > 2 ? p.options.filter((_, i) => i !== oi) : p.options }))

  const handleManualSubmit = async () => {
    if (!title.trim()) { setError('Введите название'); return }
    const cleanPages = pages.map((p, i) => ({
      ...p,
      pageOrder: i + 1,
      options: p.questionType !== 'TEXT' ? p.options.filter(o => o.trim()) : [],
    }))
    const poll = await addPoll({ type: 'SURVEY', title, pages: cleanPages })
    navigate(`/poll/${poll.id}`)
  }

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) { setError('Введите описание'); return }
    setAiLoading(true); setError('')
    try {
      // Бэкенд сразу создаёт и сохраняет опрос, возвращая готовый PollResponse.
      const poll = await generatePoll(aiPrompt, 'SURVEY', 5)
      await loadPolls()
      navigate(`/poll/${poll.id}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setAiLoading(false)
    }
  }

  const handleUseTemplate = async (tpl) => {
    const poll = await useTemplate(tpl)
    navigate(`/poll/${poll.id}`)
  }

  return (
    <div className="form-container">
      <h1 className="form-title">Создание опроса</h1>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'manual' ? 'active' : ''}`} onClick={() => setTab('manual')}>Вручную</button>
        {FEATURES.aiGenerate && (
          <button className={`tab-btn ${tab === 'ai' ? 'active' : ''}`} onClick={() => setTab('ai')}>AI-генерация</button>
        )}
        <button className={`tab-btn ${tab === 'template' ? 'active' : ''}`} onClick={() => setTab('template')}>Шаблон</button>
      </div>

      {error && <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

      {tab === 'manual' && (
        <>
          <div className="form-card">
            <label className="form-label">Название опроса</label>
            <input className="form-input" placeholder="Ретроспектива спринта" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          {pages.map((page, i) => (
            <div key={i} className="form-card step-card">
              <div className="step-header">
                <span className="form-label" style={{ marginBottom: 0 }}>Вопрос {i + 1}</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select className="form-select" value={page.questionType} onChange={e => updatePage(i, 'questionType', e.target.value)}>
                    <option value="SINGLE_CHOICE">Один вариант</option>
                    <option value="MULTIPLE_CHOICE">Несколько вариантов</option>
                    <option value="TEXT">Открытый ответ</option>
                  </select>
                  {pages.length > 1 && <button className="btn-remove" onClick={() => removePage(i)}>×</button>}
                </div>
              </div>
              <input className="form-input" placeholder="Введите вопрос" value={page.question} onChange={e => updatePage(i, 'question', e.target.value)} />

              {page.questionType !== 'TEXT' && (
                <div>
                  <label className="form-label">Варианты ответа</label>
                  {page.options.map((opt, oi) => (
                    <div key={oi} className="option-row">
                      <input className="form-input" style={{ marginBottom: 0 }} placeholder={`Вариант ${oi + 1}`} value={opt} onChange={e => updateOption(i, oi, e.target.value)} />
                      {page.options.length > 2 && <button className="btn-remove" onClick={() => removeOption(i, oi)}>×</button>}
                    </div>
                  ))}
                  <button className="btn-add" onClick={() => addOption(i)}>+ Добавить вариант</button>
                </div>
              )}
            </div>
          ))}

          <button className="btn-add" onClick={addPage} style={{ marginBottom: '20px', fontSize: '14px' }}>+ Добавить вопрос</button>
          <br />
          <button className="btn btn-primary btn-lg" onClick={handleManualSubmit}>Создать опрос</button>
        </>
      )}

      {FEATURES.aiGenerate && tab === 'ai' && (
        <div className="form-card">
          <label className="form-label">Опишите опрос</label>
          <textarea
            className="form-textarea"
            placeholder="Например: опрос для оценки удовлетворённости онлайн-курсом по программированию"
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
          />
          <p style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '16px' }}>
            AI сгенерирует 5 вопросов на основе вашего описания
          </p>
          <button className="btn btn-primary btn-lg" onClick={handleAIGenerate} disabled={aiLoading}>
            {aiLoading ? 'Генерирую...' : 'Сгенерировать опрос'}
          </button>
        </div>
      )}

      {tab === 'template' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {templates.map(tpl => (
            <div key={tpl.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontWeight: 700, fontSize: '14px' }}>{tpl.name}</p>
              <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-3)' }}>
                {tpl.pages?.length || 0} вопросов
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => handleUseTemplate(tpl)}>
                Использовать
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
