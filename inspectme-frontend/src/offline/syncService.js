import { apiClient } from '../services/apiClient'
import { getPendingOutboxItems, markOutboxItemSynced, putOutboxItem } from './db'

let syncing = false
let listenersBound = false

async function postInspection(payload) {
  await apiClient.post('/inspections', payload)
}

export async function queueInspectionSubmission(payload) {
  const clientId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  await putOutboxItem({
    clientId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    payload,
  })

  return clientId
}

export async function flushInspectionOutbox() {
  if (syncing || !navigator.onLine) {
    return { synced: 0 }
  }

  syncing = true

  try {
    const pendingItems = await getPendingOutboxItems()
    let syncedCount = 0

    for (const item of pendingItems) {
      try {
        await postInspection(item.payload)
        await markOutboxItemSynced(item.clientId)
        syncedCount += 1
      } catch {
        break
      }
    }

    return { synced: syncedCount }
  } finally {
    syncing = false
  }
}

export function setupOfflineSync() {
  if (listenersBound) {
    return
  }

  listenersBound = true

  window.addEventListener('online', () => {
    void flushInspectionOutbox()
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void flushInspectionOutbox()
    }
  })
}
