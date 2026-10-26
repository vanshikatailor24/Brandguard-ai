/**
 * frontend/src/services/auth.js
 * Session and token persistence for Brandguard AI authentication.
 */

const TOKEN_KEY = 'brandguard_auth_token'
const USER_KEY = 'brandguard_auth_user'

export const auth = {
  getToken: () => {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch (_) {
      return null
    }
  },

  getUser: () => {
    try {
      const raw = localStorage.getItem(USER_KEY)
      return raw ? JSON.parse(raw) : null
    } catch (_) {
      return null
    }
  },

  setSession: (token, user) => {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token)
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    } catch (_) {}
  },

  updateUser: (partialUser) => {
    try {
      const current = auth.getUser() || {}
      const updated = { ...current, ...partialUser }
      localStorage.setItem(USER_KEY, JSON.stringify(updated))
      return updated
    } catch (_) {
      return null
    }
  },

  updateCompany: (company) => {
    try {
      const current = auth.getUser() || {}
      const updated = {
        ...current,
        company_id: company.id,
        company,
        has_completed_onboarding: true,
      }
      localStorage.setItem(USER_KEY, JSON.stringify(updated))
      return updated
    } catch (_) {
      return null
    }
  },

  clearSession: () => {
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    } catch (_) {}
  },

  isAuthenticated: () => {
    try {
      return Boolean(localStorage.getItem(TOKEN_KEY))
    } catch (_) {
      return false
    }
  },

  hasCompletedOnboarding: () => {
    try {
      const user = auth.getUser()
      return Boolean(user && user.has_completed_onboarding)
    } catch (_) {
      return false
    }
  },
}

