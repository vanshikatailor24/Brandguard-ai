/**
 * frontend/src/pages/ContentReview.jsx
 * Complete Content Review interface with Manual Guidance ("Guide Me"),
 * Automatic Correction ("Fix It for Me"), and Image Compliance workflows.
 */
import { useState, useRef } from 'react'
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

export default function ContentReview() {
  const [activeTab, setActiveTab] = useState('text') // 'text' | 'image'

  // Text Review State
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [contentType, setContentType] = useState('general')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

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

  // ── Text Review Submission ──────────────────────────────────────────────────
  async function handleSubmitReview(e) {
    if (e) e.preventDefault()
    if (text.trim().length < 5) return

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

  // ── Image Review Submission ─────────────────────────────────────────────────
  function handleImageSelected(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setImageResult(null)
    setImageError(null)
  }

  async function handleSubmitImageReview(e) {
    e.preventDefault()
    if (!imageFile) return

    setImageLoading(true)
    setImageError(null)
    setImageResult(null)

    const formData = new FormData()
    formData.append('file', imageFile)
    if (manualTranscript.trim()) {
      formData.append('manual_transcript', manualTranscript.trim())
    }

    try {
      const data = await api.reviewImage(formData)
      setImageResult(data)
    } catch (err) {
      setImageError(err.message ?? 'Image review failed.')
    } finally {
      setImageLoading(false)
    }
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
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setText("Check out Brand Guard for 100% guaranteed results! Lowest prices anywhere.")
                    setTitle("Sample Marketing Campaign")
                  }}
                >
                  ⚡ Load Sample
                </button>
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
                  Supports PNG, JPG, and WEBP (max 10MB)
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
                <label className="form-label" htmlFor="manual-transcript">
                  Image Transcript / Copy Text <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional if OCR active)</span>
                </label>
                <textarea
                  id="manual-transcript"
                  className="form-textarea"
                  rows={4}
                  placeholder="Enter the copy displayed on your graphic to review it against brand guidelines..."
                  value={manualTranscript}
                  onChange={(e) => setManualTranscript(e.target.value)}
                />
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
                {imageLoading ? <span className="spinner" /> : '🔍 Analyze Image Compliance'}
              </button>
            </form>
          </div>

          {/* Right: OCR & Compliance Output */}
          <div className="card">
            <div className="section-header">
              <div className="section-title">Image Analysis &amp; Findings</div>
            </div>

            {imageResult ? (
              <div>
                {/* Metadata */}
                <div style={{ background: 'var(--color-sage)', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                  <div><strong>File:</strong> {imageResult.filename}</div>
                  <div><strong>Dimensions:</strong> {imageResult.metadata?.width} × {imageResult.metadata?.height} px ({imageResult.metadata?.format})</div>
                  <div><strong>OCR Engine:</strong> {imageResult.ocr_engine_available ? 'Active (Tesseract)' : 'Manual transcript mode'}</div>
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
              <div style={{ textAlign: 'center', padding: '48px 16px', color: '#6b7671' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🖼️</div>
                <div style={{ fontWeight: 600 }}>No Image Analyzed</div>
                <div style={{ fontSize: 13 }}>Upload an image banner or social post to inspect brand compliance.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
