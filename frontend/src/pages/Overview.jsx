/**
 * frontend/src/pages/Overview.jsx
 * Dashboard Overview: Real application statistics, recent reviews, and active brand rules.
 */
import { useNavigate } from 'react-router-dom'
import { useFetch } from '../hooks/useFetch'
import { api } from '../services/api'
import { auth } from '../services/auth'
import StatusBadge from '../components/StatusBadge'

function StatCard({ label, value, sub, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

export default function Overview() {
  const navigate = useNavigate()
  const user = auth.getUser()
  const displayName = user?.full_name || user?.name || (user?.email ? user.email.split('@')[0] : 'Brand Administrator')
  const companyName = user?.company?.name


  const { data: reviewsData, loading: reviewsLoading, error: reviewsError } =
    useFetch(() => api.getReviews({ limit: 5 }), [])
  const { data: rulesData, loading: rulesLoading } = useFetch(
    () => api.getRules({ approved_only: true }),
    []
  )

  const reviews = reviewsData?.reviews ?? []
  const rules = rulesData?.rules ?? []

  const passCount = reviews.filter((r) => r.review_status === 'pass').length
  const failCount = reviews.filter((r) => r.review_status === 'fail').length

  return (
    <div>
      {/* Hero */}
      <div className="page-hero">
        <div className="page-hero-title">Welcome, {displayName} 👋</div>
        <div className="page-hero-sub">
          {companyName ? (
            <span style={{ display: 'inline-block', marginBottom: '4px' }}>
              <strong style={{ color: 'var(--color-gold-lt)' }}>{companyName}</strong> Governance Workspace •{' '}
            </span>
          ) : null}
          AI-assisted brand governance platform for companies. Review marketing content,
          enforce mandatory disclaimers, protect brand identity assets, and safely correct violations.
        </div>

        <div className="hero-actions">
          <button
            id="hero-review-btn"
            className="btn btn-gold btn-lg"
            onClick={() => navigate('/review')}
          >
            🔍 Review Content
          </button>
          <button
            id="hero-guidelines-btn"
            className="btn btn-outline btn-lg"
            style={{ borderColor: 'rgba(247,246,240,0.40)', color: 'var(--color-ivory)' }}
            onClick={() => navigate('/guidelines')}
          >
            📋 Brand Guidelines
          </button>
          <button
            id="hero-documents-btn"
            className="btn btn-outline btn-lg"
            style={{ borderColor: 'rgba(247,246,240,0.40)', color: 'var(--color-ivory)' }}
            onClick={() => navigate('/documents')}
          >
            📄 Upload Policies
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stat-grid">
        <StatCard
          label="Total Content Reviews"
          value={reviewsLoading ? '…' : reviews.length}
          sub="Stored audit records"
          icon="🔍"
        />
        <StatCard
          label="Approved Brand Rules"
          value={rulesLoading ? '…' : rules.length}
          sub="Active in review engine"
          icon="📋"
        />
        <StatCard
          label="Reviews Passed"
          value={reviewsLoading ? '…' : passCount}
          sub="Zero violations flagged"
          icon="✅"
        />
        <StatCard
          label="Violations Flagged"
          value={reviewsLoading ? '…' : failCount}
          sub="Revisions suggested"
          icon="⚠️"
        />
      </div>

      {/* Recent Reviews */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <div>
            <div className="section-title">Recent Content Reviews</div>
            <div className="section-sub">Latest 5 content evaluations</div>
          </div>
          <button
            id="view-all-history-btn"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/history')}
          >
            View All History →
          </button>
        </div>

        {reviewsLoading && (
          <div className="loading-container">
            <span className="spinner" /> Loading reviews…
          </div>
        )}

        {reviewsError && (
          <div className="alert alert-warning">
            ⚠️ Could not load reviews: <em>{reviewsError}</em>
          </div>
        )}

        {!reviewsLoading && !reviewsError && reviews.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">No Reviews Recorded Yet</div>
            <div className="empty-state-text">
              Submit your first copy or marketing announcement for review to see live governance metrics.
            </div>
            <button
              id="go-review-from-empty"
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => navigate('/review')}
            >
              Start First Review
            </button>
          </div>
        )}

        {!reviewsLoading && reviews.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title / Reference</th>
                <th>Content Type</th>
                <th>Status</th>
                <th>Rules Checked</th>
                <th>Violations</th>
                <th>Date</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Rules Status */}
      <div className="card">
        <div className="section-header">
          <div>
            <div className="section-title">Active Brand Guidelines</div>
            <div className="section-sub">Authoritative rules currently active in the review engine</div>
          </div>
          <button
            id="manage-rules-btn"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/guidelines')}
          >
            Manage Guidelines →
          </button>
        </div>

        {rulesLoading && (
          <div className="loading-container">
            <span className="spinner" /> Loading active guidelines…
          </div>
        )}

        {!rulesLoading && rules.length === 0 && (
          <div className="empty-state" style={{ padding: 28 }}>
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No Approved Rules</div>
            <div className="empty-state-text">
              No brand rules have been approved yet. Reviews will report "no rules" until guidelines are created and approved.
            </div>
            <button
              className="btn btn-primary"
              style={{ marginTop: 14 }}
              onClick={() => navigate('/guidelines')}
            >
              Add Brand Rule
            </button>
          </div>
        )}

        {!rulesLoading && rules.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Authoritative Rule Phrase</th>
                <th>Severity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rules.slice(0, 5).map((rule) => (
                <tr key={rule.id}>
                  <td>
                    <span className="badge badge-gold">{rule.category.replace(/_/g, ' ')}</span>
                  </td>
                  <td style={{ maxWidth: 450, fontWeight: 600 }}>
                    {rule.rule_text}
                    {rule.is_protected && (
                      <span className="badge badge-gold" style={{ marginLeft: 6, fontSize: 11 }}>
                        🛡️ Protected
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${rule.severity === 'critical' ? 'badge-error' : 'badge-warning'}`}>
                      {rule.severity || 'warning'}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status="approved" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
