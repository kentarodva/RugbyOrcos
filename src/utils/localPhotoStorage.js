// ── Local 4K Photo Storage (IndexedDB) & Cloud Thumbnail Compressor ──
// Almacena fotos maestras en resolución 4K / original de forma 100% local en el dispositivo del jugador
// y genera miniaturas ultraligeras (~25KB) para sincronizar en Supabase.

const DB_NAME = 'RugbyOrcosMedia';
const DB_VERSION = 1;
const STORE_NAME = 'player_photos_4k';

let dbPromise = null;

function getDB() {
  if (dbPromise) return dbPromise;
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

/**
 * Guarda la foto en resolución 4K/original en el almacenamiento local IndexedDB del jugador.
 * @param {string|number} playerId
 * @param {Blob|File} fileBlob
 * @returns {Promise<boolean>}
 */
export async function saveLocal4kPhoto(playerId, fileBlob) {
  if (!playerId || !fileBlob) return false;
  try {
    const db = await getDB();
    if (!db) return false;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(fileBlob, String(playerId));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Error guardando foto 4K local:', err);
    return false;
  }
}

/**
 * Recupera el Blob de la foto 4K local del jugador desde IndexedDB.
 * @param {string|number} playerId
 * @returns {Promise<Blob|null>}
 */
export async function getLocal4kPhoto(playerId) {
  if (!playerId) return null;
  try {
    const db = await getDB();
    if (!db) return null;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(String(playerId));
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error recuperando foto 4K local:', err);
    return null;
  }
}

/**
 * Elimina la foto 4K local de un jugador.
 * @param {string|number} playerId
 * @returns {Promise<boolean>}
 */
export async function deleteLocal4kPhoto(playerId) {
  if (!playerId) return false;
  try {
    const db = await getDB();
    if (!db) return false;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(String(playerId));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Error eliminando foto 4K local:', err);
    return false;
  }
}

/**
 * Convierte un Blob o File de foto a una imagen HTMLImageElement.
 */
function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/**
 * Comprime y recorta la foto a una miniatura cuadrada ligera (400x400) para la nube (Supabase).
 * @param {Blob|File} fileBlob
 * @param {number} size - Tamaño máximo en píxeles (default 400)
 * @param {number} quality - Calidad WebP/JPEG (0.0 a 1.0, default 0.82)
 * @returns {Promise<string>} Data URL comprimida
 */
export async function createCloudThumbnail(fileBlob, size = 400, quality = 0.82) {
  if (!fileBlob) return '';
  const img = await loadImageFromBlob(fileBlob);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Recorte centrado 1:1
  const minDim = Math.min(img.width, img.height);
  const sx = (img.width - minDim) / 2;
  const sy = (img.height - minDim) / 2;

  ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

  // Prefiere WebP si el navegador lo soporta, o JPEG con calidad optimizada
  try {
    const webp = canvas.toDataURL('image/webp', quality);
    if (webp.startsWith('data:image/webp')) return webp;
  } catch {
    // Fallback
  }
  return canvas.toDataURL('image/jpeg', quality);
}
