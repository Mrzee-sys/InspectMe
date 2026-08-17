import { NavLink, Outlet } from 'react-router-dom'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useAuth } from '../store/authContext'

const navLinkBase = 'flex-1 rounded-xl px-3 py-3 text-center text-xs font-semibold transition'

function AppLayout() {
  const isOnline = useOnlineStatus()
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-transparent text-slate-900">
      <header className="sticky top-0 z-20 border-b border-white/35 bg-white/35 backdrop-blur-xl">
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
                <span className="hidden rounded-full border border-white/40 bg-white/45 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur lg:inline-flex">
                  {user?.username} ({user?.role})
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg border border-white/40 bg-white/40 px-3 py-1.5 text-xs font-semibold text-slate-700 backdrop-blur transition hover:bg-white/55"
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
                isActive ? 'bg-teal-600 text-white' : 'text-slate-700 hover:bg-white/45'
              }`
            }
          >
            Login
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-teal-600 text-white' : 'text-slate-700 hover:bg-white/45'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/inspections"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-teal-600 text-white' : 'text-slate-700 hover:bg-white/45'
              }`
            }
          >
            Inspections
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-teal-600 text-white' : 'text-slate-700 hover:bg-white/45'
              }`
            }
          >
            Settings
          </NavLink>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-3 py-4 pb-24 sm:max-w-5xl sm:px-6 sm:py-6 sm:pb-6">
        <Outlet />
      </main>

      <footer className="px-4 pb-20 text-center text-[12px] font-medium tracking-wide text-slate-500 sm:px-6 sm:pb-4 sm:text-sm">
        Desgined By ClearPathTech V1.0
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/35 bg-white/40 p-3 backdrop-blur-xl sm:hidden">
        <div className="mx-auto flex max-w-3xl gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? 'bg-teal-600 text-white' : 'bg-white/45 text-slate-700 backdrop-blur'}`
            }
          >
            Login
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? 'bg-teal-600 text-white' : 'bg-white/45 text-slate-700 backdrop-blur'}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/inspections"
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? 'bg-teal-600 text-white' : 'bg-white/45 text-slate-700 backdrop-blur'}`
            }
          >
            Inspect
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? 'bg-teal-600 text-white' : 'bg-white/45 text-slate-700 backdrop-blur'}`
            }
          >
            Settings
          </NavLink>
        </div>
      </nav>
    </div>
  )
}

export default AppLayout
