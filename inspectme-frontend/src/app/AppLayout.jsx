import { NavLink, Outlet } from 'react-router-dom'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useAuth } from '../store/authContext'

const navLinkBase = 'flex-1 rounded-xl px-3 py-3 text-center text-xs font-semibold transition'

function AppLayout() {
  const isOnline = useOnlineStatus()
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <div className="min-h-[100svh] bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-600">InspectMe</p>
            <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">Inspection Management</h1>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {isOnline ? 'Online' : 'Offline'}
            </span>
            {isAuthenticated && (
              <>
                <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 lg:inline-flex">
                  {user?.username} ({user?.role})
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
        <nav className="mx-auto hidden w-full max-w-5xl gap-2 px-4 pb-3 sm:flex sm:px-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            Login
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/inspections"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            Inspections
          </NavLink>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl px-3 py-4 pb-24 sm:max-w-5xl sm:px-6 sm:py-6 sm:pb-6">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-3xl gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`
            }
          >
            Login
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/inspections"
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`
            }
          >
            Inspect
          </NavLink>
        </div>
      </nav>
    </div>
  )
}

export default AppLayout
