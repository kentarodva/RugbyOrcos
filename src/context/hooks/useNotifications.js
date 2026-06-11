import { useState, useEffect, useCallback } from 'react';
import { initPushNotifications } from '../../utils/pushNotifications';

let LocalNotifications = null;

export function useNotifications() {
  const [ready, setReady] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  useEffect(() => {
    const init = async () => {
      let localOk = false;
      try {
        const mod = await import('@capacitor/local-notifications');
        LocalNotifications = mod.LocalNotifications;
        await LocalNotifications.requestPermissions();
        localOk = true;
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[Notif] Capacitor LocalNotifications no soportado:', err.message);
      }
      const pushOk = await initPushNotifications();
      setPushSupported(pushOk);
      if (!localOk && !pushOk && 'Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
      setReady(true);
    };
    init();
  }, []);

  const sendLocalNotification = useCallback(async (title, body) => {
    try {
      if (LocalNotifications) {
        await LocalNotifications.schedule({
          notifications: [{
            title,
            body,
            id: Date.now() + Math.floor(Math.random() * 1000),
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'default',
            attachments: null,
            actionTypeId: '',
            extra: null,
          }],
        });
      } else if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/assets/orcos_logo.png' });
      }
    } catch (err) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/assets/orcos_logo.png' });
      }
    }
  }, []);

  const scheduleReminder = useCallback(async (eventTitle, eventTime, eventLocation, remindDate, eventId) => {
    if (remindDate <= new Date() || !LocalNotifications) return;
    try {
      const notifId = Date.now() + Math.floor(Math.random() * 1000);
      await LocalNotifications.schedule({
        notifications: [{
          title: `⚡ ${eventTitle}`,
          body: `Empieza en 1 hora a las ${eventTime} en ${eventLocation || ''}`,
          id: notifId,
          schedule: { at: remindDate },
          sound: 'default',
          extra: { type: 'reminder', eventId },
        }],
      });
    } catch { /* notificaciones no soportadas */ }
  }, []);

  return { sendLocalNotification, scheduleReminder, ready, pushSupported };
}
