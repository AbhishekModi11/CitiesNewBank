const DB_NAME = 'citipay-offline'
const STORE = 'paymentQueue'
const VERSION = 1

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'idempotencyKey' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function enqueueOfflinePayment(entry) {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).put(entry)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  })
}

export async function listOfflinePayments() {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readonly')
  const request = tx.objectStore(STORE).getAll()
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

export async function removeOfflinePayment(idempotencyKey) {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).delete(idempotencyKey)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  })
}

export async function flushOfflinePayments(send) {
  const entries = await listOfflinePayments()
  const sorted = [...entries].sort((a, b) => a.createdAt - b.createdAt)
  for (const entry of sorted) {
    await send(entry)
    await removeOfflinePayment(entry.idempotencyKey)
  }
  return sorted.length
}

export { enqueueOfflinePayment as enqueueOffline, listOfflinePayments as listOffline, removeOfflinePayment as removeOffline, flushOfflinePayments as flushOffline, enqueueOfflinePayment as enqueue, flushOfflinePayments as flush }
