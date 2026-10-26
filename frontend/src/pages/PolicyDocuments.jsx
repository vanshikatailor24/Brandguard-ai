/**
 * frontend/src/pages/PolicyDocuments.jsx
 * Policy & Document Management: Upload brand books, guidelines (PDF, DOCX, TXT),
 * extract candidate rules, and review them for approval.
 */
import { useState, useRef } from 'react'
import { useFetch } from '../hooks/useFetch'
import { api } from '../services/api'
import StatusBadge from '../components/StatusBadge'

export default function PolicyDocuments() {
  const { data, loading, error, refetch } = useFetch(() => api.getDocuments(), [])
  const documents = data?.documents ?? []

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadResult, setUploadResult] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)

  function handleFileSelected(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // Quick client-side validation
    const ext = file.name.slice(((file.name.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase()
    if (!['pdf', 'docx', 'txt'].includes(ext)) {
      setUploadError(`Unsupported file format '.${ext}'. Please choose a .pdf, .docx, or .txt file.`)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError(`File exceeds maximum size of 10MB (${(file.size / (1024 * 1024)).toFixed(1)}MB).`)
      return
    }

    setSelectedFile(file)
    setUploadError(null)
    setUploadResult(null)
  }

  async function handleUploadSubmit(e) {
    e.preventDefault()
    if (!selectedFile) return

    setUploading(true)
    setUploadError(null)

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const res = await api.uploadDocument(formData)
      setUploadResult(res)
      setSelectedFile(null)
      refetch()
    } catch (err) {
      setUploadError(err.message ?? 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteDocument(doc) {
    if (!window.confirm(`Delete document '${doc.filename}'?`)) return
    try {
      await api.deleteDocument(doc.id)
      refetch()
    } catch (err) {
      alert(`Delete failed: ${err.message}`)
    }
  }

  return (
    <div>
      {/* Hero */}
      <div className="page-hero" style={{ marginBottom: 20 }}>
        <div className="page-hero-title">Policy &amp; Brand Documents</div>
        <div className="page-hero-sub">
          Upload policy guidelines, brand books, and compliance requirements in PDF, Word (DOCX),
          or Plain Text. The platform parses the document and extracts candidate brand rules for human review.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start', marginBottom: 24 }}>
        {/* Left: Upload Card */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Upload Guidelines Document</div>
              <div className="section-sub">Supports .pdf, .docx, and .txt files (max 10MB)</div>
            </div>
          </div>

          <form onSubmit={handleUploadSubmit}>
            <div
              className="upload-dropzone"
              onClick={() => fileInputRef.current?.click()}
              style={{ marginBottom: 16 }}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".pdf,.docx,.txt"
                onChange={handleFileSelected}
              />
              <div style={{ fontSize: 40, marginBottom: 8 }}>📄</div>
              <div style={{ fontWeight: 600, color: 'var(--color-forest)', marginBottom: 4 }}>
                {selectedFile ? selectedFile.name : 'Click to select policy document'}
              </div>
              <div style={{ fontSize: 13, color: '#6b7671' }}>
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                  : 'PDF, DOCX, or TXT — extracted candidate rules require human approval'}
              </div>
            </div>

            {uploadError && (
              <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                ⚠️ {uploadError}
              </div>
            )}

            <button
              id="upload-doc-submit-btn"
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={uploading || !selectedFile}
            >
              {uploading ? (
                <>
                  <span className="spinner" /> Parsing &amp; Extracting Rules…
                </>
              ) : (
                '📤 Upload &amp; Extract Candidate Rules'
              )}
            </button>
          </form>
        </div>

        {/* Right: Candidate Rules Extraction Result */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Extraction Results</div>
              <div className="section-sub">Candidate rules discovered from upload</div>
            </div>
          </div>

          {uploadResult ? (
            <div>
              <div className="alert alert-success" style={{ marginBottom: 16 }}>
                ✅ {uploadResult.message}
              </div>

              {uploadResult.candidate_rules?.length > 0 ? (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--color-forest)' }}>
                    Extracted Candidate Rules ({uploadResult.candidate_rules.length})
                  </div>
                  {uploadResult.candidate_rules.map((rule, idx) => (
                    <div key={idx} className="finding-item" style={{ background: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span className="finding-category">{rule.category.replace(/_/g, ' ')}</span>
                        <span className="badge badge-pending">Draft / Requires Review</span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-charcoal)', marginBottom: 4 }}>
                        "{rule.rule_text}"
                      </div>
                      {rule.source_excerpt && (
                        <div style={{ fontSize: 11, color: '#6b7671' }}>
                          📄 {rule.source_excerpt}
                        </div>
                      )}
                    </div>
                  ))}
                  <div style={{ fontSize: 12, color: '#6b7671', marginTop: 10 }}>
                    💡 Candidate rules have been saved as drafts. Visit the <strong>Brand Guidelines</strong> page to review and approve them.
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 16px', color: '#6b7671' }}>
                  No explicit directives or prohibited/required rules detected in this document.
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: '#6b7671' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
              <div style={{ fontWeight: 600 }}>No Recent Extraction</div>
              <div style={{ fontSize: 13 }}>
                Upload a company policy or brand document to extract draft brand rules.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Document Library List */}
      <div className="card">
        <div className="section-header">
          <div>
            <div className="section-title">Uploaded Document Library</div>
            <div className="section-sub">All policy guides and source documents on record</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={refetch}>
            🔄 Refresh
          </button>
        </div>

        {loading && (
          <div className="loading-container">
            <span className="spinner" /> Loading documents…
          </div>
        )}

        {error && (
          <div className="alert alert-warning">
            ⚠️ Could not load documents: {error}
          </div>
        )}

        {!loading && !error && documents.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📂</div>
            <div className="empty-state-title">No Documents Uploaded</div>
            <div className="empty-state-text">
              Upload your company brand guide or compliance handbook above to begin.
            </div>
          </div>
        )}

        {!loading && documents.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Type</th>
                <th>Size</th>
                <th>Status</th>
                <th>Rules Extracted</th>
                <th>Upload Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <strong>{doc.filename}</strong>
                    {doc.error_message && (
                      <div style={{ fontSize: 11, color: 'var(--color-error)' }}>
                        {doc.error_message}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-sage">.{doc.file_type}</span>
                  </td>
                  <td>{(doc.file_size / 1024).toFixed(1)} KB</td>
                  <td>
                    <StatusBadge status={doc.processing_status} />
                  </td>
                  <td>{doc.rules_extracted_count} rule(s)</td>
                  <td>
                    {doc.created_at
                      ? new Date(doc.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--color-error)' }}
                      onClick={() => handleDeleteDocument(doc)}
                    >
                      Delete
                    </button>
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
