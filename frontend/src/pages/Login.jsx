/**
 * frontend/src/pages/Login.jsx
 * Unified Authentication Portal for Brandguard AI:
 * Supports Sign In, User Account Creation (Sign Up), and One-Click Demo Judge Access.
 * Fully aligned with the dark & forest-green palette (#121212 / #1E1E1E / #2D6A4F).
 */
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../services/api'
import { auth } from '../services/auth'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  // 'login' | 'signup'
  const [mode, setMode] = useState('login')

  // Form Fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  const from = location.state?.from?.pathname || '/overview'

  function switchMode(newMode) {
    setMode(newMode)
    setError(null)
    setSuccessMsg(null)
  }

  // ── Perform Login ───────────────────────────────────────────────────────────
  async function performLogin(loginEmail, loginPass) {
    setLoading(true)
    setError(null)

    try {
      const data = await api.login({
        email: loginEmail,
        password: loginPass,
      })

      if (data && data.access_token) {
        auth.setSession(data.access_token, data.user)
        if (data.user?.has_completed_onboarding) {
          navigate('/overview', { replace: true })
        } else {
          navigate('/onboarding', { replace: true })
        }
      } else {
        throw new Error('Authentication succeeded but no access token received.')
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.')
    } finally {
      setLoading(false)
    }
  }

  // ── Perform Sign Up ─────────────────────────────────────────────────────────
  async function performSignUp() {
    if (!fullName.trim()) {
      setError('Please provide your full name.')
      return
    }
    if (!email.trim()) {
      setError('Please provide a valid email address.')
      return
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await api.signup({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
      })

      if (data && data.access_token) {
        auth.setSession(data.access_token, data.user)
        if (data.user?.has_completed_onboarding) {
          navigate('/overview', { replace: true })
        } else {
          navigate('/onboarding', { replace: true })
        }
      } else {
        throw new Error('Sign up succeeded but session could not be established.')
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Email may already be registered.')
    } finally {
      setLoading(false)
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault()
    if (mode === 'login') {
      if (!email.trim() || !password.trim()) {
        setError('Please enter both email and password.')
        return
      }
      performLogin(email.trim(), password.trim())
    } else {
      performSignUp()
    }
  }

  function handleDemoJudgeLogin() {
    setEmail('judge@brandguard.ai')
    setPassword('demo123')
    performLogin('judge@brandguard.ai', 'demo123')
  }


  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#121212',
        backgroundImage: 'radial-gradient(circle at 50% 15%, #1B4332 0%, #121212 80%)',
        padding: 20,
        fontFamily: "'Inter', system-ui, sans-serif",
        color: '#F7F6F0',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          background: '#1E1E1E',
          border: '1px solid rgba(45, 106, 79, 0.45)',
          borderRadius: 16,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65), 0 0 35px rgba(27, 67, 50, 0.3)',
          padding: '36px 32px',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 52,
              height: 52,
              background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)',
              borderRadius: 12,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              color: '#F7F6F0',
              marginBottom: 12,
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 4px 12px rgba(45, 106, 79, 0.35)',
            }}
          >
            ⬡
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#F7F6F0',
              marginBottom: 4,
            }}
          >
            Brandguard AI
          </h1>
          <p style={{ fontSize: 13, color: '#A0AAB2' }}>
            Enterprise Brand Governance &amp; Compliance Platform
          </p>
        </div>

        {/* Tab Toggle (Sign In vs Create Account) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: '#141414',
            padding: 4,
            borderRadius: 10,
            marginBottom: 20,
            border: '1px solid #2B2B2B',
          }}
        >
          <button
            type="button"
            id="tab-login"
            onClick={() => switchMode('login')}
            style={{
              padding: '9px 12px',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: mode === 'login' ? '#2D6A4F' : 'transparent',
              color: mode === 'login' ? '#FFFFFF' : '#8E9A92',
              boxShadow: mode === 'login' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            id="tab-signup"
            onClick={() => switchMode('signup')}
            style={{
              padding: '9px 12px',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: mode === 'signup' ? '#2D6A4F' : 'transparent',
              color: mode === 'signup' ? '#FFFFFF' : '#8E9A92',
              boxShadow: mode === 'signup' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            Create Account
          </button>
        </div>

        {/* Demo Judge Access Quick Button (Only on Login Tab) */}
        {mode === 'login' && (
          <div style={{ marginBottom: 20 }}>
            <button
              type="button"
              id="demo-login-btn"
              onClick={handleDemoJudgeLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)',
                border: '1px solid #52B788',
                borderRadius: 10,
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: '0 4px 14px rgba(45, 106, 79, 0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              <span>⚡</span>
              <span>Demo Login (Judge Access)</span>
            </button>
            <div
              style={{
                fontSize: 11,
                color: '#74C69D',
                textAlign: 'center',
                marginTop: 6,
              }}
            >
              One-click instant access with <code style={{ color: '#D8F3DC' }}>judge@brandguard.ai</code>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                margin: '18px 0 6px 0',
                color: '#6C757D',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <div style={{ flex: 1, height: 1, background: '#2D3748' }} />
              <span>or sign in manually</span>
              <div style={{ flex: 1, height: 1, background: '#2D3748' }} />
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: '#FCA5A5',
              marginBottom: 16,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div
            style={{
              background: 'rgba(74, 222, 128, 0.12)',
              border: '1px solid rgba(74, 222, 128, 0.4)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: '#86EFAC',
              marginBottom: 16,
            }}
          >
            ✅ {successMsg}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleFormSubmit}>
          {/* Full Name Field (Sign Up Only) */}
          {mode === 'signup' && (
            <div style={{ marginBottom: 14 }}>
              <label
                htmlFor="signup-name"
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#E0E6ED',
                  marginBottom: 6,
                }}
              >
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                placeholder="e.g. Alex Morgan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: '#141414',
                  border: '1px solid #333333',
                  borderRadius: 8,
                  color: '#F7F6F0',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {/* Email Field */}
          <div style={{ marginBottom: 14 }}>
            <label
              htmlFor="auth-email"
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#E0E6ED',
                marginBottom: 6,
              }}
            >
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              placeholder={mode === 'login' ? 'e.g. judge@brandguard.ai' : 'e.g. you@company.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              style={{
                width: '100%',
                padding: '11px 14px',
                background: '#141414',
                border: '1px solid #333333',
                borderRadius: 8,
                color: '#F7F6F0',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: mode === 'signup' ? 14 : 20 }}>
            <label
              htmlFor="auth-password"
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#E0E6ED',
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              style={{
                width: '100%',
                padding: '11px 14px',
                background: '#141414',
                border: '1px solid #333333',
                borderRadius: 8,
                color: '#F7F6F0',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Confirm Password Field (Sign Up Only) */}
          {mode === 'signup' && (
            <div style={{ marginBottom: 20 }}>
              <label
                htmlFor="signup-confirm-password"
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#E0E6ED',
                  marginBottom: 6,
                }}
              >
                Confirm Password
              </label>
              <input
                id="signup-confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: '#141414',
                  border: '1px solid #333333',
                  borderRadius: 8,
                  color: '#F7F6F0',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {/* Action Submit Button */}
          <button
            type="submit"
            id="auth-submit-btn"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#2D6A4F',
              border: 'none',
              borderRadius: 8,
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4)',
              transition: 'background 0.2s ease',
            }}
          >
            {loading ? (
              <span>Processing…</span>
            ) : mode === 'login' ? (
              <span>Sign In to Workspace →</span>
            ) : (
              <span>Create Account &amp; Enter →</span>
            )}
          </button>
        </form>

        {/* Mode Toggle Link */}
        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13 }}>
          {mode === 'login' ? (
            <span style={{ color: '#9CA3AF' }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#74C69D',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Create one
              </button>
            </span>
          ) : (
            <span style={{ color: '#9CA3AF' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#74C69D',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Log in
              </button>
            </span>
          )}
        </div>

        {/* Team Footer */}
        <div
          style={{
            marginTop: 26,
            paddingTop: 16,
            borderTop: '1px solid #282828',
            textAlign: 'center',
            fontSize: 12,
            color: '#71717A',
            lineHeight: 1.6,
          }}
        >
          <div>
            Brandguard AI &middot; <strong style={{ color: '#A1A1AA' }}>Enterprise Brand Governance</strong>
          </div>
          <div>Automated Compliance, Identity Assurance &amp; Copy Audit</div>
        </div>
      </div>
    </div>
  )
}
