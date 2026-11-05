import { describe, it, expect } from 'vitest';
import {
  saveLocal4kPhoto,
  getLocal4kPhoto,
  deleteLocal4kPhoto,
  createCloudThumbnail
} from '../../utils/localPhotoStorage';

describe('localPhotoStorage', () => {
  it('guarda y recupera foto 4K de forma segura', async () => {
    const fakeBlob = new Blob(['fake 4k image data'], { type: 'image/png' });
    const saved = await saveLocal4kPhoto('orc-001', fakeBlob);
    if (typeof indexedDB !== 'undefined') {
      expect(typeof saved).toBe('boolean');
      const retrieved = await getLocal4kPhoto('orc-001');
      if (saved) {
        expect(retrieved).not.toBeNull();
      }
    } else {
      expect(saved).toBe(false);
    }
  });

  it('maneja eliminación sin arrojar errores', async () => {
    const deleted = await deleteLocal4kPhoto('orc-001');
    expect(typeof deleted).toBe('boolean');
  });

  it('retorna null para IDs inexistentes o nulos', async () => {
    const res = await getLocal4kPhoto(null);
    expect(res).toBeNull();
    const res2 = await saveLocal4kPhoto(null, null);
    expect(res2).toBe(false);
  });

  it('createCloudThumbnail procesa imagen cuando Image onload está disponible', async () => {
    // Mock de Image para happy-dom
    const originalImage = global.Image;
    global.Image = class {
      constructor() {
        this.width = 800;
        this.height = 600;
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 10);
      }
    };

    const fakeBlob = new Blob(['test image'], { type: 'image/jpeg' });
    const thumb = await createCloudThumbnail(fakeBlob, 200, 0.8);
    expect(typeof thumb).toBe('string');

    global.Image = originalImage;
  });
});
