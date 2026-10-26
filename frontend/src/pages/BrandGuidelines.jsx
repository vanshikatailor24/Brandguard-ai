/**
 * frontend/src/pages/BrandGuidelines.jsx
 * Full brand guidelines management: view, create, edit, approve, and protect rules.
 */
import { useState } from 'react'
import { useFetch } from '../hooks/useFetch'
import { api } from '../services/api'
import StatusBadge from '../components/StatusBadge'

const CATEGORIES = [
  { value: 'prohibited_phrase',   label: 'Prohibited Phrase',   icon: '🚫' },
  { value: 'required_phrase',     label: 'Required Phrase',     icon: '✅' },
  { value: 'required_disclaimer', label: 'Required Disclaimer', icon: '⚖️' },
  { value: 'brand_terminology',   label: 'Brand Terminology',   icon: '🏷️' },
]

export default function BrandGuidelines() {
  const { data, loading, error, refetch } = useFetch(
    () => api.getRules({ approved_only: false }),
    []
  )
  const rules = data?.rules ?? []

  // Filtering
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterApproval, setFilterApproval] = useState('all') // 'all' | 'approved' | 'draft'

  // Modal / Form state
  const [showModal, setShowModal] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [formData, setFormData] = useState({
    category: 'prohibited_phrase',
    rule_text: '',
    description: '',
    severity: 'warning',
    is_approved: true,
    is_protected: false,
  })
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  function openCreateModal() {
    setEditingRule(null)
    setFormData({
      category: 'prohibited_phrase',
      rule_text: '',
      description: '',
      severity: 'warning',
      is_approved: true,
      is_protected: false,
    })
    setFormError(null)
    setShowModal(true)
  }

  function openEditModal(rule) {
    setEditingRule(rule)
    setFormData({
      category: rule.category,
      rule_text: rule.rule_text,
      description: rule.description || '',
      severity: rule.severity || 'warning',
      is_approved: rule.is_approved,
      is_protected: rule.is_protected || false,
    })
    setFormError(null)
    setShowModal(true)
  }

  async function handleFormSubmit(e) {
    e.preventDefault()
    if (!formData.rule_text.trim()) return

    setFormSubmitting(true)
    setFormError(null)

    try {
      if (editingRule) {
        await api.updateRule(editingRule.id, formData)
      } else {
        await api.createRule(formData)
      }
      setShowModal(false)
      refetch()
    } catch (err) {
      setFormError(err.message ?? 'Operation failed.')
    } finally {
      setFormSubmitting(false)
    }
  }

  async function handleToggleApprove(rule) {
    try {
      await api.toggleApproveRule(rule.id, !rule.is_approved)
      refetch()
    } catch (err) {
      alert(`Approval toggle failed: ${err.message}`)
    }
  }

  async function handleDeleteRule(rule) {
    if (rule.is_protected) {
      alert(`Rule #${rule.id} is protected brand identity and cannot be deleted.`)
      return
    }
    if (!window.confirm(`Are you sure you want to delete this rule: "${rule.rule_text}"?`)) {
      return
    }

    try {
      await api.deleteRule(rule.id)
      refetch()
    } catch (err) {
      alert(`Delete failed: ${err.message}`)
    }
  }

  // Filtered list
  const filteredRules = rules.filter((r) => {
    if (filterCategory !== 'all' && r.category !== filterCategory) return false
    if (filterApproval === 'approved' && !r.is_approved) return false
    if (filterApproval === 'draft' && r.is_approved) return false
    return true
  })

  const approvedCount = rules.filter((r) => r.is_approved).length
  const draftCount = rules.length - approvedCount

  return (
    <div>
      {/* Hero */}
      <div className="page-hero" style={{ marginBottom: 20 }}>
        <div className="page-hero-title">Brand Guidelines Catalog</div>
        <div className="page-hero-sub">
          Define and manage authoritative brand rules. Only approved rules are used
          during content review. Candidate rules extracted from policy documents remain in draft
          until approved by a brand manager.
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Total Rules</div>
          <div className="stat-value">{loading ? '…' : rules.length}</div>
          <div className="stat-sub">Defined guidelines</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Authoritative &amp; Approved</div>
          <div className="stat-value" style={{ color: 'var(--color-forest)' }}>
            {loading ? '…' : approvedCount}
          </div>
          <div className="stat-sub">Active in review engine</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Draft / Pending Review</div>
          <div className="stat-value" style={{ color: '#b45309' }}>
            {loading ? '…' : draftCount}
          </div>
          <div className="stat-sub">Requires human approval</div>
        </div>
      </div>

      {/* Action Bar & Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Category filter */}
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* Approval filter */}
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={filterApproval}
              onChange={(e) => setFilterApproval(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved Only</option>
              <option value="draft">Drafts Requiring Review</option>
            </select>
          </div>

          <button
            id="add-rule-btn"
            className="btn btn-primary"
            onClick={openCreateModal}
          >
            + Create Brand Rule
          </button>
        </div>
      </div>

      {/* Feedback & Loading */}
      {loading && (
        <div className="loading-container">
          <span className="spinner" /> Loading brand guidelines…
        </div>
      )}

      {error && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          ⚠️ Could not load guidelines from backend: {error}
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 12 }} onClick={refetch}>
            Retry
          </button>
        </div>
      )}

      {/* Rules Grid */}
      {!loading && !error && filteredRules.length === 0 && (
        <div className="card empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No Rules Found</div>
          <div className="empty-state-text">
            No brand rules match your active filters, or no guidelines have been created yet.
          </div>
          <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={openCreateModal}>
            Create First Rule
          </button>
        </div>
      )}

      {!loading && filteredRules.map((rule) => {
        const catInfo = CATEGORIES.find((c) => c.value === rule.category) ?? { icon: '📌', label: rule.category }
        return (
          <div
            key={rule.id}
            className="card"
            style={{
              marginBottom: 12,
              padding: '16px 20px',
              borderLeft: rule.is_protected
                ? '4px solid var(--color-gold)'
                : rule.is_approved
                ? '4px solid #166534'
                : '4px solid #f59e0b',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span>{catInfo.icon}</span>
                  <span className="badge badge-sage">{catInfo.label}</span>
                  <StatusBadge status={rule.is_approved ? 'approved' : 'draft'} />
                  {rule.is_protected && (
                    <span className="badge badge-gold" title="Protected brand asset cannot be modified or deleted without authorization">
                      🛡️ Protected Asset
                    </span>
                  )}
                  <span className={`badge ${rule.severity === 'critical' ? 'badge-error' : 'badge-warning'}`}>
                    {rule.severity || 'warning'}
                  </span>
                </div>

                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: 4 }}>
                  {rule.rule_text}
                </div>

                {rule.description && (
                  <div style={{ fontSize: 13, color: '#4b5563', marginBottom: 6 }}>
                    {rule.description}
                  </div>
                )}

                {rule.source_excerpt && (
                  <div style={{ fontSize: 12, color: '#6b7671', background: '#f8fafc', padding: '4px 8px', borderRadius: 4, display: 'inline-block' }}>
                    📄 <strong>Source Excerpt:</strong> {rule.source_excerpt}
                  </div>
                )}
              </div>

              {/* Action Controls */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  className={`btn btn-sm ${rule.is_approved ? 'btn-ghost' : 'btn-primary'}`}
                  onClick={() => handleToggleApprove(rule)}
                  title={rule.is_approved ? 'Revoke authoritative approval' : 'Approve for live review engine'}
                >
                  {rule.is_approved ? 'Revoke Approval' : '✓ Approve Rule'}
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => openEditModal(rule)}
                >
                  Edit
                </button>
                {!rule.is_protected && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--color-error)' }}
                    onClick={() => handleDeleteRule(rule)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="section-header">
              <div className="section-title">
                {editingRule ? `Edit Rule #${editingRule.id}` : 'Create Brand Guideline Rule'}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="form-category">
                  Rule Category
                </label>
                <select
                  id="form-category"
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="form-rule-text">
                  Rule Phrase or Approved Term
                </label>
                <input
                  id="form-rule-text"
                  type="text"
                  className="form-input"
                  placeholder="e.g. 100% guaranteed, Brandguard AI"
                  value={formData.rule_text}
                  onChange={(e) => setFormData({ ...formData, rule_text: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="form-description">
                  Guidance Notes / Unapproved Variants
                </label>
                <textarea
                  id="form-description"
                  className="form-textarea"
                  rows={3}
                  placeholder="For brand terminology, list comma-separated unapproved variants (e.g. Brand Guard, brandguard). For other rules, explain why this rule matters."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="form-severity">
                    Severity Level
                  </label>
                  <select
                    id="form-severity"
                    className="form-select"
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  >
                    <option value="critical">Critical (Non-negotiable)</option>
                    <option value="warning">Warning (Editorial attention)</option>
                    <option value="info">Info (Advisory notice)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_approved}
                      onChange={(e) => setFormData({ ...formData, is_approved: e.target.checked })}
                    />
                    <span>Approved &amp; Authoritative</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_protected}
                      onChange={(e) => setFormData({ ...formData, is_protected: e.target.checked })}
                    />
                    <span>Protect from accidental deletion</span>
                  </label>
                </div>
              </div>

              {formError && (
                <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                  ⚠️ {formError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formSubmitting}>
                  {formSubmitting ? <span className="spinner" /> : editingRule ? 'Save Changes' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
