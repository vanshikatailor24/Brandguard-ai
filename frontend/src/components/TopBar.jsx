/**
 * frontend/src/components/TopBar.jsx
 * Header component featuring current page title, status badge, and dynamic User Profile Circle
 * with a dark & forest-green profile dropdown modal.
 */
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../services/auth'
import { api } from '../services/api'

function getInitials(name, email) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return parts[0].substring(0, 2).toUpperCase()
  }
  if (email) {
    return email.substring(0, 2).toUpperCase()
  }
  return 'SD'
}

export default function TopBar({ title, badge }) {
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const [user, setUser] = useState(auth.getUser() || {})
  const dropdownRef = useRef(null)

  // Sync profile details from /api/v1/auth/me on mount
  useEffect(() => {
    let isMounted = true
    const cached = auth.getUser()
    if (cached) setUser(cached)

    api.getMe(cached?.email)
      .then((data) => {
        if (isMounted && data) {
          setUser(data)
          auth.updateUser(data)
        }
      })
      .catch(() => {
        // Fall back gracefully to cached session
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setProfileOpen(false)
      }
    }

    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [profileOpen])

  function handleSignOut() {
    auth.clearSession()
    setProfileOpen(false)
    navigate('/login', { replace: true })
  }

  const fullName = user.full_name || user.name || (user.email ? user.email.split('@')[0] : 'SYNTAX DUO Judge')
  const email = user.email || 'judge@syntaxduo.com'
  const initials = getInitials(fullName, email)
  const roleLabel = user.role === 'judge' ? 'Brand Administrator / Judge' : (user.role === 'admin' ? 'Brand Administrator' : 'Brand Contributor')
  const companyName = user.company?.name || 'Brandguard AI Enterprise'
  const industryType = user.company?.industry_type || user.company?.industry || 'Software/SaaS'
  const createdDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Oct 2026'

  return (
    <header className="topbar" style={{ position: 'relative' }}>
      {/* Left: Page Title & Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1 className="topbar-title">{title}</h1>
        {badge && <span className="topbar-badge">{badge}</span>}
      </div>

      {/* Right: User Profile Circle & Modal */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          id="topbar-profile-avatar-btn"
          type="button"
          aria-expanded={profileOpen}
          aria-label="Toggle user profile menu"
          onClick={() => setProfileOpen((prev) => !prev)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: profileOpen ? 'rgba(23, 63, 53, 0.12)' : 'transparent',
            border: '1px solid transparent',
            padding: '4px 8px 4px 4px',
            borderRadius: '999px',
            cursor: 'pointer',
            transition: 'background 0.2s, border-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!profileOpen) e.currentTarget.style.background = 'rgba(23, 63, 53, 0.08)'
          }}
          onMouseLeave={(e) => {
            if (!profileOpen) e.currentTarget.style.background = 'transparent'
          }}
        >
          {/* Circular Avatar */}
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #173F35 0%, #2D6A4F 100%)',
              border: '2px solid #C5A46D',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F7F6F0',
              fontWeight: 700,
              fontSize: '14px',
              letterSpacing: '0.5px',
            }}
          >
            {initials}
          </div>

          {/* User Name Pill (Desktop) */}
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--color-charcoal)',
                maxWidth: '140px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {fullName}
            </span>
            <span style={{ fontSize: '10px', color: 'rgba(37, 43, 40, 0.6)', fontWeight: 500 }}>
              {companyName}
            </span>
          </div>

          <span style={{ fontSize: '10px', color: 'rgba(37, 43, 40, 0.5)', marginLeft: '2px' }}>
            {profileOpen ? '▲' : '▼'}
          </span>
        </button>

        {/* Profile Dropdown Modal */}
        {profileOpen && (
          <div
            id="topbar-profile-modal"
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 0,
              width: '330px',
              background: '#122620',
              border: '1px solid rgba(220, 232, 223, 0.2)',
              borderRadius: '16px',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.65), 0 0 25px rgba(45, 106, 79, 0.3)',
              padding: '20px',
              zIndex: 1000,
              color: '#F7F6F0',
              animation: 'fadeIn 0.15s ease-out',
            }}
          >
            {/* Header: Avatar, Name, Email, Role */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2D6A4F 0%, #173F35 100%)',
                  border: '2px solid #C5A46D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#F7F6F0',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '15px',
                    color: '#F7F6F0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {fullName}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'rgba(247, 246, 240, 0.65)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: '4px',
                  }}
                >
                  {email}
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '10px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    background: 'rgba(197, 164, 109, 0.2)',
                    color: '#d4bb8e',
                    border: '1px solid rgba(197, 164, 109, 0.35)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}
                >
                  {roleLabel}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '12px 0' }} />

            {/* Company & Industry Info Card */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(220, 232, 223, 0.12)',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '14px',
              }}
            >
              <div style={{ fontSize: '11px', color: 'rgba(247, 246, 240, 0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>
                Associated Company
              </div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#F7F6F0', marginBottom: '6px' }}>
                🏢 {companyName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: 'rgba(247, 246, 240, 0.6)' }}>Industry:</span>
                <span
                  style={{
                    background: 'rgba(45, 106, 79, 0.4)',
                    color: '#a7f3d0',
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '2px 8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(52, 211, 153, 0.25)',
                  }}
                >
                  {industryType}
                </span>
              </div>
            </div>

            {/* Account Status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: 'rgba(247, 246, 240, 0.6)',
                marginBottom: '16px',
                padding: '0 4px',
              }}
            >
              <span>Status: <strong style={{ color: '#4ade80', fontWeight: 600 }}>● Active</strong></span>
              <span>Joined: {createdDate}</span>
            </div>

            {/* Quick Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                id="profile-edit-company-btn"
                type="button"
                onClick={() => {
                  setProfileOpen(false)
                  navigate('/onboarding')
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(220, 232, 223, 0.15)',
                  color: '#F7F6F0',
                  fontSize: '13px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
              >
                <span>✏️</span> Edit Profile / Company
              </button>

              <button
                id="profile-settings-btn"
                type="button"
                onClick={() => {
                  setProfileOpen(false)
                  navigate('/settings')
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(220, 232, 223, 0.15)',
                  color: '#F7F6F0',
                  fontSize: '13px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
              >
                <span>⚙️</span> Settings & Diagnostics
              </button>

              <button
                id="profile-signout-btn"
                type="button"
                onClick={handleSignOut}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(248, 113, 113, 0.12)',
                  border: '1px solid rgba(248, 113, 113, 0.3)',
                  color: '#fca5a5',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(248, 113, 113, 0.22)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(248, 113, 113, 0.12)')}
              >
                <span>🚪</span> Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
