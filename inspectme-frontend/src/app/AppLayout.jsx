import { Outlet } from 'react-router-dom'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useAuth } from '../store/authContext'
import AnimatedBottomDock from '../components/AnimatedBottomDock'

function AppLayout() {
  const isOnline = useOnlineStatus()
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-transparent text-slate-900 w-full relative overflow-x-hidden hide-scrollbar">
      <style dangerouslySetInnerHTML={{ __html: '.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }' }} />
      <main className="w-full flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar text-slate-900 text-sm">
        <Outlet />
      </main>

      <AnimatedBottomDock />
    </div>
  )
}

export default AppLayout