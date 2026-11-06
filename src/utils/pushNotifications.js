import { handleError } from './errorHandler';
import { supabase } from '../supabaseClient';

let PushNotifications = null;
let LocalNotifications = null;

// ── Capacitor (native) push ──

export async function initPushNotifications() {
  try {
    const pushMod = await import('@capacitor/push-notifications');
    PushNotifications = pushMod.PushNotifications;

    const localMod = await import('@capacitor/local-notifications');
    LocalNotifications = localMod.LocalNotifications;

    await registerCapacitorPush();
    return true;
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[Push] Capacitor no disponible, usando web push:', err.message);
    return false;
  }
}

async function registerCapacitorPush() {
  try {
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== 'granted') return;

    await PushNotifications.register();

    PushNotifications.addListener('registration', async (token) => {
      if (import.meta.env.DEV) console.log('[Push] Token registrado:', token.value);
      await saveTokenToSupabase(token.value, 'capacitor');
    });

    PushNotifications.addListener('registrationError', (err) => {
      handleError(new Error('Push registration error: ' + err.error), 'pushNotifications.register', { silent: true });
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      handleForegroundPush(notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      handleNotificationTap(action.notification.data);
    });
  } catch (err) {
    handleError(err, 'pushNotifications.register', { silent: true });
  }
}

// ── Web Push (browser) ──

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

export async function registerWebPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: false, error: 'Push no soportado en este navegador' };
  }

  try {
    let permission = await Notification.permission;
    if (permission === 'denied') {
      return { success: false, error: 'Permiso denegado. Habilítalo desde la configuración del navegador.' };
    }
    if (permission === 'default') {
      permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return { success: false, error: 'Permiso no concedido' };
      }
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        return { success: false, error: 'VAPID key no configurada' };
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    const subscriptionJson = JSON.stringify(subscription);
    const saved = await saveTokenToSupabase(subscriptionJson, 'web');
    if (saved?.error) return { success: false, error: saved.error };
    return { success: true };
  } catch (err) {
    handleError(err, 'pushNotifications.registerWeb', { notifyUser: true });
    return { success: false, error: err.message };
  }
}

export async function unregisterWebPush() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const json = JSON.stringify(subscription);
      await supabase.from('push_tokens').delete().eq('token', json);
      await subscription.unsubscribe();
    }
  } catch { /* noop */ }
}

export async function getWebPushStatus() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { supported: false, subscribed: false };
    }
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return { supported: true, subscribed: !!subscription };
  } catch {
    return { supported: false, subscribed: false };
  }
}

// ── Token storage ──

async function saveTokenToSupabase(token) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Inicia sesión para activar notificaciones.' };

    const { data: player } = await supabase
      .from('players')
      .select('id, team_category, makgora_team_id, position')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!player) return { error: 'Tu cuenta no está vinculada a una ficha de jugador.' };

    const { error } = await supabase.from('push_tokens').upsert({
      token,
      player_id: player.id,
      user_id: user.id,
      team_category: player.team_category,
      makgora_team_id: player.makgora_team_id,
      position: player.position,
    }, { onConflict: 'token' });
    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    handleError(err, 'pushNotifications.saveToken', { silent: true });
    return { error: err.message };
  }
}

// ── Foreground handling ──

async function handleForegroundPush(notification) {
  const title = notification.title || 'Rugby Orcos';
  const body = notification.body || '';
  try {
    if (LocalNotifications) {
      await LocalNotifications.schedule({
        notifications: [{
          title,
          body,
          id: Date.now() + Math.floor(Math.random() * 1000),
          schedule: { at: new Date(Date.now() + 500) },
          sound: 'default',
          extra: notification.data || null,
        }],
      });
    }
  } catch { /* noop */ }
}

function handleNotificationTap(data) {
  if (!data?.action) return;
  const event = new CustomEvent('orcos:navigate', {
    detail: { tab: data.action, extra: data },
  });
  window.dispatchEvent(event);
}

export function addPushNavigateListener(handler) {
  const wrapped = (e) => handler(e.detail);
  window.addEventListener('orcos:navigate', wrapped);
  return () => window.removeEventListener('orcos:navigate', wrapped);
}
