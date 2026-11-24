/**
 * Ghazal POS - High-Availability Offline IndexedDB Storage Engine
 * Provides persistent, quota-unlimited storage for:
 * 1. Product Catalog (fast barcode/SKU/name lookup)
 * 2. Offline Sales Queue (automatic sync when online)
 * 3. Local Sales History (reprinting & returns)
 * 4. Terminal Preferences & Cached Settings
 */

const DB_NAME = 'ghazal_pos_offline_db';
const DB_VERSION = 1;

export interface OfflineSaleItem {
  id: string; // Unique offline client ID (e.g. OFF-1710000000000-XYZ)
  createdAt: string;
  total: number;
  subtotal: number;
  discount: number;
  taxAmount: number;
  customerName: string;
  customerPhone?: string | null;
  paymentMethod: string;
  cashierName: string;
  items: Array<{
    variantId: string;
    productName: string;
    variantSize?: string;
    barcode?: string | null;
    sku: string;
    price: number;
    quantity: number;
    costPrice?: number;
  }>;
  payload: any; // Complete checkout payload for processPOSCheckout
  receiptData: any; // Formatted data for instant thermal printing
  syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  retryCount: number;
  lastError?: string;
}

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase | null> | null = null;

/**
 * Initializes or returns the open IndexedDB instance.
 * Gracefully returns null if IndexedDB is unavailable (e.g. private mode in older browsers).
 */
export async function getPOSDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return null;
  }

  if (dbInstance) {
    return dbInstance;
  }

  if (dbInitPromise) {
    return dbInitPromise;
  }

  dbInitPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Catalog Store
        if (!db.objectStoreNames.contains('catalog')) {
          const catalogStore = db.createObjectStore('catalog', { keyPath: 'id' });
          catalogStore.createIndex('sku', 'sku', { unique: false });
        }

        // 2. Offline Sales Queue Store
        if (!db.objectStoreNames.contains('offline_queue')) {
          const queueStore = db.createObjectStore('offline_queue', { keyPath: 'id' });
          queueStore.createIndex('createdAt', 'createdAt', { unique: false });
          queueStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        }

        // 3. Sales History Store
        if (!db.objectStoreNames.contains('sales_history')) {
          const historyStore = db.createObjectStore('sales_history', { keyPath: 'id' });
          historyStore.createIndex('createdAt', 'createdAt', { unique: false });
          historyStore.createIndex('reference', 'reference', { unique: false });
        }

        // 4. Terminal Settings Store
        if (!db.objectStoreNames.contains('terminal_settings')) {
          db.createObjectStore('terminal_settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        dbInstance = (event.target as IDBOpenDBRequest).result;
        resolve(dbInstance);
      };

      request.onerror = (event) => {
        console.warn('POS IndexedDB open failed, falling back to localStorage:', (event.target as any)?.error);
        resolve(null);
      };

      request.onblocked = () => {
        console.warn('POS IndexedDB open blocked by existing connection');
        resolve(null);
      };
    } catch (err) {
      console.warn('IndexedDB exception, falling back to localStorage:', err);
      resolve(null);
    }
  });

  return dbInitPromise;
}

// -------------------------------------------------------------
// 1. CATALOG STORAGE (Products, Barcodes, Quick Codes)
// -------------------------------------------------------------

export async function storeCatalogOffline(products: any[]): Promise<boolean> {
  if (!Array.isArray(products) || products.length === 0) return false;

  // Always keep localStorage updated as fallback (with truncated or lightweight backup if quota permits)
  try {
    localStorage.setItem('ghazal_pos_cached_catalog', JSON.stringify(products));
  } catch (e) {
    // If quota exceeded in localStorage, IndexedDB will still save the full catalog!
    console.warn('LocalStorage quota exceeded for catalog, IndexedDB handles storage.');
  }

  const db = await getPOSDatabase();
  if (!db) return true;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction('catalog', 'readwrite');
      const store = tx.objectStore('catalog');
      store.clear();

      for (const item of products) {
        store.put(item);
      }

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (err) {
      console.error('Error saving catalog to IndexedDB:', err);
      resolve(false);
    }
  });
}

export async function getOfflineCatalog(): Promise<any[]> {
  const db = await getPOSDatabase();
  if (db) {
    try {
      const tx = db.transaction('catalog', 'readonly');
      const store = tx.objectStore('catalog');
      const request = store.getAll();

      const items = await new Promise<any[]>((resolve) => {
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      });

      if (items && items.length > 0) {
        return items;
      }
    } catch (e) {
      console.warn('Failed to read catalog from IndexedDB, trying localStorage');
    }
  }

  // Fallback to localStorage
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ghazal_pos_cached_catalog');
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch {}

  return [];
}

// -------------------------------------------------------------
// 2. OFFLINE SALES QUEUE (Zero-Loss Resilience)
// -------------------------------------------------------------

export async function enqueueOfflineSale(sale: OfflineSaleItem): Promise<boolean> {
  // 1. Backup to localStorage
  try {
    const queue = JSON.parse(localStorage.getItem('ghazal_pos_offline_queue') || '[]');
    queue.push(sale);
    localStorage.setItem('ghazal_pos_offline_queue', JSON.stringify(queue));
  } catch (e) {
    console.warn('LocalStorage queue write failed (probably quota), relying on IndexedDB');
  }

  // 2. Primary write to IndexedDB
  const db = await getPOSDatabase();
  if (!db) return true;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction('offline_queue', 'readwrite');
      const store = tx.objectStore('offline_queue');
      store.put(sale);

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (err) {
      console.error('Error enqueuing offline sale to IndexedDB:', err);
      resolve(false);
    }
  });
}

export async function getOfflineQueue(): Promise<OfflineSaleItem[]> {
  const db = await getPOSDatabase();
  if (db) {
    try {
      const tx = db.transaction('offline_queue', 'readonly');
      const store = tx.objectStore('offline_queue');
      const request = store.getAll();

      const items = await new Promise<OfflineSaleItem[]>((resolve) => {
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      });

      if (items && items.length > 0) {
        return items;
      }
    } catch (e) {
      console.warn('Failed to read offline queue from IndexedDB');
    }
  }

  // Fallback to localStorage
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ghazal_pos_offline_queue');
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch {}

  return [];
}

export async function removeOfflineSale(id: string): Promise<boolean> {
  // Remove from localStorage
  try {
    const queue = JSON.parse(localStorage.getItem('ghazal_pos_offline_queue') || '[]');
    const filtered = queue.filter((item: any) => item.id !== id);
    localStorage.setItem('ghazal_pos_offline_queue', JSON.stringify(filtered));
  } catch {}

  const db = await getPOSDatabase();
  if (!db) return true;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction('offline_queue', 'readwrite');
      const store = tx.objectStore('offline_queue');
      store.delete(id);

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (err) {
      console.error('Error removing offline sale from IndexedDB:', err);
      resolve(false);
    }
  });
}

export async function updateOfflineSaleStatus(
  id: string,
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED',
  lastError?: string
): Promise<void> {
  // 1. Sync to localStorage queue backup
  try {
    if (typeof window !== 'undefined') {
      const queue = JSON.parse(localStorage.getItem('ghazal_pos_offline_queue') || '[]');
      const item = queue.find((q: any) => q.id === id);
      if (item) {
        item.syncStatus = status;
        if (status === 'FAILED') {
          item.retryCount = (item.retryCount || 0) + 1;
          item.lastError = lastError;
        }
        localStorage.setItem('ghazal_pos_offline_queue', JSON.stringify(queue));
      }
    }
  } catch (e) {}

  const db = await getPOSDatabase();
  if (!db) return;

  try {
    const tx = db.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item: OfflineSaleItem = getReq.result;
      if (item) {
        item.syncStatus = status;
        if (status === 'FAILED') {
          item.retryCount = (item.retryCount || 0) + 1;
          item.lastError = lastError;
        }
        store.put(item);
      }
    };
  } catch (e) {
    console.error('Error updating offline sale status:', e);
  }
}

// -------------------------------------------------------------
// 3. SALES HISTORY STORAGE (For reprints & returns offline)
// -------------------------------------------------------------

export async function addSaleToLocalHistory(sale: any): Promise<boolean> {
  // Fallback / sync to localStorage
  try {
    const stored = JSON.parse(localStorage.getItem('ghazal_pos_sales_history') || '[]');
    const filtered = stored.filter((s: any) => s.id !== sale.id);
    filtered.unshift(sale);
    localStorage.setItem('ghazal_pos_sales_history', JSON.stringify(filtered.slice(0, 100)));
  } catch {}

  const db = await getPOSDatabase();
  if (!db) return true;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction('sales_history', 'readwrite');
      const store = tx.objectStore('sales_history');
      store.put(sale);

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function getLocalSalesHistory(): Promise<any[]> {
  const db = await getPOSDatabase();
  if (db) {
    try {
      const tx = db.transaction('sales_history', 'readonly');
      const store = tx.objectStore('sales_history');
      const request = store.getAll();

      const items = await new Promise<any[]>((resolve) => {
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      });

      if (items && items.length > 0) {
        // Return sorted newest first
        return items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      }
    } catch (e) {
      console.warn('Failed to read sales history from IndexedDB');
    }
  }

  // Fallback to localStorage
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ghazal_pos_sales_history');
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch {}

  return [];
}
