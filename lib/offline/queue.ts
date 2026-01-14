import { openDB, IDBPDatabase } from 'idb';

interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  synced: boolean;
}

let db: IDBPDatabase | null = null;

export async function getDB() {
  if (!db) {
    db = await openDB('grocery-app', 1, {
      upgrade(db) {
        const queueStore = db.createObjectStore('offlineQueue', {
          keyPath: 'id',
        });
        queueStore.createIndex('by-synced', 'synced');

        db.createObjectStore('groceryItems', { keyPath: 'id' });
      },
    });
  }
  return db;
}

export async function addToQueue(action: Omit<OfflineAction, 'id' | 'synced'>) {
  const database = await getDB();
  const id = `${action.type}-${Date.now()}-${Math.random()}`;
  await database.add('offlineQueue', {
    id,
    ...action,
    synced: false,
  });
  return id;
}

export async function getPendingActions(): Promise<OfflineAction[]> {
  const database = await getDB();
  const tx = database.transaction('offlineQueue', 'readonly');
  const store = tx.objectStore('offlineQueue');
  const index = store.index('by-synced');
  const all = await index.getAll(IDBKeyRange.only(false));
  await tx.done;
  return all;
}

export async function markAsSynced(id: string) {
  const database = await getDB();
  const action = await database.get('offlineQueue', id);
  if (action) {
    await database.put('offlineQueue', { ...action, synced: true });
  }
}

export async function clearSyncedActions() {
  const database = await getDB();
  const tx = database.transaction('offlineQueue', 'readwrite');
  const store = tx.objectStore('offlineQueue');
  const index = store.index('by-synced');
  
  let cursor = await index.openCursor(IDBKeyRange.only(true));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}
