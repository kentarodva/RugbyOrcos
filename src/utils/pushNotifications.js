import { handleError } from './errorHandler';
import { supabase } from '../supabaseClient';

let PushNotifications = null;
let LocalNotifications = null;

export async function initPushNotifications() {
  try {
    const pushMod = await import('@capacitor/push-notifications');
    PushNotifications = pushMod.PushNotifications;

    const localMod = await import('@capacitor/local-notifications');
    LocalNotifications = localMod.LocalNotifications;

    await registerPush();
    return true;
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[Push] No soportado en este entorno:', err.message);
    return false;
  }
}

async function registerPush() {
  try {
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== 'granted') return;

    await PushNotifications.register();

    PushNotifications.addListener('registration', async (token) => {
      localStorage.setItem('orcos_push_token', token.value);
      if (import.meta.env.DEV) console.log('[Push] Token registrado:', token.value);
      await saveTokenToSupabase(token.value);
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

async function saveTokenToSupabase(token) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: player } = await supabase
      .from('players')
      .select('id, team_category, makgora_team_id, position')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!player) return;

    await supabase.from('push_tokens').upsert({
      token,
      player_id: player.id,
      user_id: user.id,
      team_category: player.team_category,
      makgora_team_id: player.makgora_team_id,
      position: player.position,
    }, { onConflict: 'token' });
  } catch (err) {
    handleError(err, 'pushNotifications.saveToken', { silent: true });
  }
}

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

export function getPushToken() {
  return localStorage.getItem('orcos_push_token');
}

export function addPushNavigateListener(handler) {
  const wrapped = (e) => handler(e.detail);
  window.addEventListener('orcos:navigate', wrapped);
  return () => window.removeEventListener('orcos:navigate', wrapped);
}
