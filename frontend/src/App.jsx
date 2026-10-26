/**
 * frontend/src/App.jsx
 * Root router configuration for Brandguard AI with authentication route guards.
 */
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import Overview        from './pages/Overview'
import ContentReview   from './pages/ContentReview'
import BrandGuidelines from './pages/BrandGuidelines'
import PolicyDocuments from './pages/PolicyDocuments'
import ReviewHistory   from './pages/ReviewHistory'
import Insights        from './pages/Insights'
import Settings        from './pages/Settings'
import Login           from './pages/Login'
import Onboarding      from './pages/Onboarding'
import { auth }        from './services/auth'

/**
 * Route guard component: redirects unauthenticated users to /login
 */
function ProtectedRoute({ children }) {
  const location = useLocation()
  if (!auth.isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

/**
 * Public route component: redirects already logged-in users to /overview
 */
function PublicOnlyRoute({ children }) {
  if (auth.isAuthenticated()) {
    return <Navigate to="/overview" replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />

        {/* Dedicated Company Setup / Onboarding Route */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >

          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview"   element={<Overview />} />
          <Route path="review"     element={<ContentReview />} />
          <Route path="guidelines" element={<BrandGuidelines />} />
          <Route path="documents"  element={<PolicyDocuments />} />
          <Route path="history"    element={<ReviewHistory />} />
          <Route path="insights"   element={<Insights />} />
          <Route path="settings"   element={<Settings />} />
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
