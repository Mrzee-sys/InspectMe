import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../store/authContext'

function ProtectedRoute() {
  const location = useLocation()
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (user?.mustChangePassword && location.pathname !== '/set-password') {
    return <Navigate to="/set-password" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
