import { Link } from 'react-router-dom'
import { usePoll } from '../context/PollContext'
import { Plus, Notes, StatsUpSquare, Copy, Trash, StatsReport } from 'iconoir-react'

export default function Dashboard() {
  const { polls, duplicatePoll, deletePoll, loading } = usePoll()

  if (loading) return (
    <div style={{ color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: '13px', padding: '60px 0', textAlign: 'center' }}>
      Загрузка...
    </div>
  )

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Дашборд</h1>
          <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>
            {polls.length} {polls.length === 1 ? 'опрос' : polls.length >= 2 && polls.length <= 4 ? 'опроса' : 'опросов'}
          </p>
        </div>
        <div className="dashboard-actions">
          <Link to="/create/poll" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus width={15} height={15} /> Создать
          </Link>
        </div>
      </div>

      {polls.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><StatsReport width={24} height={24} /></div>
          <p className="empty-title">Нет опросов</p>
          <p className="empty-text">Создайте первый опрос или голосование</p>
          <Link to="/create/poll" className="btn btn-primary">
            <Plus width={15} height={15} /> Создать опрос
          </Link>
        </div>
      ) : (
        <div className="polls-grid">
          {polls.map(poll => {
            const statusLabel = { DRAFT: 'Черновик', PUBLISHED: 'Активен', CLOSED: 'Закрыт' }[poll.status] || poll.status
            const statusClass = { DRAFT: 'badge-draft', PUBLISHED: 'badge-published', CLOSED: 'badge-closed' }[poll.status] || 'badge-draft'

            return (
              <div key={poll.id} className="poll-card">
                <div className="poll-card-body">
                  <div className="poll-card-header">
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span className={`badge ${poll.type === 'VOTE' ? 'badge-vote' : 'badge-survey'}`}>
                        {poll.type === 'VOTE'
                          ? <><StatsUpSquare width={10} height={10} /> Голосование</>
                          : <><Notes width={10} height={10} /> Опрос</>}
                      </span>
                      <span className={`badge ${statusClass}`}>{statusLabel}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-3)' }}>
                      {new Date(poll.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>

                  <p className="poll-card-title">{poll.title}</p>

                  <div className="poll-card-meta">
                    <span>{poll.pages?.length || 0} вопросов</span>
                    {poll.room_code && (
                      <>
                        <span>·</span>
                        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{poll.room_code}</span>
                      </>
                    )}
                  </div>

                  <div className="poll-card-actions">
                    <Link to={`/poll/${poll.id}`} className="btn btn-primary btn-sm">
                      Открыть
                    </Link>
                    <Link to={`/poll/${poll.id}`} className="btn btn-outline btn-sm">
                      <StatsReport width={13} height={13} /> Итоги
                    </Link>
                    <button className="btn btn-ghost btn-sm" onClick={() => duplicatePoll(poll.id)} title="Дублировать">
                      <Copy width={13} height={13} />
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Удалить опрос?')) deletePoll(poll.id) }} title="Удалить">
                      <Trash width={13} height={13} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
