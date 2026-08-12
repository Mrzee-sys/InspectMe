import { apiClient } from './apiClient'

export async function fetchSites() {
  const response = await apiClient.get('/sites')
  return response.data
}

export async function fetchLocations(siteId) {
  const response = await apiClient.get('/locations', {
    params: siteId ? { siteId } : undefined,
  })
  return response.data
}

export async function fetchInspections(params) {
  const response = await apiClient.get('/inspections', {
    params,
  })
  return response.data
}

export async function submitInspection(payload) {
  const response = await apiClient.post('/inspections', payload)
  return response.data
}
