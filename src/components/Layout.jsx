import { Link, useLocation } from 'react-router-dom'
import { usePoll } from '../context/PollContext'
import { HomeSimple, StatsReport, Plus } from 'iconoir-react'

function NavLink({ to, children, icon: Icon }) {
  const location = useLocation()
  const active = location.pathname === to || location.pathname.startsWith(to + '/')
  return (
    <Link to={to} className={`nav-link${active ? ' active' : ''}`}>
      {Icon && <Icon width={14} height={14} />}
      {children}
    </Link>
  )
}

export default function Layout({ children }) {
  const { user, signout } = usePoll()
  const initials = user?.nickname?.slice(0, 2).toUpperCase() || '?'

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none' }}>
          <div className="logo-mark">
            <svg width="18" height="12" viewBox="0 0 22 14" fill="none">
              <polyline points="0,7 4,7 6,4 8,12 10,1 12,13 14,7 22,7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="logo-text">PulseRoom</span>
        </Link>

        <nav className="nav">
          <NavLink to="/" icon={HomeSimple}>Дашборд</NavLink>
          <NavLink to="/create/poll" icon={Plus}>Создать</NavLink>
          <NavLink to="/analytics" icon={StatsReport}>Аналитика</NavLink>
          {user && (
            <div className="user-badge" onClick={signout} title="Выйти">
              <span className="user-badge-name">{user.nickname}</span>
              <div className="user-badge-avatar">{initials}</div>
            </div>
          )}
        </nav>
      </header>

      <main className="content">{children}</main>
    </div>
  )
}
