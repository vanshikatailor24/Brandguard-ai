/**
 * frontend/src/pages/ReviewHistory.jsx
 * Audit log of saved content reviews with full findings detail modal and revision history.
 */
import { useState } from 'react'
import { useFetch } from '../hooks/useFetch'
import { api } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import { useNavigate } from 'react-router-dom'

export default function ReviewHistory() {
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useFetch(() => api.getReviews({ limit: 50 }), [])
  const reviews = data?.reviews ?? []

  const [selectedReview, setSelectedReview] = useState(null)

  return (
    <div>
      {/* Hero */}
      <div className="page-hero" style={{ marginBottom: 20 }}>
        <div className="page-hero-title">Content Review Audit History</div>
        <div className="page-hero-sub">
          Historical log of content evaluations, compliance findings, and accepted revisions.
          Review records are preserved to provide an auditable governance trail.
        </div>
      </div>

      {loading && (
        <div className="loading-container">
          <span className="spinner" /> Loading review history…
        </div>
      )}

      {error && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          ⚠️ Could not load review history: {error}
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 12 }} onClick={refetch}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && reviews.length === 0 && (
        <div className="card empty-state">
          <div className="empty-state-icon">🕒</div>
          <div className="empty-state-title">No Reviews Recorded Yet</div>
          <div className="empty-state-text">
            When you evaluate copy via the Content Review section, the results and any accepted corrections
            will appear here for compliance auditing.
          </div>
          <button
            id="start-review-history-btn"
            className="btn btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => navigate('/review')}
          >
            Review First Content
          </button>
        </div>
      )}

      {!loading && reviews.length > 0 && (
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">All Reviews ({reviews.length})</div>
              <div className="section-sub">Chronological audit log (newest first)</div>
            </div>
            <button
              id="new-review-btn"
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/review')}
            >
              + New Review
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title / Reference</th>
                <th>Content Type</th>
                <th>Compliance Status</th>
                <th>Rules Checked</th>
                <th>Violations</th>
                <th>Review Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td>
                    <strong>{r.title || `Review #${r.id}`}</strong>
                    {r.corrected_text && (
                      <span className="badge badge-sage" style={{ marginLeft: 6, fontSize: 11 }}>
                        ✓ Corrected
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-sage">{r.content_type}</span>
                  </td>
                  <td>
                    <StatusBadge status={r.review_status} />
                  </td>
                  <td>{r.rules_checked}</td>
                  <td style={{ color: r.violations_found > 0 ? 'var(--color-error)' : 'var(--color-success)', fontWeight: 600 }}>
                    {r.violations_found}
                  </td>
                  <td>
                    {r.created_at
                      ? new Date(r.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setSelectedReview(r)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Details Modal */}
      {selectedReview && (
        <div className="modal-backdrop" onClick={() => setSelectedReview(null)}>
          <div className="modal-box" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
            <div className="section-header">
              <div>
                <div className="section-title">{selectedReview.title || `Review #${selectedReview.id}`}</div>
                <div className="section-sub">
                  Conducted on{' '}
                  {selectedReview.created_at
                    ? new Date(selectedReview.created_at).toLocaleString()
                    : 'N/A'}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedReview(null)}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <StatusBadge status={selectedReview.review_status} />
              <span className="badge badge-sage">{selectedReview.content_type}</span>
              <span className="badge badge-gold">{selectedReview.violations_found} violation(s)</span>
            </div>

            {/* Original content */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-forest)' }}>
                Original Evaluated Content:
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, whiteSpace: 'pre-wrap' }}>
                {selectedReview.content_text || 'No text captured.'}
              </div>
            </div>

            {/* Accepted Revision if exists */}
            {selectedReview.corrected_text && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#166534' }}>
                  ✓ Accepted Corrected Revision:
                </div>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 12, fontSize: 13, whiteSpace: 'pre-wrap' }}>
                  {selectedReview.corrected_text}
                </div>
              </div>
            )}

            {/* Findings List */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--color-forest)' }}>
                Audit Findings ({selectedReview.findings?.length || 0}):
              </div>
              {!selectedReview.findings || selectedReview.findings.length === 0 ? (
                <div style={{ fontSize: 13, color: '#166534' }}>No violations found. Content passed all rules.</div>
              ) : (
                selectedReview.findings.map((f, i) => (
                  <div key={i} className="finding-item" style={{ background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="finding-category">{f.rule_category}</span>
                      <span className={`badge ${f.severity === 'critical' ? 'badge-error' : 'badge-warning'}`}>
                        {f.severity || 'warning'}
                      </span>
                    </div>
                    <div className="finding-reason">{f.reason}</div>
                    {f.matched_text && <div className="finding-matched">"{f.matched_text}"</div>}
                    {f.suggestion && <div className="finding-suggestion">💡 {f.suggestion}</div>}
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button className="btn btn-primary" onClick={() => setSelectedReview(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
