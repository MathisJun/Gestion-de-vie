import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  synced: boolean;
}

interface GroceryDB extends DBSchema {
  offlineQueue: {
    key: string;
    value: OfflineAction;
    indexes: { synced: boolean };
  };
  groceryItems: {
    key: string;
    value: any;
  };
}

let db: IDBPDatabase<GroceryDB> | null = null;

export async function getDB() {
  if (!db) {
    db = await openDB<GroceryDB>('grocery-app', 1, {
      upgrade(db) {
        const queueStore = db.createObjectStore('offlineQueue', {
          keyPath: 'id',
        });
        queueStore.createIndex('synced', 'synced');

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

export async function getPendingActions() {
  const database = await getDB();
  return database.getAllFromIndex('offlineQueue', 'synced', false);
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
  const index = store.index('synced');
  
  let cursor = await index.openCursor(true);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}
