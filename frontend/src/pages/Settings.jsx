/**
 * frontend/src/pages/Settings.jsx
 * Workspace Configuration, Protected Brand Elements Manager, and System Diagnostics.
 */
import { useState } from 'react'
import { useFetch } from '../hooks/useFetch'
import { api } from '../services/api'

const ELEMENT_TYPES = [
  { value: 'brand_name',       label: 'Brand Name' },
  { value: 'product_name',     label: 'Product / Model' },
  { value: 'slogan',           label: 'Official Slogan / Tagline' },
  { value: 'legal_disclaimer', label: 'Mandatory Legal Disclaimer' },
  { value: 'product_spec',     label: 'Product Specification' },
]

export default function Settings() {
  const { data: sysData, loading: sysLoading, refetch: refetchSys } = useFetch(
    () => api.getSystemDiagnostics(),
    []
  )
  const { data: peData, loading: peLoading, refetch: refetchPE } = useFetch(
    () => api.getProtectedElements(),
    []
  )
  const protectedElements = peData?.elements ?? []

  // Add protected element state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newType, setNewType] = useState('brand_name')
  const [newCanonical, setNewCanonical] = useState('')
  const [newForbidden, setNewForbidden] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [peSubmitting, setPeSubmitting] = useState(false)
  const [peError, setPeError] = useState(null)

  async function handleCreateProtectedElement(e) {
    e.preventDefault()
    if (!newCanonical.trim()) return

    setPeSubmitting(true)
    setPeError(null)

    try {
      await api.createProtectedElement({
        element_type: newType,
        canonical_text: newCanonical.trim(),
        forbidden_variations: newForbidden.trim() || undefined,
        description: newDesc.trim() || undefined,
        is_active: true,
      })
      setNewCanonical('')
      setNewForbidden('')
      setNewDesc('')
      setShowAddForm(false)
      refetchPE()
    } catch (err) {
      setPeError(err.message ?? 'Failed to save protected asset.')
    } finally {
      setPeSubmitting(false)
    }
  }

  async function handleDeleteProtectedElement(id, name) {
    if (!window.confirm(`Delete protected element "${name}"?`)) return
    try {
      await api.deleteProtectedElement(id)
      refetchPE()
    } catch (err) {
      alert(`Delete failed: ${err.message}`)
    }
  }

  return (
    <div>
      {/* Hero */}
      <div className="page-hero" style={{ marginBottom: 20 }}>
        <div className="page-hero-title">Workspace Settings &amp; Protected Elements</div>
        <div className="page-hero-sub">
          Configure protected brand assets, guard core identities against unauthorized modification,
          and monitor system connectivity and diagnostics.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left: Protected Brand Elements Catalog */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Protected Brand Identity Elements</div>
              <div className="section-sub">
                Guarded assets that cannot be altered or overwritten during automatic correction
              </div>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'Cancel' : '+ Add Asset'}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleCreateProtectedElement} style={{ background: '#f8fafc', padding: 16, borderRadius: 8, marginBottom: 16, border: '1px solid #e2e8f0' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="pe-type">
                  Asset Type
                </label>
                <select
                  id="pe-type"
                  className="form-select"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                >
                  {ELEMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="pe-canonical">
                  Canonical Approved Spelling / Text
                </label>
                <input
                  id="pe-canonical"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Brandguard AI"
                  value={newCanonical}
                  onChange={(e) => setNewCanonical(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="pe-forbidden">
                  Forbidden Variations <span style={{ color: '#9ca3af', fontWeight: 400 }}>(comma-separated)</span>
                </label>
                <input
                  id="pe-forbidden"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Brand Guard, brandguard, brandguard.ai"
                  value={newForbidden}
                  onChange={(e) => setNewForbidden(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="pe-desc">
                  Description / Context
                </label>
                <input
                  id="pe-desc"
                  type="text"
                  className="form-input"
                  placeholder="Official company name. Never decapitalize."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              {peError && (
                <div className="alert alert-warning" style={{ marginBottom: 12 }}>
                  ⚠️ {peError}
                </div>
              )}

              <div style={{ textAlign: 'right' }}>
                <button type="submit" className="btn btn-primary" disabled={peSubmitting}>
                  {peSubmitting ? <span className="spinner" /> : 'Save Protected Asset'}
                </button>
              </div>
            </form>
          )}

          {peLoading && (
            <div className="loading-container">
              <span className="spinner" /> Loading protected elements…
            </div>
          )}

          {!peLoading && protectedElements.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 16px', color: '#6b7671' }}>
              No protected brand elements registered. Click "+ Add Asset" above.
            </div>
          )}

          {!peLoading && protectedElements.map((pe) => (
            <div
              key={pe.id}
              style={{
                background: '#fff',
                border: '1px solid var(--color-sage-dk)',
                borderRadius: 8,
                padding: '12px 16px',
                marginBottom: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <span className="badge badge-gold">🛡️ {pe.element_type.replace(/_/g, ' ')}</span>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{pe.canonical_text}</span>
                </div>
                {pe.forbidden_variations && (
                  <div style={{ fontSize: 12, color: '#991b1b' }}>
                    <strong>Forbidden:</strong> {pe.forbidden_variations}
                  </div>
                )}
                {pe.description && (
                  <div style={{ fontSize: 12, color: '#6b7671' }}>{pe.description}</div>
                )}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--color-error)' }}
                onClick={() => handleDeleteProtectedElement(pe.id, pe.canonical_text)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Right: System Diagnostics & Configuration */}
        <div>
          {/* Connection Diagnostics */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="section-header">
              <div>
                <div className="section-title">System Diagnostics</div>
                <div className="section-sub">Host server and database connectivity status</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={refetchSys}>
                🔄 Refresh
              </button>
            </div>

            {sysLoading ? (
              <div className="loading-container">
                <span className="spinner" /> Querying system…
              </div>
            ) : sysData ? (
              <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                <div style={{ marginBottom: 12, padding: '10px 14px', background: 'var(--color-sage)', borderRadius: 8 }}>
                  <div>
                    <strong>MySQL Database Status:</strong>{' '}
                    <span className={`badge ${sysData.database?.status === 'connected' ? 'badge-success' : 'badge-warning'}`}>
                      {sysData.database?.status || 'Unknown'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#4b5563', marginTop: 4 }}>
                    {sysData.database?.message}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7671', marginTop: 2 }}>
                    Target: {sysData.database?.host}:{sysData.database?.port}/{sysData.database?.name}
                  </div>
                </div>

                <div style={{ marginBottom: 12, padding: '10px 14px', background: 'var(--color-sage)', borderRadius: 8 }}>
                  <div>
                    <strong>OCR Text Extraction Engine:</strong>{' '}
                    <span className={`badge ${sysData.ocr_engine?.available ? 'badge-success' : 'badge-sage'}`}>
                      {sysData.ocr_engine?.engine}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#4b5563', marginTop: 4 }}>
                    {sysData.ocr_engine?.message}
                  </div>
                </div>

                <div style={{ padding: '10px 14px', background: 'var(--color-sage)', borderRadius: 8 }}>
                  <div>
                    <strong>AI Provider Keys:</strong>{' '}
                    {sysData.ai_integration?.openai_configured || sysData.ai_integration?.google_ai_configured ? (
                      <span className="badge badge-success">Configured</span>
                    ) : (
                      <span className="badge badge-sage">Deterministic Rules Active (No external API required)</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>Could not load diagnostics.</div>
            )}
          </div>

          {/* Honest Roadmap Notice */}
          <div className="card">
            <div className="section-title" style={{ marginBottom: 8 }}>
              Authentication &amp; Multi-Tenant Status
            </div>
            <div style={{ fontSize: 13, color: '#6b7671', lineHeight: 1.6 }}>
              Brandguard AI currently runs as an open local workspace prototype.
              Role-based permissions (RBAC) and user authentication (OAuth/JWT) are reserved for enterprise multi-tenant deployments.
              Local configuration is managed securely via <code style={{ background: '#f1f5f9', padding: '2px 4px', borderRadius: 4 }}>backend/.env</code>.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
