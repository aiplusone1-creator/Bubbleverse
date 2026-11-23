import type { StudioBook } from './bookProduction';

const databaseName = 'bubbleverse_book_production';
const storeName = 'books';

function openBooks(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function readProducedBook(id: string): Promise<StudioBook | null> {
  const db = await openBooks();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(storeName, 'readonly').objectStore(storeName).get(id);
      request.onsuccess = () => resolve((request.result as StudioBook | undefined) ?? null);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function saveProducedBook(book: StudioBook, previous?: StudioBook): Promise<void> {
  const db = await openBooks();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const existing = store.get(book.id);
      let conflicted = false;
      existing.onsuccess = () => {
        const stored = existing.result as StudioBook | undefined;
        conflicted = previous
          ? !stored || stored.revision !== previous.revision || stored.approvedRevision !== previous.approvedRevision
          : Boolean(stored);
        if (conflicted) tx.abort();
        else store.put(book);
      };
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(conflicted ? new Error('BOOK_CHANGED') : tx.error);
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
