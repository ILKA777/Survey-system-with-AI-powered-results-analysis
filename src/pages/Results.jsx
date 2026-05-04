import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { usePoll } from '../context/PollContext'
import { Bar } from 'react-chartjs-2'
import { QRCodeSVG } from 'qrcode.react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

function создатьИтог(опрос) {
  if (опрос.type === 'vote') {
    const всего = Object.values(опрос.votes || {}).reduce((a, b) => a + b, 0)
    if (всего === 0) return { текст: 'Голосов пока нет. Поделитесь ссылкой, чтобы начать сбор!', победитель: null }
    const победитель = опрос.options.reduce((a, b) => (опрос.votes[a] || 0) > (опрос.votes[b] || 0) ? a : b)
    const процент = ((опрос.votes[победитель] || 0) / всего * 100).toFixed(0)
    return {
      текст: `🏆 «${победитель}» — явный победитель с ${процент}% голосов (${опрос.votes[победитель]} из ${всего}).`,
      победитель,
    }
  }
  if (опрос.type === 'survey') {
    const всего = (опрос.responses || []).length
    if (всего === 0) return { текст: 'Ответов пока нет. Поделитесь ссылкой, чтобы собрать обратную связь!', победитель: null }
    return { текст: `📊 ${всего} человек прошли опрос. Изучите детальную разбивку ниже.`, победитель: null }
  }
  return { текст: '', победитель: null }
}

function выгрузитьCSV(опрос) {
  if (опрос.type === 'vote') {
    let csv = 'Вариант,Голосов\n'
    опрос.options.forEach(opt => { csv += `"${opt}",${опрос.votes?.[opt] || 0}\n` })
    return csv
  }
  if (опрос.type === 'survey') {
    const заголовки = опрос.steps.map((s, i) => `"Вопрос ${i + 1}: ${s.question}"`).join(',')
    let csv = заголовки + '\n'
    ;(опрос.responses || []).forEach(ответ => {
      const строка = опрос.steps.map((s, i) => `"${ответ[i]?.answer || ''}"`).join(',')
      csv += строка + '\n'
    })
    return csv
  }
  return ''
}

function скачатьФайл(содержимое, имя, тип = 'text/csv') {
  const blob = new Blob(['\uFEFF' + содержимое], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = имя
  a.click()
  URL.revokeObjectURL(url)
}

export default function Results() {
  const { id } = useParams()
  const { getPoll } = usePoll()
  const опрос = getPoll(id)
  const [показатьИИ, setПоказатьИИ] = useState(false)
  const [показатьQR, setПоказатьQR] = useState(false)

  if (!опрос) return <div className="results-container" style={{ color: 'var(--text-muted)' }}>Результаты не найдены</div>

  const итог = создатьИтог(опрос)
  const ссылка = `${window.location.origin}/${опрос.type === 'vote' ? 'vote' : 'poll'}/${опрос.id}`

  const завершение = опрос.type === 'survey'
    ? опрос.responses?.length > 0 ? 100 : 0
    : Object.values(опрос.votes || {}).reduce((a, b) => a + b, 0) > 0 ? 100 : 0

  if (опрос.type === 'vote') {
    const метки = опрос.options || []
    const данные = метки.map(o => опрос.votes?.[o] || 0)
    const всего = данные.reduce((a, b) => a + b, 0)

    const chartData = {
      labels: метки,
      datasets: [{
        data: данные,
        backgroundColor: ['#F47D59', '#F2A33C', '#E06A4A', '#D4A574', '#C49A6C'],
        borderRadius: 8,
        maxBarThickness: 60,
      }],
    }

    const chartOptions = {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#E8C7A4' } },
        x: { grid: { display: false } },
      },
    }

    return (
      <div className="results-container">
        <h1 className="results-title">{опрос.question}</h1>
        <p className="results-subtitle">{всего} голосов · Завершение: {завершение}%</p>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button className="btn-outline" onClick={() => { navigator.clipboard.writeText(ссылка); alert('Ссылка скопирована!') }}>
            🔗 Копировать ссылку
          </button>
          <button className="btn-outline" onClick={() => скачатьФайл(выгрузитьCSV(опрос), `${опрос.question}.csv`)}>
            📥 Скачать CSV
          </button>
          <button className="btn-outline" onClick={() => setПоказатьQR(!показатьQR)}>
            📱 QR-код
          </button>
          <button className="btn-primary" onClick={() => setПоказатьИИ(!показатьИИ)}>
            🤖 {показатьИИ ? 'Скрыть' : 'ИИ-анализ'}
          </button>
        </div>

        {показатьИИ && (
          <div className="results-card" style={{ background: '#FDE8E0', border: '1px solid var(--accent)' }}>
            <h3 style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>🤖 ИИ-анализ</h3>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-primary)' }}>{итог.текст}</p>
          </div>
        )}

        {показатьQR && (
          <div className="results-card" style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>📱 QR-код для шаринга</h3>
            <QRCodeSVG value={ссылка} size={200} level="M" />
            <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>Наведите камеру телефона, чтобы открыть опрос</p>
          </div>
        )}

        <div className="results-card">
          <div className="chart-wrapper"><Bar data={chartData} options={chartOptions} /></div>
          <div className="stats-grid">
            {метки.map(opt => (
              <div key={opt} className="stat-card">
                <div className="stat-number">{опрос.votes?.[opt] || 0}</div>
                <div className="stat-label">{opt}</div>
              </div>
            ))}
          </div>
          {всего > 0 && итог.победитель && (
            <div className="winner-card">
              <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--accent-orange)' }}>🏆 Победитель</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {итог.победитель}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {((опрос.votes?.[итог.победитель] || 0) / всего * 100).toFixed(1)}% голосов
              </div>
            </div>
          )}
        </div>

        <div className="results-card">
          <h3 style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>📱 Поделиться голосованием</h3>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <input className="form-input" value={ссылка} readOnly style={{ marginBottom: 0, flex: 1 }} />
            <button className="btn-primary" onClick={() => { navigator.clipboard.writeText(ссылка); alert('Скопировано!') }}>
              Копировать
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Результаты опроса
  const ответы = опрос.responses || []

  return (
    <div className="results-container">
      <h1 className="results-title">{опрос.title}</h1>
      <p className="results-subtitle">{ответы.length} ответов · Завершение: {завершение}%</p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button className="btn-outline" onClick={() => { navigator.clipboard.writeText(ссылка); alert('Ссылка скопирована!') }}>
          🔗 Копировать ссылку
        </button>
        <button className="btn-outline" onClick={() => скачатьФайл(выгрузитьCSV(опрос), `${опрос.title}.csv`)}>
          📥 Скачать CSV
        </button>
        <button className="btn-outline" onClick={() => setПоказатьQR(!показатьQR)}>
          📱 QR-код
        </button>
        <button className="btn-primary" onClick={() => setПоказатьИИ(!показатьИИ)}>
          🤖 {показатьИИ ? 'Скрыть' : 'ИИ-анализ'}
        </button>
      </div>

      {показатьИИ && (
        <div className="results-card" style={{ background: '#FDE8E0', border: '1px solid var(--accent)' }}>
          <h3 style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>🤖 ИИ-анализ</h3>
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-primary)' }}>{итог.текст}</p>
        </div>
      )}

      {показатьQR && (
        <div className="results-card" style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>📱 QR-код для шаринга</h3>
          <QRCodeSVG value={ссылка} size={200} level="M" />
          <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>Наведите камеру телефона, чтобы открыть опрос</p>
        </div>
      )}

      <div className="results-card">
        <h3 style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>Процент завершения</h3>
        <div className="progress-bar" style={{ height: '28px', background: 'var(--bg-white)' }}>
          <div className="progress-fill" style={{ width: `${завершение}%`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: '600' }}>
            {завершение}%
          </div>
        </div>
      </div>

      {опрос.steps?.map((шаг, i) => {
        const ответыНаВопрос = ответы.map(r => r[i]?.answer).filter(Boolean)
        return (
          <div key={i} className="results-card">
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-secondary)' }}>
              {шаг.question}
            </h3>
            {шаг.type === 'closed' ? (
              <div>
                {шаг.options.map(opt => {
                  const количество = ответыНаВопрос.filter(a => a === opt).length
                  const процент = ответыНаВопрос.length > 0 ? (количество / ответыНаВопрос.length * 100).toFixed(0) : 0
                  return (
                    <div key={opt} style={{
                      display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px'
                    }}>
                      <div style={{ minWidth: '120px', fontSize: '14px', color: 'var(--text-primary)' }}>{opt}</div>
                      <div style={{
                        flex: 1, height: '28px', background: 'var(--bg-white)',
                        borderRadius: '6px', overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${процент}%`, height: '100%',
                          background: 'var(--accent)', borderRadius: '6px',
                        }} />
                      </div>
                      <div style={{ minWidth: '60px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                        {количество} ({процент}%)
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div>
                {ответыНаВопрос.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Ответов пока нет</p>}
                {ответыНаВопрос.map((a, ai) => (
                  <div key={ai} style={{
                    padding: '10px 0', borderBottom: '1px solid var(--border)',
                    fontSize: '14px', color: 'var(--text-primary)'
                  }}>
                    «{a}»
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <div className="results-card">
        <h3 style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>📱 Поделиться опросом</h3>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <input className="form-input" value={ссылка} readOnly style={{ marginBottom: 0, flex: 1 }} />
          <button className="btn-primary" onClick={() => { navigator.clipboard.writeText(ссылка); alert('Скопировано!') }}>
            Копировать
          </button>
        </div>
      </div>
    </div>
  )
}