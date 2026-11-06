import type { ImagePickerAsset } from 'expo-image-picker';

const DB = 'marketplace-photos-v1';
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('photos')) request.result.createObjectStore('photos'); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function get(ref: string): Promise<Blob> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('photos', 'readonly');
    const req = tx.objectStore('photos').get(ref);
    req.onsuccess = () => {
      db.close();
      if (req.result) resolve(req.result as Blob);
      else reject(new Error('Photo missing'));
    };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}
export async function savePhoto(asset: ImagePickerAsset, id: string): Promise<string> {
  const file = asset.file;
  if (!file) throw new Error('Photo missing');
  const db = await database();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('photos', 'readwrite');
    tx.objectStore('photos').put(file, id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
  return id;
}
export async function photoBase64(ref: string): Promise<string> {
  const blob = await get(ref);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
export async function photoPreview(ref: string): Promise<string> { return URL.createObjectURL(await get(ref)); }
export async function deletePhoto(ref: string): Promise<void> {
  const db = await database();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('photos', 'readwrite');
    tx.objectStore('photos').delete(ref);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
