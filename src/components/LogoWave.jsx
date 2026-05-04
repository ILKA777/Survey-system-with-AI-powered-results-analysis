export default function LogoWave() {
  return (
    <svg 
      width="300" 
      height="64" 
      viewBox="0 0 400 112" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: 'absolute',
        top: '-8px',
        left: '0',
        width: '260px',
        height: '66px',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <path d="M0 0H400C350 30 370 75 300 95C230 118 80 118 30 95C8 80 5 45 0 22V0Z" fill="#FDE2D3" opacity="0.9"/>
    </svg>
  )
}