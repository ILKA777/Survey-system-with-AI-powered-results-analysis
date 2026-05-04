export default function UserBadge({ name, onLogout }) {
  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      paddingRight: '0px',
      marginLeft: '16px',
      marginRight: '-40px',
    }}>
      {/* Оранжевый полукруг*/}
      <svg 
        width="400" 
        height="64" 
        viewBox="0 0 400 140" 
        preserveAspectRatio="none"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: 'absolute',
          top: '-18px',
          left: '-40px',
          width: 'calc(100% + 80px)',
          height: '68px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <path d="M0 0H400V140C270 125 190 146 100 118C35 98 20 47 0 0Z" fill="#F4B040" opacity="0.9"/>
      </svg>

      {/* Имя пользователя */}
      <span style={{
        position: 'relative',
        zIndex: 1,
        color: '#fff',
        fontSize: '14px',
        fontWeight: '500',
        whiteSpace: 'nowrap',
      }}>
        {name}
      </span>

      {/* Кнопка выхода */}
      <button
        onClick={onLogout}
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '6px 16px',
          borderRadius: '6px',
          background: 'rgba(255,255,255,0.2)',
          color: '#fff',
          border: 'none',
          fontSize: '13px',
          fontWeight: '500',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          marginRight: '40px',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
        onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
      >
        Выйти
      </button>
    </div>
  )
}