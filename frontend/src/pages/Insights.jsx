/**
 * frontend/src/pages/Insights.jsx
 * Governance Analytics & Compliance Insights derived from real stored database data.
 */
import { useFetch } from '../hooks/useFetch'
import { api } from '../services/api'
import StatusBadge from '../components/StatusBadge'

export default function Insights() {
  const { data: insights, loading, error, refetch } = useFetch(() => api.getInsights(), [])

  return (
    <div>
      {/* Hero */}
      <div className="page-hero" style={{ marginBottom: 20 }}>
        <div className="page-hero-title">Governance Analytics &amp; Insights</div>
        <div className="page-hero-sub">
          Aggregated brand compliance metrics derived from actual reviews and rule evaluations.
          All statistics reflect verified audit data without fabricated estimations.
        </div>
      </div>

      {loading && (
        <div className="loading-container">
          <span className="spinner" /> Calculating insights…
        </div>
      )}

      {error && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          ⚠️ Could not load insights: {error}
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 12 }} onClick={refetch}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && insights && (
        <div>
          {/* Key Metrics Grid */}
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-label">Total Reviews</div>
              <div className="stat-value">{insights.total_reviews}</div>
              <div className="stat-sub">Audit records stored</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Compliance Pass Rate</div>
              <div className="stat-value" style={{ color: insights.pass_rate_percentage >= 70 ? 'var(--color-forest)' : '#b45309' }}>
                {insights.pass_rate_percentage}%
              </div>
              <div className="stat-sub">
                {insights.passed_reviews} passed / {insights.failed_reviews} flagged
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Authoritative Rules</div>
              <div className="stat-value">{insights.approved_rules}</div>
              <div className="stat-sub">{insights.draft_rules} candidate rules pending</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Governance Health</div>
              <div className="stat-value" style={{ fontSize: 24, paddingTop: 4 }}>
                <span className={`badge ${insights.governance_health_status === 'Excellent' ? 'badge-success' : 'badge-warning'}`}>
                  {insights.governance_health_status}
                </span>
              </div>
              <div className="stat-sub">Based on live review trends</div>
            </div>
          </div>

          {/* Breakdown Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Reviews by Content Type */}
            <div className="card">
              <div className="section-header">
                <div>
                  <div className="section-title">Compliance by Content Channel</div>
                  <div className="section-sub">Pass/fail breakdown across channels</div>
                </div>
              </div>

              {insights.reviews_by_content_type?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: '#6b7671' }}>
                  No content reviews recorded across channels yet.
                </div>
              ) : (
                <div>
                  {insights.reviews_by_content_type.map((t) => {
                    const rate = t.count > 0 ? Math.round((t.pass_count / t.count) * 100) : 0
                    return (
                      <div key={t.content_type} style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                            {t.content_type.replace(/_/g, ' ')} ({t.count} reviews)
                          </span>
                          <span style={{ color: rate >= 70 ? '#166534' : '#b45309', fontWeight: 600 }}>
                            {rate}% pass ({t.pass_count} passed, {t.fail_count} failed)
                          </span>
                        </div>
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${rate}%`,
                              background: rate >= 70 ? 'var(--color-forest)' : '#f59e0b',
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Top Violated Categories */}
            <div className="card">
              <div className="section-header">
                <div>
                  <div className="section-title">Frequent Violation Triggers</div>
                  <div className="section-sub">Rule categories triggering the most findings</div>
                </div>
              </div>

              {insights.top_violated_categories?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: '#6b7671' }}>
                  No brand rule violations currently flagged in audit history.
                </div>
              ) : (
                <div>
                  {insights.top_violated_categories.map((c, i) => (
                    <div
                      key={c.category}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 14px',
                        background: i === 0 ? '#fff8f1' : 'var(--color-sage)',
                        borderRadius: 8,
                        marginBottom: 10,
                        border: i === 0 ? '1px solid #fed7aa' : 'none',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, textTransform: 'capitalize' }}>
                          {c.category.replace(/_/g, ' ')}
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7671' }}>
                          {i === 0 ? '⚠️ Most common compliance obstacle' : 'Frequent finding'}
                        </div>
                      </div>
                      <span className="badge badge-error" style={{ fontSize: 13 }}>
                        {c.count} incident{c.count === 1 ? '' : 's'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
