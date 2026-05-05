import { usePoll } from '../context/PollContext'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

export default function Analytics() {
  const { polls } = usePoll()

  const totalPolls = polls.length
  const surveysCount = polls.filter(p => p.type === 'SURVEY').length
  const votesCount = polls.filter(p => p.type === 'VOTE').length
  const publishedCount = polls.filter(p => p.status === 'PUBLISHED').length

  const chartColors = { plugins: { legend: { labels: { color: 'rgba(232,234,237,0.55)', font: { family: 'JetBrains Mono' } } } } }
  const scaleColors = {
    scales: {
      y: { beginAtZero: true, ticks: { color: 'rgba(232,234,237,0.4)', font: { family: 'JetBrains Mono', size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
      x: { ticks: { color: 'rgba(232,234,237,0.4)', font: { family: 'JetBrains Mono', size: 11 } }, grid: { display: false } },
    },
  }

  return (
    <div>
      <div style={{ marginBottom: '28px', animation: 'fadeInUp 0.35s ease both' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '4px' }}>Аналитика</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>Сводка по всем опросам</p>
      </div>

      <div className="analytics-grid">
        <div className="analytics-stat">
          <div className="analytics-number">{totalPolls}</div>
          <div className="analytics-label">Всего опросов</div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-number">{surveysCount}</div>
          <div className="analytics-label">Опросов</div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-number">{votesCount}</div>
          <div className="analytics-label">Голосований</div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-number" style={{ color: 'var(--green)' }}>{publishedCount}</div>
          <div className="analytics-label">Активных</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: 700 }}>Типы опросов</h3>
          <div style={{ maxWidth: '220px', margin: '0 auto' }}>
            <Doughnut
              data={{
                labels: ['Опросы', 'Голосования'],
                datasets: [{ data: [surveysCount, votesCount], backgroundColor: ['#6366F1', '#22C55E'], borderWidth: 0 }],
              }}
              options={{ plugins: { legend: { position: 'bottom', labels: { color: 'rgba(232,234,237,0.55)', font: { family: 'JetBrains Mono' } } } } }}
            />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: 700 }}>По статусам</h3>
          <Bar
            data={{
              labels: ['Черновик', 'Активен', 'Закрыт'],
              datasets: [{
                label: 'Опросы',
                data: [
                  polls.filter(p => p.status === 'DRAFT').length,
                  polls.filter(p => p.status === 'PUBLISHED').length,
                  polls.filter(p => p.status === 'CLOSED').length,
                ],
                backgroundColor: ['rgba(99,102,241,0.4)', '#6366F1', 'rgba(99,102,241,0.2)'],
                borderRadius: 6,
              }],
            }}
            options={{ responsive: true, ...chartColors, ...scaleColors, plugins: { ...chartColors.plugins, legend: { display: false } } }}
          />
        </div>
      </div>
    </div>
  )
}
