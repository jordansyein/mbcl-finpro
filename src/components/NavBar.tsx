import { NavLink } from 'react-router-dom'

const links = [
  { to: '/capture', label: 'Capture', icon: '📷' },
  { to: '/practice', label: 'Practice', icon: '🎯' },
  { to: '/weak-points', label: 'Weak', icon: '⚠️' },
  { to: '/briefing', label: 'Briefing', icon: '📋' },
  { to: '/history', label: 'History', icon: '🗂️' },
  { to: '/profile', label: 'Profile', icon: '👤' },
]

export default function NavBar() {
  return (
    <nav className="bottom-nav">
      {links.map((l) => (
        <NavLink key={l.to} to={l.to} className={({ isActive }) => 'bottom-nav__link' + (isActive ? ' bottom-nav__link--active' : '')}>
          <span className="bottom-nav__icon" aria-hidden>{l.icon}</span>
          <span>{l.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
