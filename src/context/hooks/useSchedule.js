import { useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient.js';
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

  const addScheduleEvent = useCallback(async (event) => {
    const events = [];
    const baseEvent = {
      title: sanitize(event.title), location: sanitize(event.location),
      time: event.time, mapsLink: sanitize(event.mapsLink || ''),
      type: event.type || 'entrenamiento', teamCategory: event.teamCategory || activeTeam
    };
    const recurrence = event.recurrence || 'none';
    const recurrenceGroup = recurrence !== 'none' ? (event.recurrenceGroup || generateId()) : null;

    if (recurrence === 'custom' && event.recurrenceDays?.length > 0) {
      const startDate = new Date(event.date + 'T00:00:00');
      const weeks = event.recurrenceWeeks || 4;
      const seen = new Set();
      for (let w = 0; w < weeks; w++) {
        for (const dayNum of event.recurrenceDays) {
          const target = new Date(startDate);
          target.setDate(startDate.getDate() + (w * 7));
          const currentDay = target.getDay();
          const targetDay = dayNum === 7 ? 0 : dayNum;
          const diff = (targetDay - currentDay + 7) % 7;
          target.setDate(target.getDate() + diff);
          if (target >= startDate) {
            const dateStr = target.toISOString().split('T')[0];
            if (!seen.has(dateStr)) {
              seen.add(dateStr);
              events.push({
                ...baseEvent, id: generateId(), date: dateStr,
                linkedRoutine: event.linkedRoutine || null,
                recurrence: 'custom',
                recurrenceDays: event.recurrenceDays,
                recurrenceWeeks: weeks,
                recurrenceGroup
              });
            }
          }
        }
      }
    } else {
      const weeks = recurrence === 'semanal' ? 4 : recurrence === 'quincenal' ? 2 : 1;
      for (let i = 0; i < weeks; i++) {
        const eventDate = new Date(event.date + 'T00:00:00');
        const daysToAdd = recurrence === 'quincenal' ? i * 14 : i * 7;
        eventDate.setDate(eventDate.getDate() + daysToAdd);
        const newEvent = {
          ...baseEvent, id: generateId(), date: eventDate.toISOString().split('T')[0],
          linkedRoutine: event.linkedRoutine || null,
          recurrenceGroup
        };
        events.push(newEvent);
      }
    }
    const created = events.filter(e => !schedule.some(s => s.date === e.date && s.time === e.time && s.teamCategory === e.teamCategory));
    setSchedule(prev => [...prev, ...created]);
    created.forEach(e => {
      supabase.from('schedule_events').upsert({
        id: e.id, title: e.title, date: e.date, time: e.time, location: e.location,
        maps_link: e.mapsLink, type: e.type, team_category: e.teamCategory,
        linked_routine: e.linkedRoutine, recurrence_group: e.recurrenceGroup,
        user_id: user?.id, context: 'general'
      }).then(({ error }) => {
        if (error && import.meta.env.DEV) {
          console.warn('[Schedule] Supabase upsert error:', error.message);
        }
      }, (err) => {
        if (import.meta.env.DEV) {
          console.warn('[Schedule] Supabase upsert failed:', err?.message || err);
        }
      });
    });
    const skipped = events.length - created.length;
    sendLocalNotification('Evento Programado',
      `${created.length} evento(s): ${baseEvent.title} desde ${created[0]?.date || event.date}.${skipped > 0 ? ` (${skipped} ya existian)` : ''}`);

    const eventTime = event.time || '09:00';
    const [h, m] = eventTime.split(':').map(Number);
    const remindDate = new Date(event.date + `T${String(h).padStart(2, '0')}:${String(m||0).padStart(2, '0')}:00`);
    remindDate.setHours(remindDate.getHours() - 1);
    if (remindDate > new Date()) {
      scheduleReminder(baseEvent.title, eventTime, event.location, remindDate, events[0].id);
    }
  }, [activeTeam, sendLocalNotification, scheduleReminder, user]);

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
