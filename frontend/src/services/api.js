/**
 * frontend/src/services/api.js
 * Centralised API client for all Brandguard AI backend calls.
 */

// Live production backend URL on Render
const DEFAULT_PROD_URL = 'https://brandguard-ai-2-yclr.onrender.com/api'

function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (envUrl && envUrl.trim()) {
    let cleaned = envUrl.trim().replace(/\/+$/, '')
    // Normalize base URL so all relative paths (/health, /rules, /v1/auth/...) resolve correctly
    if (!cleaned.endsWith('/api')) {
      cleaned = `${cleaned}/api`
    }
    return cleaned
  }

  // In production builds (e.g. deployed on Vercel), fall back to the live Render backend
  if (import.meta.env.PROD) {
    return DEFAULT_PROD_URL
  }

  // In local development, default to relative '/api' proxied by Vite to :8000
  return '/api'
}

const BASE_URL = getApiBaseUrl()

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const isFormData = options.body instanceof FormData

  let token = null
  try {
    token = localStorage.getItem('brandguard_auth_token')
  } catch (_) {}

  const authHeader = token ? { Authorization: `Bearer ${token}` } : {}

  const headers = isFormData
    ? { ...authHeader, ...options.headers }
    : { 'Content-Type': 'application/json', ...authHeader, ...options.headers }

  const res = await fetch(url, {
    ...options,
    headers,
  })

  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const body = await res.json()
      detail = body.detail ?? JSON.stringify(body)
    } catch (_) { /* ignore parse errors */ }
    throw new Error(detail)
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  /** Authentication & User Profile */
  login: (credentials) =>
    request('/v1/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  signup: (payload) =>
    request('/v1/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: (email) => {
    const qs = email ? `?email=${encodeURIComponent(email)}` : ''
    return request(`/v1/auth/me${qs}`)
  },

  /** Company Onboarding & Management */
  onboardCompany: (payload) =>
    request('/v1/company/onboard', { method: 'POST', body: JSON.stringify(payload) }),


  /** System & Health */
  health: () => request('/health'),
  getSystemDiagnostics: () => request('/settings/system'),

  /** Brand Rules */
  getRules: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/rules${qs ? `?${qs}` : ''}`)
  },
  createRule: (payload) =>
    request('/rules', { method: 'POST', body: JSON.stringify(payload) }),
  getRule: (id) => request(`/rules/${id}`),
  updateRule: (id, payload) =>
    request(`/rules/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  toggleApproveRule: (id, approved = true) =>
    request(`/rules/${id}/approve?approved=${approved}`, { method: 'POST' }),
  deleteRule: (id) =>
    request(`/rules/${id}`, { method: 'DELETE' }),

  /** Content Reviews */
  getReviews: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/reviews${qs ? `?${qs}` : ''}`)
  },
  getReview: (id) => request(`/reviews/${id}`),
  submitReview: (payload) =>
    request('/reviews', { method: 'POST', body: JSON.stringify(payload) }),
  autoCorrect: (payload) =>
    request('/reviews/correct', { method: 'POST', body: JSON.stringify(payload) }),
  acceptCorrection: (id, payload) =>
    request(`/reviews/${id}/accept`, { method: 'POST', body: JSON.stringify(payload) }),

  /** Documents (Policy & Guidelines) */
  getDocuments: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/documents${qs ? `?${qs}` : ''}`)
  },
  uploadDocument: (formData) =>
    request('/documents/upload', { method: 'POST', body: formData }),
  deleteDocument: (id) =>
    request(`/documents/${id}`, { method: 'DELETE' }),

  /** Images */
  reviewImage: (formData) =>
    request('/images/review', { method: 'POST', body: formData }),

  /** Insights */
  getInsights: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/insights${qs ? `?${qs}` : ''}`)
  },

  /** Settings & Protected Elements */
  getProtectedElements: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/settings/protected-elements${qs ? `?${qs}` : ''}`)
  },
  createProtectedElement: (payload) =>
    request('/settings/protected-elements', { method: 'POST', body: JSON.stringify(payload) }),
  deleteProtectedElement: (id) =>
    request(`/settings/protected-elements/${id}`, { method: 'DELETE' }),
  getCompanies: () => request('/companies'),
}
