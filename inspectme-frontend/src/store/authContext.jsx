/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiClient, setAuthToken } from '../services/apiClient'

const STORAGE_KEY = 'inspectme-auth'

const AuthContext = createContext(null)

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { token: '', user: null }
    }

    const parsed = JSON.parse(raw)
    return {
      token: parsed.token || '',
      user: parsed.user || null,
    }
  } catch {
    return { token: '', user: null }
  }
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => readStoredAuth())

  useEffect(() => {
    setAuthToken(authState.token)

    if (!authState.token) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(authState))
  }, [authState])

  async function login({ username, password }) {
    const response = await apiClient.post('/auth/login', {
      username,
      password,
    })

    const nextAuth = {
      token: response.data.token,
      user: response.data.user,
    }

    setAuthState(nextAuth)
    return nextAuth.user
  }

  async function changePassword({ currentPassword, newPassword }) {
    const response = await apiClient.patch('/auth/change-password', {
      currentPassword,
      newPassword,
    })

    setAuthState((current) => ({
      ...current,
      user: response.data.user,
    }))

    return response.data.user
  }

  function logout() {
    setAuthState({ token: '', user: null })
  }

  const value = useMemo(
    () => ({
      token: authState.token,
      user: authState.user,
      isAuthenticated: Boolean(authState.token && authState.user),
      login,
      changePassword,
      logout,
    }),
    [authState.token, authState.user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.')
  }

  return context
}
