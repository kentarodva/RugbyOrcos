import { useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { handleError } from '../utils/errorHandler';
import { saveLocal4kPhoto, deleteLocal4kPhoto, createCloudThumbnail } from '../utils/localPhotoStorage';

export function usePlayerAvatar(player, updatePlayer) {
  const [uploading, setUploading] = useState(false);

  const avatarId = player?.avatar_id || null;
  const photoUrl = player?.photo_url || null;

  const setAvatar = async (newAvatarId) => {
    await updatePlayer({
      ...player,
      avatar_id: newAvatarId || null,
      photo_url: null,
    });
  };

  const setPhoto = async (file) => {
    if (!file || !player?.id) return;
    setUploading(true);
    try {
      // 1. Guardar copia maestra en resolución original/4K en IndexedDB local
      await saveLocal4kPhoto(player.id, file);

      // 2. Generar miniatura optimizada para la nube
      let finalPhotoUrl = null;
      try {
        finalPhotoUrl = await createCloudThumbnail(file, 400, 0.82);
      } catch {
        // Fallback
      }

      // 3. Intento de subida a Supabase Storage (si bucket está activo)
      try {
        const ext = 'webp';
        const filePath = `${player.id}.${ext}`;

        if (photoUrl && photoUrl.includes('player-avatars')) {
          const oldPath = photoUrl.split('/').pop().split('?')[0];
          await supabase.storage.from('player-avatars').remove([oldPath]);
        }

        const { error: uploadError } = await supabase.storage
          .from('player-avatars')
          .upload(filePath, file, { upsert: true, contentType: `image/${ext}` });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('player-avatars')
            .getPublicUrl(filePath);
          finalPhotoUrl = publicUrl + '?t=' + Date.now();
        }
      } catch {
        // Usa la miniatura base64 local en caso de fallo de red/storage
      }

      await updatePlayer({
        ...player,
        avatar_id: null,
        photo_url: finalPhotoUrl || player.photo_url,
      });
    } catch (err) {
      handleError(err, 'usePlayerAvatar.setPhoto', { notifyUser: true });
    } finally {
      setUploading(false);
    }
  };

  const clearPhoto = async () => {
    try {
      await deleteLocal4kPhoto(player?.id);
      if (photoUrl && photoUrl.includes('player-avatars')) {
        const urlParts = photoUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = fileName.split('?')[0];
        if (filePath) {
          await supabase.storage.from('player-avatars').remove([filePath]);
        }
      }
      await updatePlayer({
        ...player,
        photo_url: null,
      });
    } catch (err) {
      handleError(err, 'usePlayerAvatar.clearPhoto', { notifyUser: true });
    }
  };

  return { avatarId, photoUrl, uploading, setAvatar, setPhoto, clearPhoto };
}
