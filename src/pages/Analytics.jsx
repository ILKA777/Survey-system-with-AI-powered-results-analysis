import { usePoll } from '../context/PollContext'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

export default function Analytics() {
  const { polls } = usePoll()

  const totalPolls = polls.length
  const totalVotes = polls.reduce((sum, p) => {
    if (p.type === 'vote') return sum + Object.values(p.votes || {}).reduce((a, b) => a + b, 0)
    return sum
  }, 0)
  const totalResponses = polls.reduce((sum, p) => {
    if (p.type === 'survey') return sum + (p.responses?.length || 0)
    return sum
  }, 0)

  const surveysCount = polls.filter(p => p.type === 'survey').length
  const votesCount = polls.filter(p => p.type === 'vote').length

  const surveysWithResponses = polls.filter(p => p.type === 'survey' && p.responses?.length > 0).length
  const votesWithResponses = polls.filter(p => p.type === 'vote' && Object.values(p.votes || {}).reduce((a, b) => a + b, 0) > 0).length

  return (
    <div>
      <h1 className="dashboard-title" style={{ marginBottom: '8px' }}>Аналитика</h1>
      <p className="dashboard-subtitle" style={{ marginBottom: '32px' }}>Сводка по всем опросам</p>

      {/* Карточки со статистикой */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontWeight: '700', color: 'var(--accent)' }}>{totalPolls}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Всего опросов</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontWeight: '700', color: 'var(--accent-orange)' }}>{totalVotes}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Всего голосов</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontWeight: '700', color: '#34C759' }}>{totalResponses}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Ответов на опросы</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontWeight: '700', color: '#C48835' }}>
            {totalPolls > 0 ? Math.round((surveysWithResponses + votesWithResponses) / totalPolls * 100) : 0}%
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Активность</div>
        </div>
      </div>

      {/* Графики */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '16px' }}>Типы опросов</h3>
          <div style={{ maxWidth: '250px', margin: '0 auto' }}>
            <Doughnut
              data={{
                labels: ['Опросы', 'Голосования'],
                datasets: [{
                  data: [surveysCount, votesCount],
                  backgroundColor: ['#F47D59', '#F2A33C'],
                  borderWidth: 0,
                }],
              }}
              options={{ plugins: { legend: { position: 'bottom' } } }}
            />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '16px' }}>Активность по опросам</h3>
          <Bar
            data={{
              labels: ['С ответами', 'Без ответов'],
              datasets: [{
                label: 'Опросы',
                data: [surveysWithResponses, surveysCount - surveysWithResponses],
                backgroundColor: ['#F47D59', '#E8C7A4'],
                borderRadius: 6,
              }],
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
            }}
          />
        </div>
      </div>

      {/* Топ опросов */}
      <div className="card">
        <h3 style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '16px' }}>Топ опросов по ответам</h3>
        {polls.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Нет данных</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[...polls]
              .sort((a, b) => {
                const getA = a.type === 'vote' ? Object.values(a.votes || {}).reduce((s, v) => s + v, 0) : (a.responses?.length || 0)
                const getB = b.type === 'vote' ? Object.values(b.votes || {}).reduce((s, v) => s + v, 0) : (b.responses?.length || 0)
                return getB - getA
              })
              .slice(0, 5)
              .map((p, i) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: i < 3 ? 'var(--accent)' : 'var(--bg-hover)', color: i < 3 ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600' }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{p.type === 'vote' ? p.question : p.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {p.type === 'vote' 
                        ? `${Object.values(p.votes || {}).reduce((s, v) => s + v, 0)} голосов`
                        : `${p.responses?.length || 0} ответов`
                      }
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}