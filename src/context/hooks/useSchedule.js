import { useState, useEffect, useCallback } from 'react';
import apisupabase from '../../data/supabaseApi.js';
import { wrapCatch } from '../../utils/errorHandler';
import { formatLocalDate } from '../../utils/dates.js';
import { EQUIPOS_LABELS } from '../constants';

const generateId = (prefix = '') => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return prefix + crypto.randomUUID();
  }
  return prefix + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const sanitize = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(/[<>]/g, '');
};

export function useSchedule(activeTeam, sendLocalNotification, scheduleReminder, pushEntityToSupabase, user) {
  const [schedule, setSchedule] = useState(() => []);

  useEffect(() => {
    localStorage.setItem('orcos_schedule', JSON.stringify(schedule));
  }, [schedule]);

  const addScheduleEvent = useCallback(async (event) => {
    const events = [];
    const baseEvent = {
      title: sanitize(event.title), location: sanitize(event.location),
      time: event.time, mapsLink: sanitize(event.mapsLink || ''),
      type: event.type || 'entrenamiento', teamCategory: activeTeam
    };
    const recurrence = event.recurrence || 'none';
    const weeks = recurrence === 'semanal' ? 4 : recurrence === 'quincenal' ? 2 : 1;
    for (let i = 0; i < weeks; i++) {
      const eventDate = new Date(event.date + 'T00:00:00');
      const daysToAdd = recurrence === 'quincenal' ? i * 14 : i * 7;
      eventDate.setDate(eventDate.getDate() + daysToAdd);
      const newEvent = {
        ...baseEvent, id: generateId('s_'), date: eventDate.toISOString().split('T')[0],
        linkedRoutine: event.linkedRoutine || null,
        recurrenceGroup: recurrence !== 'none' ? event.recurrenceGroup || generateId('rg_') : null
      };
      events.push(newEvent);
    }
    setSchedule(prev => [...prev, ...events]);
    events.forEach(e => pushEntityToSupabase('schedule', e));
    sendLocalNotification('Evento Programado', `${events.length} evento(s): ${baseEvent.title} desde ${events[0].date}.`);

    const eventTime = event.time || '09:00';
    const [h, m] = eventTime.split(':').map(Number);
    const remindDate = new Date(event.date + `T${String(h).padStart(2, '0')}:${String(m||0).padStart(2, '0')}:00`);
    remindDate.setHours(remindDate.getHours() - 1);
    if (remindDate > new Date()) {
      scheduleReminder(baseEvent.title, eventTime, event.location, remindDate, events[0].id);
    }
  }, [activeTeam, sendLocalNotification, scheduleReminder, pushEntityToSupabase]);

  const deleteScheduleEvent = useCallback((id) => {
    setSchedule(prev => prev.filter(e => e.id !== id));
    if (user?.id) {
      apisupabase.deleteEntity('schedule', id).catch(wrapCatch('useSchedule.delete', { silent: true }));
    }
  }, [user?.id]);

  const generateWhatsAppMessage = useCallback((event) => {
    const dateFormatted = formatLocalDate(new Date(event.date + 'T00:00:00'), {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    return '*CONVOCATORIA RUGBY ORCOS*\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      `*Fecha:* ${dateFormatted}\n` +
      `*Hora:* ${event.time} PM\n` +
      `*Lugar:* ${event.location}\n` +
      `*Categoria convocada:* ${EQUIPOS_LABELS[activeTeam]}\n` +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      `*Google Maps:* ${event.mapsLink}\n\n` +
      'Puntualidad de Orco, lleven hidratacion y protector bucal!  #RugbyOrcos';
  }, [activeTeam]);

  return { schedule, setSchedule, addScheduleEvent, deleteScheduleEvent, generateWhatsAppMessage };
}
