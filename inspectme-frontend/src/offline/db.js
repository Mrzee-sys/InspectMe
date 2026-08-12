import { openDB } from 'idb'

const DB_NAME = 'inspectme-offline-db'
const DB_VERSION = 1
const OUTBOX_STORE = 'inspectionOutbox'

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
      const store = db.createObjectStore(OUTBOX_STORE, { keyPath: 'clientId' })
      store.createIndex('status', 'status')
      store.createIndex('createdAt', 'createdAt')
    }
  },
})

export async function putOutboxItem(item) {
  const db = await dbPromise
  await db.put(OUTBOX_STORE, item)
}

export async function getPendingOutboxItems() {
  const db = await dbPromise
  const allItems = await db.getAll(OUTBOX_STORE)

  return allItems
    .filter((item) => item.status === 'pending')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
}

export async function markOutboxItemSynced(clientId) {
  const db = await dbPromise
  const existing = await db.get(OUTBOX_STORE, clientId)

  if (!existing) {
    return
  }

  await db.put(OUTBOX_STORE, {
    ...existing,
    status: 'synced',
    syncedAt: new Date().toISOString(),
  })
}
