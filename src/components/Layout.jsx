import { Link, useLocation } from 'react-router-dom'
import { usePoll } from '../context/PollContext'
import Logo from './Logo'
import BackgroundDecorRight from './BackgroundDecorRight'
import BackgroundDecorLeft from './BackgroundDecorLeft'
import UserBadge from './UserBadge'
import LogoWave from './LogoWave'

export default function Layout({ children }) {
  const { user, setUser } = usePoll()
  const location = useLocation()

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', position: 'relative' }}>
          <LogoWave />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Logo size={40} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, position: 'relative', zIndex: 1 }}>
            <span style={{
              fontSize: '20px',
              fontWeight: '700',
              color: 'var(--text-secondary)',
            }}>
              PulseRoom
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: '400',
              color: 'var(--text-muted)',
              letterSpacing: '0.3px',
            }}>
              Live-опросы, которые сразу объясняют ответы
            </span>
          </div>
        </Link>

        <nav className="nav">
          <Link to="/" className={`nav-link${location.pathname === '/' ? ' active' : ''}`}>
            Панель
          </Link>
          <Link to="/create/poll" className={`nav-link${location.pathname === '/create/poll' ? ' active' : ''}`}>
            Новый опрос
          </Link>
          <Link to="/create/vote" className={`nav-link${location.pathname === '/create/vote' ? ' active' : ''}`}>
            Голосование
          </Link>
          <Link to="/templates" className={`nav-link${location.pathname === '/templates' ? ' active' : ''}`}>
            Шаблоны
          </Link>
          <Link to="/analytics" className={`nav-link${location.pathname === '/analytics' ? ' active' : ''}`}>
            Аналитика
          </Link>

          <UserBadge name={user?.name} onLogout={() => setUser(null)} />
        </nav>
      </header>

      <main className="content" style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </main>

      <BackgroundDecorRight />
      <BackgroundDecorLeft />
    </div>
  )
}