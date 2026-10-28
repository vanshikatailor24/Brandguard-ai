/**
 * frontend/src/pages/Onboarding.jsx
 * Step 1: Company Setup & Workspace Onboarding Screen for Brandguard AI.
 * Required prior to accessing the Main Dashboard (/overview) for new users.
 * Features industry categorization, custom industry override, tagline, and skip for demo judges.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { auth } from '../services/auth'

const INDUSTRY_OPTIONS = [
  'Food & Beverage',
  'Clothing & Fashion',
  'Cosmetics & Beauty',
  'Healthcare & Medicine',
  'Electronics & Tech',
  'Financial Services',
  'Retail & E-Commerce',
  'Software/SaaS',
  'Other',
]

export default function Onboarding() {
  const navigate = useNavigate()
  const currentUser = auth.getUser() || {}

  const [companyName, setCompanyName] = useState('')
  const [industryType, setIndustryType] = useState('Software/SaaS')
  const [customIndustry, setCustomIndustry] = useState('')
  const [tagline, setTagline] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Pre-fill existing company profile if available
  useEffect(() => {
    if (currentUser.company) {
      setCompanyName(currentUser.company.name || '')
      const ind = currentUser.company.industry_type || currentUser.company.industry || 'Software/SaaS'
      if (INDUSTRY_OPTIONS.includes(ind)) {
        setIndustryType(ind)
      } else {
        setIndustryType('Other')
        setCustomIndustry(ind)
      }
      setTagline(currentUser.company.tagline || '')
    } else if (currentUser.email === 'judge@brandguard.ai') {
      setCompanyName('Brandguard AI Enterprise')

      setIndustryType('Software/SaaS')
      setTagline('AI-assisted brand governance for modern companies')
    }

  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!companyName.trim()) {
      setError('Please provide your company or brand name.')
      return
    }
    if (industryType === 'Other' && !customIndustry.trim()) {
      setError('Please specify your custom industry.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const selectedIndustry = industryType === 'Other' ? customIndustry.trim() : industryType
      const res = await api.onboardCompany({
        company_name: companyName.trim(),
        industry_type: selectedIndustry,
        custom_industry: industryType === 'Other' ? customIndustry.trim() : null,
        tagline: tagline.trim() || null,
        user_email: currentUser.email || null,
      })

      if (res && res.company) {
        auth.updateCompany(res.company)
      } else {
        auth.updateCompany({
          id: 101,
          name: companyName.trim(),
          industry: selectedIndustry,
          industry_type: selectedIndustry,
          tagline: tagline.trim() || null,
        })
      }

      navigate('/overview', { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to save company profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleSkip() {
    // If user has not yet set company, ensure default demo company is assigned
    if (!currentUser.company) {
      auth.updateCompany({
        id: 1,
        name: 'Brandguard AI Enterprise',
        industry: 'Software/SaaS',
        industry_type: 'Software/SaaS',
        tagline: 'AI-assisted brand governance for modern companies',
      })
    }
    navigate('/overview', { replace: true })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 50% 20%, #173F35 0%, #0d1f1a 50%, #08110e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        color: '#F7F6F0',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'rgba(23, 63, 53, 0.45)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(220, 232, 223, 0.15)',
          borderRadius: '20px',
          padding: '40px 36px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(45, 106, 79, 0.25)',
        }}
      >
        {/* Brand & Step Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '26px' }}>🛡️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '18px', color: '#F7F6F0', letterSpacing: '-0.3px' }}>
                Brandguard <span style={{ color: '#C5A46D' }}>AI</span>
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(247,246,240,0.5)', letterSpacing: '0.5px' }}>
                ENTERPRISE GOVERNANCE
              </div>

            </div>
          </div>
          <span
            style={{
              background: 'rgba(197, 164, 109, 0.18)',
              color: '#d4bb8e',
              border: '1px solid rgba(197, 164, 109, 0.4)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
            }}
          >
            Step 1 of 2: Company Setup
          </span>
        </div>

        {/* Header Title */}
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: '#F7F6F0' }}>
          Set Up Your Company Profile
        </h2>
        <p style={{ fontSize: '14px', color: 'rgba(247, 246, 240, 0.65)', marginBottom: '28px', lineHeight: 1.5 }}>
          Configure your brand governance identity. This tailors the AI review engine, tone-of-voice checks, and policy enforcement to your organization.
        </p>

        {/* Error notification */}
        {error && (
          <div
            style={{
              background: 'rgba(248, 113, 113, 0.15)',
              border: '1px solid rgba(248, 113, 113, 0.4)',
              color: '#fca5a5',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Company Name */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'rgba(247, 246, 240, 0.85)',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                marginBottom: '8px',
              }}
            >
              Company / Brand Name <span style={{ color: '#f87171' }}>*</span>
            </label>
            <input
              id="company-name-input"
              type="text"
              placeholder="e.g. Acme Corporation or Apex Technologies"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(220, 232, 223, 0.2)',
                color: '#F7F6F0',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#2D6A4F')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(220, 232, 223, 0.2)')}
            />
          </div>

          {/* Industry Type Dropdown */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'rgba(247, 246, 240, 0.85)',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                marginBottom: '8px',
              }}
            >
              Industry / Company Type <span style={{ color: '#f87171' }}>*</span>
            </label>
            <select
              id="industry-type-select"
              value={industryType}
              onChange={(e) => setIndustryType(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                background: '#13352c',
                border: '1px solid rgba(220, 232, 223, 0.2)',
                color: '#F7F6F0',
                fontSize: '14px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {INDUSTRY_OPTIONS.map((opt) => (
                <option key={opt} value={opt} style={{ background: '#0f2b23', color: '#F7F6F0' }}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Industry (if 'Other' is chosen) */}
          {industryType === 'Other' && (
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'rgba(247, 246, 240, 0.85)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  marginBottom: '8px',
                }}
              >
                Custom Industry Specification <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input
                id="custom-industry-input"
                type="text"
                placeholder="Enter your specialized industry..."
                value={customIndustry}
                onChange={(e) => setCustomIndustry(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(220, 232, 223, 0.2)',
                  color: '#F7F6F0',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* Brand Tagline / Mission */}
          <div style={{ marginBottom: '28px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'rgba(247, 246, 240, 0.85)',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                marginBottom: '8px',
              }}
            >
              Brand Tagline / Mission <span style={{ color: 'rgba(247, 246, 240, 0.4)', fontWeight: 400 }}>(Optional)</span>
            </label>
            <input
              id="brand-tagline-input"
              type="text"
              placeholder="e.g. Empowering honest and reliable enterprise communication."
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(220, 232, 223, 0.2)',
                color: '#F7F6F0',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              id="submit-onboarding-btn"
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)',
                border: '1px solid rgba(82, 183, 136, 0.3)',
                color: '#F7F6F0',
                fontSize: '15px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(45, 106, 79, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {loading ? 'Saving Profile...' : 'Complete Setup & Enter Dashboard 🚀'}
            </button>

            <button
              id="skip-onboarding-btn"
              type="button"
              onClick={handleSkip}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: 'transparent',
                border: '1px solid rgba(220, 232, 223, 0.15)',
                color: 'rgba(247, 246, 240, 0.6)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'color 0.2s, background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#F7F6F0'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(247, 246, 240, 0.6)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              Skip for now & Continue to Dashboard →
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
