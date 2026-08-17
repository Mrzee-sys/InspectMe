import axios from 'axios'

let apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://inspectme.onrender.com'

// Safety check to ensure the URL always routes to the /api endpoints
if (!apiBaseUrl.endsWith('/api')) {
  apiBaseUrl += '/api'
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
})

export function setAuthToken(token) {
  if (!token) {
    delete apiClient.defaults.headers.common.Authorization
    return
  }

  apiClient.defaults.headers.common.Authorization = `Bearer ${token}`
}