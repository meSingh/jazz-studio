/**
 * My makes: photos of finished things, kept on this device.
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
}

const DB = 'jazz-studio';
const STORE = 'makes';

function open (): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore(STORE, { keyPath: 'id' }); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T> (mode: IDBTransactionMode, work: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = work(tx.objectStore(STORE));
    tx.oncomplete = () => { db.close(); resolve(req.result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

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
