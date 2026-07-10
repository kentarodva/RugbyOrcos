import { useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { handleError } from '../utils/errorHandler';

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
      const ext = 'webp';
      const filePath = `${player.id}.${ext}`;

      if (photoUrl) {
        const oldPath = photoUrl.split('/').pop().split('?')[0];
        await supabase.storage.from('player-avatars').remove([oldPath]);
      }

      const { error: uploadError } = await supabase.storage
        .from('player-avatars')
        .upload(filePath, file, { upsert: true, contentType: `image/${ext}` });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('player-avatars')
        .getPublicUrl(filePath);

      const bustedUrl = publicUrl + '?t=' + Date.now();

      await updatePlayer({
        ...player,
        avatar_id: null,
        photo_url: bustedUrl,
      });
    } catch (err) {
      handleError(err, 'usePlayerAvatar.setPhoto', { notifyUser: true });
    } finally {
      setUploading(false);
    }
  };

  const clearPhoto = async () => {
    try {
      if (photoUrl) {
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
