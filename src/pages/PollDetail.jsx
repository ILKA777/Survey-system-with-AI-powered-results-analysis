import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { usePoll } from '../context/PollContext'
import { publishPoll } from '../api/polls.js'
import { getResults, exportJSON, exportCSV, downloadCSV } from '../api/results.js'
import { summarize } from '../api/ai.js'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Download, QrCode, BrainResearch } from 'iconoir-react'

export default function PollDetail() {
  const { id } = useParams()
  const { polls, loadPolls } = usePoll()
  const poll = polls.find(p => p.id === id)
  const [responses, setResponses] = useState([])
  const [aiSummary, setAiSummary] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [copied, setCopied] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const joinLink = poll ? `${window.location.origin}/join/${poll.room_code}` : ''

  useEffect(() => {
    if (!poll) return
    getResults(poll.id).then(setResponses).catch(() => {})
  }, [poll])

  const handleCopy = () => {
    navigator.clipboard.writeText(joinLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePublish = async () => {
    setPublishing(true)
    try {
      await publishPoll(id)
      await loadPolls()
    } finally {
      setPublishing(false)
    }
  }

  const handleAI = async () => {
    setAiLoading(true)
    try {
      const text = await summarize(poll, responses)
      setAiSummary(text)
    } finally {
      setAiLoading(false)
    }
  }

  const handleDownloadCSV = async () => {
    const data = await exportJSON(id)
    const csv = exportCSV(data.map(r => ({ ...r, answers: r.answers })), poll.pages || [])
    downloadCSV(csv, `${poll.title}.csv`)
  }

  const handleDownloadJSON = async () => {
    const data = await exportJSON(id)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${poll.title}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  if (!poll) return (
    <div style={{ color: 'var(--text-3)', fontFamily: 'var(--mono)', padding: '60px 0', textAlign: 'center' }}>
      Опрос не найден
    </div>
  )

  const statusLabel = { DRAFT: 'Черновик', PUBLISHED: 'Активен', CLOSED: 'Закрыт' }[poll.status] || poll.status
  const statusClass = { DRAFT: 'badge-draft', PUBLISHED: 'badge-published', CLOSED: 'badge-closed' }[poll.status] || 'badge-draft'

  return (
    <div className="poll-detail">
      <div className="poll-detail-hero">
        <div className="poll-detail-meta" style={{ marginBottom: '10px' }}>
          <span className={`badge ${statusClass}`}>{statusLabel}</span>
          <span className={`badge ${{ VOTE: 'badge-vote', SURVEY: 'badge-survey', QUIZ: 'badge-quiz' }[poll.type] || 'badge-survey'}`}>
            {{ VOTE: 'Голосование', SURVEY: 'Опрос', QUIZ: 'Викторина' }[poll.type] || poll.type}
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-3)' }}>
            {new Date(poll.created_at).toLocaleDateString('ru-RU')}
          </span>
        </div>
        <h1 className="poll-detail-title">{poll.title}</h1>
        {poll.status === 'DRAFT' && (
          <button className="btn btn-primary" onClick={handlePublish} disabled={publishing}>
            {publishing ? 'Публикую...' : 'Опубликовать'}
          </button>
        )}
      </div>

      <div className="share-box">
        <p className="share-box-label">Поделиться с участниками</p>
        <div style={{ marginBottom: '14px' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--mono)', marginBottom: '6px' }}>Код комнаты</p>
          <div className="room-code">{poll.room_code}</div>
        </div>
        <div className="share-row">
          <input
            className="form-input"
            style={{ marginBottom: 0, flex: 1, fontFamily: 'var(--mono)', fontSize: '12px' }}
            value={joinLink} readOnly
          />
          <button className="btn btn-outline btn-sm" onClick={handleCopy} style={{ flexShrink: 0 }}>
            <Copy width={13} height={13} /> {copied ? 'Скопировано!' : 'Копировать'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={() => setShowQR(!showQR)}>
            <QrCode width={13} height={13} /> QR-код
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleDownloadCSV}>
            <Download width={13} height={13} /> CSV
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleDownloadJSON}>
            <Download width={13} height={13} /> JSON
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleAI} disabled={aiLoading}>
            <BrainResearch width={13} height={13} /> {aiLoading ? 'Анализирую...' : 'AI-анализ'}
          </button>
        </div>

        {showQR && (
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <QRCodeSVG value={joinLink} size={160} level="M" fgColor="#E8EAED" bgColor="#1C2030" />
            <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-3)', marginTop: '8px' }}>
              Наведите камеру телефона
            </p>
          </div>
        )}
      </div>

      {aiSummary && (
        <div className="ai-card">
          <p className="ai-card-title"><BrainResearch width={12} height={12} /> AI-анализ</p>
          <p className="ai-card-text">{aiSummary}</p>
        </div>
      )}

      <div className="results-card">
        <p className="results-question-title">
          Результаты · {responses.length} {responses.length === 1 ? 'ответ' : responses.length < 5 ? 'ответа' : 'ответов'}
        </p>
        {responses.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
            Ответов пока нет. Поделитесь ссылкой!
          </p>
        ) : (
          poll.pages?.map((page, i) => {
            const answers = responses.map(r => r.answers.find(a => a.pageId === i + 1)).filter(Boolean)
            return (
              <div key={i} style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: 'var(--text-2)' }}>
                  {i + 1}. {page.question}
                </p>
                {page.questionType === 'TEXT' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {answers.map((a, ai) => a.textAnswer && (
                      <div key={ai} style={{ padding: '8px 12px', background: 'var(--bg-raised)', borderRadius: 'var(--r-sm)', fontSize: '13px', color: 'var(--text-2)' }}>
                        {a.textAnswer}
                      </div>
                    ))}
                  </div>
                ) : (
                  page.options?.map(opt => {
                    const count = answers.filter(a => (a.selectedOptions || []).includes(opt)).length
                    const pct = answers.length > 0 ? ((count / answers.length) * 100).toFixed(0) : 0
                    return (
                      <div key={opt} className="option-bar-row">
                        <span className="option-bar-label">{opt}</span>
                        <div className="option-bar-track">
                          <div className="option-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="option-bar-count">{count} ({pct}%)</span>
                      </div>
                    )
                  })
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
