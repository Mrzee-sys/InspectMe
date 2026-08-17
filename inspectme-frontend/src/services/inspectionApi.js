import { apiClient } from './apiClient'

export async function fetchSites() {
  const response = await apiClient.get('/sites')
  return response.data
}

export async function createSite(payload) {
  const response = await apiClient.post('/sites', payload)
  return response.data
}

export async function fetchLocations(siteId) {
  const response = await apiClient.get('/locations', {
    params: siteId ? { siteId } : undefined,
  })
  return response.data
}

export async function createLocation(payload) {
  const response = await apiClient.post('/locations', payload)
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

export async function submitHealthSafetyInspection(payload) {
  const response = await apiClient.post('/health-safety-inspections', payload)
  return response.data
}

export async function fetchHealthSafetyInspections(params) {
  const response = await apiClient.get('/health-safety-inspections', {
    params,
  })
  return response.data
}
