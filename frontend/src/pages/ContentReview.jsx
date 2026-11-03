/**
 * frontend/src/pages/ContentReview.jsx
 * Complete Content Review interface with Manual Guidance ("Guide Me"),
 * Automatic Correction ("Fix It for Me"), and Image Compliance workflows.
 */
import { useState, useRef, useEffect } from 'react'
import { api } from '../services/api'
import StatusBadge from '../components/StatusBadge'

const CONTENT_TYPES = [
  { value: 'general',       label: 'General' },
  { value: 'social_post',   label: 'Social Media Post' },
  { value: 'email',         label: 'Email Campaign' },
  { value: 'press_release', label: 'Press Release' },
  { value: 'blog_post',     label: 'Blog Post' },
  { value: 'advertisement', label: 'Advertisement' },
]

const SAMPLE_PASS = {
  title: 'PureBites - Healthy Snacking Campaign',
  contentType: 'social_post',
  text: 'Enjoy delicious and nutritious snacks from PureBites! Made with quality ingredients to fuel your day. Results may vary based on individual dietary habits and health conditions. Approved by local food safety authority regulations.',
}

const SAMPLE_FAIL = {
  title: 'pure bites - Special Launch Promo',
  contentType: 'social_post',
  text: 'Welcome to pure bites organic chips! Our new crunchy snacks give guaranteed weight loss in just 5 days with zero side effects. It is the cheapest in the world at only $4.99 per 250g pack.',
}

export default function ContentReview() {
  const [activeTab, setActiveTab] = useState('text') // 'text' | 'image'

  // Text Review State
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [contentType, setContentType] = useState('general')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  // Sample Selection State
  const [showSampleDropdown, setShowSampleDropdown] = useState(false)
  const sampleMenuRef = useRef(null)

  // Auto-Correction State ("Fix It for Me")
  const [correctionLoading, setCorrectionLoading] = useState(false)
  const [correctionData, setCorrectionData] = useState(null)
  const [editableProposedText, setEditableProposedText] = useState('')
  const [correctionSuccessMsg, setCorrectionSuccessMsg] = useState(null)

  // Image Review State
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [manualTranscript, setManualTranscript] = useState('')
  const [imageLoading, setImageLoading] = useState(false)
  const [imageError, setImageError] = useState(null)
  const [imageResult, setImageResult] = useState(null)
  const fileInputRef = useRef(null)

  const MAX_CHARS = 10_000

  // Close sample dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (sampleMenuRef.current && !sampleMenuRef.current.contains(e.target)) {
        setShowSampleDropdown(false)
      }
    }
    if (showSampleDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSampleDropdown])

  function handleLoadSample(type) {
    setShowSampleDropdown(false)
    const sample = type === 'pass' ? SAMPLE_PASS : SAMPLE_FAIL
    setText(sample.text)
    setTitle(sample.title)
    setContentType(sample.contentType)
    setError(null)
    setCorrectionData(null)
    setCorrectionSuccessMsg(null)
    setResult(null)

    // Trigger immediate policy evaluation
    setLoading(true)
    api.submitReview({
      content_text: sample.text,
      title: sample.title,
      content_type: sample.contentType,
    })
      .then((data) => {
        setResult(data)
      })
      .catch((err) => {
        setError(err.message ?? 'Review request failed.')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  // ── Text Review Submission ──────────────────────────────────────────────────
  async function handleSubmitReview(e) {
    if (e) e.preventDefault()
    if (text.trim().length < 5) {
      setError('Please enter at least 5 characters to review.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setCorrectionData(null)
    setCorrectionSuccessMsg(null)

    try {
      const data = await api.submitReview({
        content_text: text,
        title: title || undefined,
        content_type: contentType,
      })
      setResult(data)
    } catch (err) {
      setError(err.message ?? 'Review request failed.')
    } finally {
      setLoading(false)
    }
  }

  // ── Automatic Correction ("Fix It for Me") ──────────────────────────────────
  async function handleRequestAutoCorrection() {
    if (!result || !result.findings) return

    setCorrectionLoading(true)
    setError(null)
    try {
      const data = await api.autoCorrect({
        content_text: text,
        findings: result.findings,
      })
      setCorrectionData(data)
      setEditableProposedText(data.proposed_text)
    } catch (err) {
      setError(`Automatic correction failed: ${err.message}`)
    } finally {
      setCorrectionLoading(false)
    }
  }

  async function handleAcceptCorrection() {
    if (!result?.id || !editableProposedText) return

    try {
      await api.acceptCorrection(result.id, { corrected_text: editableProposedText })
      setText(editableProposedText)
      setCorrectionSuccessMsg('Correction accepted and saved! You can now re-run review on the updated content.')
      setCorrectionData(null)
    } catch (err) {
      setError(`Failed to save accepted correction: ${err.message}`)
    }
  }

  function handleRejectCorrection() {
    setCorrectionData(null)
  }

  // ── Image Review & Automated OCR Pipeline ──────────────────────────────────
  async function processImageFile(file, overrideTranscript = null) {
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setImageError(
        'Image file exceeds maximum allowed size of 10MB (' +
          (file.size / (1024 * 1024)).toFixed(1) +
          'MB). Please choose a smaller image.'
      )
      setImageFile(null)
      setImagePreview(null)
      return
    }

    const ext = file.name.slice(((file.name.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase()
    if (!['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      setImageError("Unsupported image format '." + ext + "'. Allowed formats: .png, .jpg, .jpeg, .webp.")
      setImageFile(null)
      setImagePreview(null)
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setImageError(null)
    setImageLoading(true)

    const formData = new FormData()
    formData.append('file', file)
    if (overrideTranscript !== null ? overrideTranscript.trim() : manualTranscript.trim()) {
      formData.append('manual_transcript', (overrideTranscript !== null ? overrideTranscript : manualTranscript).trim())
    }

    try {
      const data = await api.reviewImage(formData)
      setImageResult(data)
      const extracted = data.transcript || data.extracted_text || ''
      if (extracted && overrideTranscript === null) {
        setManualTranscript(extracted)
      }
    } catch (err) {
      setImageError(err.message ?? 'Image OCR & compliance review failed.')
    } finally {
      setImageLoading(false)
    }
  }

  function handleImageSelected(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setManualTranscript('')
    processImageFile(file)
  }

  function handleLoadSampleGraphic() {
    // Generate an in-browser sample promotional graphic banner with text that triggers brand review rules
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 360
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Forest green background gradient
    const grad = ctx.createLinearGradient(0, 0, 800, 360)
    grad.addColorStop(0, '#173F35')
    grad.addColorStop(1, '#0c221c')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 800, 360)

    // Gold accent frame
    ctx.strokeStyle = '#C5A46D'
    ctx.lineWidth = 4
    ctx.strokeRect(12, 12, 776, 336)

    // Headline with unapproved variant "Brand Guard"
    ctx.fillStyle = '#F7F6F0'
    ctx.font = 'bold 30px system-ui, sans-serif'
    ctx.fillText('Brand Guard Promotional Launch', 40, 80)

    // Subheadline with prohibited claim "100% Guaranteed" and "Lowest prices"
    ctx.fillStyle = '#d4bb8e'
    ctx.font = '22px system-ui, sans-serif'
    ctx.fillText('100% Guaranteed Results with Lowest Prices Anywhere!', 40, 140)

    // Description text
    ctx.fillStyle = '#E3EDE6'
    ctx.font = '16px system-ui, sans-serif'
    ctx.fillText('Experience AI-assisted brand governance with automated policy verification.', 40, 200)
    ctx.fillText('Limited-time special discount — satisfaction 100% guaranteed.', 40, 235)

    // Footer note
    ctx.fillStyle = 'rgba(247, 246, 240, 0.6)'
    ctx.font = '13px system-ui, sans-serif'
    ctx.fillText('Brandguard AI Enterprise • Official Compliance Campaign Banner', 40, 305)

    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], 'sample_brand_banner.png', { type: 'image/png' })
      setManualTranscript('')
      processImageFile(file)
    }, 'image/png')
  }

  async function handleSubmitImageReview(e) {
    if (e) e.preventDefault()
    if (!imageFile) return
    processImageFile(imageFile, manualTranscript)
  }

  return (
    <div>
      {/* Hero */}
      <div className="page-hero" style={{ marginBottom: 20 }}>
        <div className="page-hero-title">Content Review &amp; Governance</div>
        <div className="page-hero-sub">
          Review marketing text, policy disclosures, and visual assets against approved brand guidelines.
          Receive automated violation analysis, manual correction guidance, and protected brand asset safety checks.
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab('text')}
        >
          📝 Text &amp; Copy Review
        </button>
        <button
          className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`}
          onClick={() => setActiveTab('image')}
        >
          🖼️ Image &amp; Graphic Review
        </button>
      </div>

      {/* =========================================================================
          TAB 1: TEXT REVIEW
      ========================================================================= */}
      {activeTab === 'text' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
          {/* Left: Input & Editor */}
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="section-header">
                <div>
                  <div className="section-title">Draft Content</div>
                  <div className="section-sub">Paste or type copy to evaluate against approved rules</div>
                </div>
                <div style={{ position: 'relative' }} ref={sampleMenuRef}>
                  <button
                    type="button"
                    id="load-sample-dropdown-btn"
                    className="btn btn-ghost btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={() => setShowSampleDropdown(!showSampleDropdown)}
                  >
                    <span>⚡</span>
                    <span>Load Sample Data</span>
                    <span style={{ fontSize: 10, transform: showSampleDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                  </button>

                  {showSampleDropdown && (
                    <div
                      id="sample-choice-dropdown"
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 8px)',
                        background: '#13352c',
                        border: '1px solid rgba(197, 164, 109, 0.45)',
                        borderRadius: 12,
                        boxShadow: '0 16px 36px rgba(0,0,0,0.55)',
                        width: 340,
                        zIndex: 100,
                        padding: 8,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#C5A46D',
                          padding: '6px 10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px',
                          borderBottom: '1px solid rgba(255,255,255,0.08)',
                          marginBottom: 6,
                        }}
                      >
                        Select Pre-Loaded Test Case
                      </div>

                      {/* Sample 1: Pass Case */}
                      <button
                        type="button"
                        id="sample-pass-option"
                        onClick={() => handleLoadSample('pass')}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(134, 239, 172, 0.25)',
                          borderRadius: 8,
                          padding: '10px 12px',
                          color: '#F7F6F0',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          marginBottom: 6,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(134, 239, 172, 0.12)'
                          e.currentTarget.style.borderColor = 'rgba(134, 239, 172, 0.5)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                          e.currentTarget.style.borderColor = 'rgba(134, 239, 172, 0.25)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: '#86efac' }}>
                            ✅ Sample 1: Clean &amp; Compliant
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              background: 'rgba(134, 239, 172, 0.2)',
                              color: '#86efac',
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontWeight: 700,
                            }}
                          >
                            PASS
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(247, 246, 240, 0.75)', lineHeight: 1.35 }}>
                          PureBites snack copy strictly adhering to brand guidelines with mandatory food disclaimers.
                        </div>
                      </button>

                      {/* Sample 2: Fail Case */}
                      <button
                        type="button"
                        id="sample-fail-option"
                        onClick={() => handleLoadSample('fail')}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(252, 165, 165, 0.25)',
                          borderRadius: 8,
                          padding: '10px 12px',
                          color: '#F7F6F0',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(252, 165, 165, 0.12)'
                          e.currentTarget.style.borderColor = 'rgba(252, 165, 165, 0.5)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                          e.currentTarget.style.borderColor = 'rgba(252, 165, 165, 0.25)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: '#fca5a5' }}>
                            ⚠️ Sample 2: Brand Violations
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              background: 'rgba(252, 165, 165, 0.2)',
                              color: '#fca5a5',
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontWeight: 700,
                            }}
                          >
                            FAIL / FIX
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(247, 246, 240, 0.75)', lineHeight: 1.35 }}>
                          Casing (&ldquo;pure bites&rdquo;), prohibited health claims (&ldquo;weight loss&rdquo;), pricing, &amp; missing disclaimers.
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmitReview}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="review-title">
                      Content Title / Reference <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
                    </label>
                    <input
                      id="review-title"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Q4 Product Announcement"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="content-type-select">
                      Content Type
                    </label>
                    <select
                      id="content-type-select"
                      className="form-select"
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value)}
                    >
                      {CONTENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label className="form-label" htmlFor="content-textarea" style={{ marginBottom: 0 }}>
                      Body Text
                    </label>
                    <span style={{ fontSize: 12, color: text.length > MAX_CHARS ? 'var(--color-error)' : '#9ca3af' }}>
                      {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} chars
                    </span>
                  </div>
                  <textarea
                    id="content-textarea"
                    className="form-textarea"
                    rows={8}
                    placeholder="Enter or paste copy here to check for brand terminology, prohibited claims, and mandatory disclaimers..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                    ⚠️ {error}
                  </div>
                )}

                {correctionSuccessMsg && (
                  <div className="alert alert-success" style={{ marginBottom: 16 }}>
                    ✅ {correctionSuccessMsg}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    id="submit-review-btn"
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={loading || text.trim().length < 5}
                  >
                    {loading ? (
                      <>
                        <span className="spinner" /> Analyzing Copy…
                      </>
                    ) : (
                      '🔍 Review Content'
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setText('')
                      setTitle('')
                      setResult(null)
                      setError(null)
                      setCorrectionData(null)
                    }}
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>

            {/* "Fix It for Me" — Automatic Correction Comparison Pane */}
            {correctionData && (
              <div className="card" style={{ marginBottom: 20, border: '2px solid var(--color-gold)' }}>
                <div className="section-header">
                  <div>
                    <div className="section-title" style={{ color: 'var(--color-forest)' }}>
                      🪄 Proposed Automatic Corrections ("Fix It for Me")
                    </div>
                    <div className="section-sub">
                      Review proposed edits before accepting. Protected facts, prices, and specs have been guarded.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleAcceptCorrection}
                    >
                      ✓ Accept &amp; Apply
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={handleRejectCorrection}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>

                {/* Guarded Facts Notice */}
                {correctionData.protected_elements_guarded?.length > 0 && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
                    🛡️ <strong>Guarded Protected Elements &amp; Facts:</strong>{' '}
                    {correctionData.protected_elements_guarded.map((fact, idx) => (
                      <span key={idx} style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: 4, margin: '0 4px', fontFamily: 'monospace' }}>
                        {fact}
                      </span>
                    ))}
                  </div>
                )}

                {/* Side-by-Side Comparison */}
                <div className="diff-container">
                  <div className="diff-pane">
                    <div className="diff-pane-title">
                      <span>Original Copy</span>
                      <span className="badge badge-sage">Read-only</span>
                    </div>
                    <div className="diff-text-original">{correctionData.original_text}</div>
                  </div>

                  <div className="diff-pane" style={{ border: '2px solid var(--color-gold)' }}>
                    <div className="diff-pane-title">
                      <span>Proposed Revision</span>
                      <span className="badge badge-gold">Editable</span>
                    </div>
                    <textarea
                      className="form-textarea"
                      style={{ minHeight: 120, fontSize: 14 }}
                      value={editableProposedText}
                      onChange={(e) => setEditableProposedText(e.target.value)}
                    />
                  </div>
                </div>

                {/* Proposed Changes Log */}
                {correctionData.changes?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--color-forest)' }}>
                      Proposed Change Audit Log ({correctionData.changes.length})
                    </div>
                    {correctionData.changes.map((chg) => (
                      <div key={chg.change_id} className="diff-change-item">
                        <div style={{ fontWeight: 600, color: '#166534', marginBottom: 2 }}>
                          {chg.reason}
                        </div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 12, fontFamily: 'monospace' }}>
                          {chg.original_text && (
                            <span style={{ color: '#991b1b', textDecoration: 'line-through' }}>
                              - {chg.original_text}
                            </span>
                          )}
                          <span style={{ color: '#15803d' }}>
                            + {chg.proposed_text}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Manual Guidance Items */}
                {correctionData.manual_guidance?.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#b45309' }}>
                      ⚠️ Items Requiring Manual Editorial Judgment:
                    </div>
                    {correctionData.manual_guidance.map((guide, idx) => (
                      <div key={idx} style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '8px 12px', borderRadius: 6, fontSize: 13, marginBottom: 6, color: '#92400e' }}>
                        {guide}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Results & Findings Panel */}
          <div>
            {result ? (
              <div className={`card review-result-box result-${result.review_status.replace('_', '-')}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Review Outcome</div>
                  <StatusBadge status={result.review_status} />
                </div>

                <div style={{ fontSize: 13, marginBottom: 16, color: '#4b5563', lineHeight: 1.5 }}>
                  {result.message}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, textAlign: 'center', border: '1px solid var(--color-sage-dk)' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-forest)' }}>
                      {result.rules_checked}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7671', textTransform: 'uppercase' }}>Rules Checked</div>
                  </div>
                  <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, textAlign: 'center', border: '1px solid var(--color-sage-dk)' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: result.violations_found > 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
                      {result.violations_found}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7671', textTransform: 'uppercase' }}>Violations</div>
                  </div>
                </div>

                {/* Actions: Fix It for Me */}
                {result.violations_found > 0 && (
                  <button
                    id="fix-it-btn"
                    className="btn btn-gold btn-block"
                    style={{ marginBottom: 16 }}
                    onClick={handleRequestAutoCorrection}
                    disabled={correctionLoading}
                  >
                    {correctionLoading ? <span className="spinner" /> : '🪄 Fix It for Me (Auto-Correct)'}
                  </button>
                )}

                {/* Findings List */}
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: 'var(--color-forest)' }}>
                  Detailed Findings ({result.findings.length})
                </div>

                {result.findings.length === 0 ? (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: 14, borderRadius: 8, fontSize: 13, color: '#166534', textAlign: 'center' }}>
                    ✅ Perfect! No violations or brand inconsistencies detected against your approved rules.
                  </div>
                ) : (
                  result.findings.map((f, i) => (
                    <div key={f.finding_id || i} className="finding-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span className="finding-category">{f.rule_category.replace(/_/g, ' ')}</span>
                        <span className={`badge ${f.severity === 'critical' ? 'badge-error' : 'badge-warning'}`}>
                          {f.severity || 'warning'}
                        </span>
                      </div>

                      <div className="finding-reason">{f.reason}</div>

                      {f.matched_text && (
                        <div className="finding-matched">"{f.matched_text}"</div>
                      )}

                      {/* Manual Guidance / Guide Me */}
                      {f.suggestion && (
                        <div className="finding-suggestion" style={{ marginTop: 8 }}>
                          💡 <strong>Guide Me:</strong> {f.suggestion}
                        </div>
                      )}

                      {/* Applicable Rule Reference & Evidence */}
                      {f.evidence && (
                        <div style={{ fontSize: 11, color: '#6b7671', marginTop: 8, borderTop: '1px solid #fed7aa', paddingTop: 6 }}>
                          📄 <strong>Rule Evidence:</strong> {f.evidence}
                        </div>
                      )}

                      {f.certainty === 'needs_review' && (
                        <div style={{ fontSize: 11, color: '#b45309', marginTop: 4 }}>
                          ⚠️ Flagged for contextual human editorial review
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '36px 20px', color: '#6b7671' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                <div style={{ fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: 6 }}>
                  No Review Results Yet
                </div>
                <div style={{ fontSize: 13 }}>
                  Type or paste your draft copy in the editor and click "Review Content" to evaluate it against your brand guidelines.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: IMAGE REVIEW
      ========================================================================= */}
      {activeTab === 'image' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Left: Upload & Preview */}
          <div className="card">
            <div className="section-header">
              <div>
                <div className="section-title">Image &amp; Graphic Review</div>
                <div className="section-sub">Validate visual assets, banner text, and ad graphics</div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleLoadSampleGraphic}
                disabled={imageLoading}
              >
                ⚡ Load Sample Graphic
              </button>
            </div>

            <form onSubmit={handleSubmitImageReview}>
              <div
                className="upload-dropzone"
                onClick={() => fileInputRef.current?.click()}
                style={{ marginBottom: 16 }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".png,.jpg,.jpeg,.webp"
                  onChange={handleImageSelected}
                />
                <div style={{ fontSize: 36, marginBottom: 8 }}>🖼️</div>
                <div style={{ fontWeight: 600, color: 'var(--color-forest)', marginBottom: 4 }}>
                  {imageFile ? imageFile.name : 'Click to select or drop image'}
                </div>
                <div style={{ fontSize: 12, color: '#6b7671' }}>
                  Supports PNG, JPG, and WEBP (max 10MB) — Auto-scanned via OCR
                </div>
              </div>

              {imagePreview && (
                <div style={{ marginBottom: 16, textAlign: 'center' }}>
                  <img
                    src={imagePreview}
                    alt="Review target preview"
                    style={{ maxHeight: 220, borderRadius: 8, margin: '0 auto', border: '1px solid var(--color-sage-dk)' }}
                  />
                </div>
              )}

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" htmlFor="manual-transcript" style={{ marginBottom: 0 }}>
                    Image Transcript / Copy Text
                  </label>
                  {manualTranscript ? (
                    <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>
                      ✓ Auto-extracted via OCR (editable)
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>
                      Auto-populated on upload
                    </span>
                  )}
                </div>
                <textarea
                  id="manual-transcript"
                  className="form-textarea"
                  rows={4}
                  placeholder={imageLoading ? "Scanning image copy via OCR pipeline..." : "Image text will automatically extract here upon upload. You can also edit it..."}
                  value={manualTranscript}
                  onChange={(e) => setManualTranscript(e.target.value)}
                />
                <div style={{ fontSize: 11, color: '#6b7671', marginTop: 4 }}>
                  Extracted automatically upon upload. Adjust the text above anytime to test specific rules.
                </div>
              </div>

              {imageError && (
                <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                  ⚠️ {imageError}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg btn-block"
                disabled={imageLoading || !imageFile}
              >
                {imageLoading ? (
                  <>
                    <span className="spinner" /> Analyzing Image Copy…
                  </>
                ) : (
                  '🔍 Analyze Image Compliance'
                )}
              </button>
            </form>
          </div>

          {/* Right: OCR & Compliance Output */}
          <div className="card">
            <div className="section-header">
              <div className="section-title">Image Analysis &amp; Findings</div>
            </div>

            {imageLoading && !imageResult && (
              <div className="loading-container" style={{ padding: '40px 16px' }}>
                <span className="spinner" /> Scanning graphic and analyzing brand compliance…
              </div>
            )}

            {imageResult ? (
              <div>
                {/* Metadata */}
                <div style={{ background: 'var(--color-sage)', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                  <div><strong>File:</strong> {imageResult.filename}</div>
                  <div><strong>Dimensions:</strong> {imageResult.metadata?.width} × {imageResult.metadata?.height} px ({imageResult.metadata?.format})</div>
                  <div style={{ marginTop: 4 }}>
                    <strong>OCR Engine:</strong>{' '}
                    <span className="badge badge-success" style={{ marginLeft: 4 }}>
                      {imageResult.ocr_engine || 'Automated OCR Active'}
                    </span>
                  </div>
                  {imageResult.ocr_status_message && (
                    <div style={{ fontSize: 12, color: '#4b5563', marginTop: 4 }}>
                      {imageResult.ocr_status_message}
                    </div>
                  )}
                </div>

                {/* Disclaimer */}
                <div className="placeholder-notice" style={{ marginBottom: 16 }}>
                  ℹ️ {imageResult.notice}
                </div>

                {/* Findings */}
                {imageResult.review ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontWeight: 700 }}>Compliance Status:</span>
                      <StatusBadge status={imageResult.review.review_status} />
                    </div>

                    <div style={{ fontSize: 13, marginBottom: 12, color: '#4b5563' }}>
                      {imageResult.review.message}
                    </div>

                    {imageResult.review.findings.map((f, i) => (
                      <div key={i} className="finding-item">
                        <div className="finding-category">{f.rule_category.replace(/_/g, ' ')}</div>
                        <div className="finding-reason">{f.reason}</div>
                        {f.suggestion && (
                          <div className="finding-suggestion">
                            💡 <strong>Suggested Replacement:</strong> {f.suggestion}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 16px', color: '#6b7671' }}>
                    Enter graphic copy in the transcript box on the left to review against brand rules.
                  </div>
                )}
              </div>
            ) : (
              !imageLoading && (
                <div style={{ textAlign: 'center', padding: '48px 16px', color: '#6b7671' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🖼️</div>
                  <div style={{ fontWeight: 600 }}>No Image Analyzed</div>
                  <div style={{ fontSize: 13 }}>
                    Upload an image banner or click &ldquo;⚡ Load Sample Graphic&rdquo; to inspect brand compliance.
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
