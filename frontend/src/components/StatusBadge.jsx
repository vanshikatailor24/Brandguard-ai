/**
 * frontend/src/components/StatusBadge.jsx
 * Renders a coloured badge based on review_status or rule approval.
 */
const MAP = {
  pass:     { cls: 'badge-pass',     label: '✓ Pass' },
  fail:     { cls: 'badge-fail',     label: '✗ Fail' },
  no_rules: { cls: 'badge-no-rules', label: '⚠ No Rules' },
  approved: { cls: 'badge-pass',     label: '✓ Approved' },
  pending:  { cls: 'badge-pending',  label: '● Pending' },
}

export default function StatusBadge({ status }) {
  const config = MAP[status] ?? { cls: 'badge-pending', label: status }
  return <span className={`badge ${config.cls}`}>{config.label}</span>
}
