const DB_NAME = 'bubbleverse_vault_v1';
const STORE_NAME = 'photos';
const DB_VERSION = 1;

function openVaultDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open photo vault'));
  });
}

export async function savePhotoToVault(id: string, dataUrl: string): Promise<string> {
  try {
    const db = await openVaultDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(dataUrl, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return id;
  } catch {
    // Graceful fallback if IndexedDB is blocked in private mode
    try {
      sessionStorage.setItem(`bv_photo_${id}`, dataUrl);
    } catch {
      // Ignore storage overflow in fallback
    }
    return id;
  }
}

export async function getPhotoFromVault(id: string): Promise<string | null> {
  if (!id) return null;
  try {
    const db = await openVaultDB();
    const result = await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve((req.result as string | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (result) return result;
  } catch {
    // Fallback below
  }
  try {
    return sessionStorage.getItem(`bv_photo_${id}`);
  } catch {
    return null;
  }
}

export async function deletePhotoFromVault(id: string): Promise<void> {
  try {
    const db = await openVaultDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Ignore
  }
  try {
    sessionStorage.removeItem(`bv_photo_${id}`);
  } catch {
    // Ignore
  }
}
