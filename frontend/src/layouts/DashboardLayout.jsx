/**
 * frontend/src/layouts/DashboardLayout.jsx
 * Wraps every page with Sidebar + TopBar + scrollable content area.
 */
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopBar  from '../components/TopBar'

const PAGE_META = {
  '/':           { title: 'Overview',          badge: 'Dashboard' },
  '/overview':   { title: 'Overview',          badge: 'Dashboard' },
  '/review':     { title: 'Content Review',    badge: 'Review Tool' },
  '/guidelines': { title: 'Brand Guidelines',  badge: 'Rules' },
  '/documents':  { title: 'Policy & Documents',badge: 'Documents' },
  '/history':    { title: 'Review History',    badge: 'History' },
  '/insights':   { title: 'Insights',          badge: 'Analytics' },
  '/settings':   { title: 'Settings',          badge: 'Config' },
}

export default function DashboardLayout() {
  const { pathname } = useLocation()
  const meta = PAGE_META[pathname] ?? { title: 'Brandguard AI', badge: null }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <TopBar title={meta.title} badge={meta.badge} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
