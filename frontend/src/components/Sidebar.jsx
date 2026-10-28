/**
 * frontend/src/components/Sidebar.jsx
 * Persistent left navigation sidebar.
 */
import { NavLink, useNavigate } from 'react-router-dom'
import { auth } from '../services/auth'

const NAV_ITEMS = [
  { to: '/overview',   icon: '⬡', label: 'Overview' },
  { to: '/review',     icon: '🔍', label: 'Content Review' },
  { to: '/guidelines', icon: '📋', label: 'Brand Guidelines' },
  { to: '/documents',  icon: '📁', label: 'Policy & Documents' },
  { to: '/history',    icon: '🕒', label: 'Review History' },
  { to: '/insights',   icon: '📊', label: 'Insights' },
  { to: '/settings',   icon: '⚙️', label: 'Settings' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const user = auth.getUser()

  function handleLogout() {
    auth.clearSession()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⬡</div>
        <div>
          <div className="sidebar-logo-text">Brandguard AI</div>
          <div className="sidebar-logo-sub">Brand Governance</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        <div className="nav-section-label">Navigation</div>
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            aria-label={label}
          >
            <span className="nav-icon" aria-hidden="true">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer: Dynamic Logged-in User Information */}
      <div className="sidebar-footer">
        <div className="sidebar-team" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <strong style={{ color: 'var(--color-gold)', fontSize: '12px' }}>
            {user?.company?.name || 'Brandguard AI'}
          </strong>
          <span style={{ color: 'rgba(247, 246, 240, 0.8)', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            👤 {user?.full_name || user?.name || 'Brand Administrator'}
          </span>
          <span style={{ color: 'rgba(247, 246, 240, 0.45)', fontSize: '10px' }}>
            {user?.role === 'judge' ? 'Verified Auditor / Judge' : 'Brand Administrator'}
          </span>
        </div>


        {/* Subtle Logout Button */}
        <button
          type="button"
          id="sidebar-logout-btn"
          onClick={handleLogout}
          style={{
            marginTop: 12,
            width: '100%',
            padding: '7px 10px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 6,
            color: 'rgba(247, 246, 240, 0.7)',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(248, 113, 113, 0.15)'
            e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.35)'
            e.currentTarget.style.color = '#FCA5A5'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
            e.currentTarget.style.color = 'rgba(247, 246, 240, 0.7)'
          }}
          title="Sign out of current workspace"
        >
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
