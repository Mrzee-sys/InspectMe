import { Outlet } from 'react-router-dom'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useAuth } from '../store/authContext'
import AnimatedBottomDock from '../components/AnimatedBottomDock'

function AppLayout() {
  const isOnline = useOnlineStatus()
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-transparent text-slate-900">

      <main className="mx-auto w-full max-w-3xl flex-1 px-0 pb-0 sm:max-w-5xl sm:px-0 sm:pb-0">
        <Outlet />
      </main>

      <footer className="px-4 pb-20 text-center text-[12px] font-medium tracking-wide text-slate-500 sm:px-6 sm:pb-4 sm:text-sm">
        Desgined By ClearPathTech V1.0
      </footer>

      <AnimatedBottomDock />
    </div>
  )
}

export default AppLayout