import type { Kept } from './prints';

/**
 * My makes: photos of finished things, and prints to use again, kept on this device.
 *
 * IndexedDB rather than localStorage because photos are big. They are shrunk
 * before saving, since a phone camera's twelve megapixels are not needed to
 * remember a pencil pot, and a few hundred of them should not fill the disc.
 */

export interface Make {
  id: string;
  title: string;
  note: string;
  made: number;
  photo: Blob | null;
  /** A print she kept to use again: its settings, not a picture of it (see prints.ts). */
  print?: Kept;
}

const DB = 'jazz-studio';
const STORE = 'makes';
/** Characters a family added themselves. Version 2 of the database added it. */
const CHARACTERS = 'characters';

function open (): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 2);
    // Each store only if it is missing, so a version 1 database keeps its makes.
    req.onupgradeneeded = () => {
      for (const name of [STORE, CHARACTERS]) {
        if (!req.result.objectStoreNames.contains(name)) req.result.createObjectStore(name, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function run<T> (mode: IDBTransactionMode, work: (s: IDBObjectStore) => IDBRequest<T>, store = STORE): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = work(tx.objectStore(store));
    tx.oncomplete = () => { db.close(); resolve(req.result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export { CHARACTERS };

export async function all (): Promise<Make[]> {
  const list = await run('readonly', (s) => s.getAll() as IDBRequest<Make[]>);
  return list.sort((a, b) => b.made - a.made);
}

export const save = (make: Make): Promise<IDBValidKey> => run('readwrite', (s) => s.put(make));
export const remove = (id: string): Promise<undefined> => run('readwrite', (s) => s.delete(id));

/** Shrinks a photo to at most `edge` pixels on its long side, as a JPEG. */
export async function shrink (file: File, edge = 1400): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not read that photo'))), 'image/jpeg', 0.85));
}
