import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient.js';
import { fetchEventRsvps } from '../../services/dataService.js';
import { useDataListener } from '../../context/hooks/useDataListener.js';
import { localDateKey } from '../../utils/agendaItems';
import { fixtureIdOf, rsvpFromAvailabilities } from '../../utils/attendanceSources';

export function useTribunalState(teamPlayers, teamEvents, recordAttendance, recordMatchInfractions, redeemPenalty, showToast) {
  const [activeSubTab, setActiveSubTab] = useState('control');

  const [selectedEventId, setSelectedEventId] = useState('');
  const [attendanceState, setAttendanceState] = useState({});
  const [rsvpMap, setRsvpMap] = useState({});

  const [matchDate, setMatchDate] = useState(() => localDateKey());
  const [selectedPlayerForInf, setSelectedPlayerForInf] = useState('');
  const [infPenales, setInfPenales] = useState(0);
  const [infAmarillas, setInfAmarillas] = useState(0);
  const [infRojas, setInfRojas] = useState(0);
  const [infBurpeesExtra, setInfBurpeesExtra] = useState(0);
  const [infCustomExercise, setInfCustomExercise] = useState('');
  const [infCustomReps, setInfCustomReps] = useState(0);
  const [infFaultType, setInfFaultType] = useState('');
  const [infContext, setInfContext] = useState('partido');
  const [infNotes, setInfNotes] = useState('');

  // Partido programado: lo avisado está en su disponibilidad (y se actualiza en vivo con el partido).
  const selectedFixtureId = fixtureIdOf(selectedEventId);
  const selectedFixtureAvail = selectedFixtureId
    ? teamEvents.find(e => e.id === selectedEventId)?.availabilities
    : null;
  useEffect(() => {
    if (selectedFixtureId) setRsvpMap(rsvpFromAvailabilities(selectedFixtureAvail));
  }, [selectedFixtureId, selectedFixtureAvail]);

  useEffect(() => {
    if (!selectedEventId) { setRsvpMap({}); return; }
    if (fixtureIdOf(selectedEventId)) return;
    let cancelled = false;
    fetchEventRsvps(selectedEventId).then((data) => {
      if (cancelled) return;
      const map = {};
      (data || []).forEach(r => { map[r.player_id] = r.status; });
      setRsvpMap(map);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [selectedEventId]);

  const selectedEventRef = useRef(selectedEventId);
  selectedEventRef.current = selectedEventId;
  useDataListener('event_rsvp', () => {
    const eventId = selectedEventRef.current;
    if (!eventId || fixtureIdOf(eventId)) return;
    fetchEventRsvps(eventId).then((data) => {
      const map = {};
      (data || []).forEach(r => { map[r.player_id] = r.status; });
      setRsvpMap(map);
    }).catch(() => {});
  });

  const handleEventChange = useCallback((eventId) => {
    setSelectedEventId(eventId);
    setAttendanceState({});
  }, []);

  const handleAttendanceChange = useCallback((playerId, status) => {
    setAttendanceState(prev => ({
      ...prev,
      [playerId]: status
    }));
  }, []);

  const onMarkConfirmedPresent = useCallback(() => {
    setAttendanceState(prev => {
      const next = { ...prev };
      teamPlayers.forEach(p => {
        if (rsvpMap[p.id] === 'going') {
          if (!next[p.id]) next[p.id] = 'presente';
        }
      });
      return next;
    });
  }, [teamPlayers, rsvpMap]);

  const handleSaveAttendance = useCallback(async (e) => {
    e.preventDefault();
    const list = {};
    let unmarkedCount = 0;
    teamPlayers.forEach(p => {
      if (attendanceState[p.id]) {
        list[p.id] = attendanceState[p.id];
      } else {
        unmarkedCount++;
      }
    });
    if (Object.keys(list).length === 0) {
      showToast('Selecciona al menos un jugador para registrar asistencia.', 'warning');
      return;
    }

    const fixtureId = fixtureIdOf(selectedEventId);
    const eventId = fixtureId ? null : (selectedEventId || null);
    if (selectedEventId) {
      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq(fixtureId ? 'fixture_id' : 'event_id', fixtureId || eventId)
        .limit(1);
      if (existing?.length > 0) {
        const overwrite = window.confirm('Ya hay asistencia registrada para este evento. ¿Deseas sobrescribir?');
        if (!overwrite) return;
      }
    }

    const selectedEvent = teamEvents.find(e => e.id === selectedEventId);
    const eventDate = selectedEvent?.date || localDateKey();
    const success = await recordAttendance(eventDate, list, eventId, fixtureId);
    if (!success) return;
    if (unmarkedCount > 0) {
      showToast(`Asistencia registrada. ${unmarkedCount} jugador(es) sin marcar fueron omitidos.`, 'info');
    } else {
      showToast('Asistencia registrada con exito. Penitencias aplicadas al Tribunal.', 'success');
    }
    setAttendanceState({});
  }, [teamPlayers, attendanceState, selectedEventId, teamEvents, recordAttendance, showToast]);

  const handleSaveInfraction = useCallback(async (e) => {
    e.preventDefault();
    if (!selectedPlayerForInf) {
      showToast('Por favor selecciona un jugador.', 'warning');
      return;
    }

    let notes = infNotes || '';
    if (infCustomExercise.trim()) {
      const customText = `${infCustomExercise.trim()} x${Number(infCustomReps) || 0}`;
      notes = notes ? `${notes} | ${customText}` : customText;
    }

    const extraBurpees = Number(infBurpeesExtra) || 0;
    const totalPenales = (Number(infPenales) || 0) + (extraBurpees > 0 ? Math.ceil(extraBurpees / 10) : 0);

    const infList = [
      {
        playerId: selectedPlayerForInf,
        penales: totalPenales,
        amarillas: Number(infAmarillas) || 0,
        rojas: Number(infRojas) || 0,
        faultType: infFaultType || null,
        context: infContext,
        notes
      }
    ];

    try {
      await recordMatchInfractions(matchDate, infList);
      showToast('Infracciones registradas en el Tribunal correctivo.', 'success');
      setSelectedPlayerForInf('');
      setInfPenales(0);
      setInfAmarillas(0);
      setInfRojas(0);
      setInfBurpeesExtra(0);
      setInfCustomExercise('');
      setInfCustomReps(0);
      setInfFaultType('');
      setInfContext('partido');
      setInfNotes('');
    } catch (err) {
      showToast('Error al registrar infracciones: ' + (err?.message || 'Intentalo de nuevo.'), 'error');
    }
  }, [selectedPlayerForInf, infPenales, infAmarillas, infRojas, infBurpeesExtra, infCustomExercise, infCustomReps, infFaultType, infContext, infNotes, matchDate, recordMatchInfractions, showToast]);

  const handleShareBlacklistWhatsApp = useCallback(() => {
    const penalizedPlayers = teamPlayers.filter(p =>
      p.penalties.burpees > 0 || p.penalties.cones
    );
    if (penalizedPlayers.length === 0) return;

    let text = `TRIBUNAL RUGBY ORCOS - LA LISTA NEGRA\n`;
    text += `Atencion Clan, el tribunal exige redencion fisica en el proximo entrenamiento. Aqui los guerreros con cuentas pendientes:\n\n`;

    penalizedPlayers.forEach(p => {
      let debts = [];
      if (p.penalties.burpees > 0) debts.push(`${p.penalties.burpees} Burpees`);
      if (p.penalties.cones) debts.push('Recoger Conos (Servicios)');

      text += `*${p.name}* ("${p.apodo}"): ${debts.join(' y ')}\n`;
    });

    text += `\nA sudar y pagar por el clan! Ningun Orco se queda atras. #RugbyOrcos`;

    navigator.clipboard.writeText(text);
    showToast('Lista negra copiada al portapapeles. Abriendo WhatsApp...', 'success');
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }, [teamPlayers, showToast]);

  const penalizedPlayers = teamPlayers.filter(p =>
    p.penalties.burpees > 0 || p.penalties.cones
  );

  const honorOrcs = [...teamPlayers]
    .map(p => {
      const attRate = p.attendance.total > 0 ? (p.attendance.present / p.attendance.total) * 100 : 0;
      return { ...p, attRate: Math.round(attRate) };
    })
    .sort((a, b) => b.attRate - a.attRate || b.attendance.present - a.attendance.present)
    .slice(0, 5);

  const mvpLeaders = [...teamPlayers]
    .map(p => {
      const mvps = (p.matchStats || []).filter(s => s.mvp).length;
      return { ...p, mvps };
    })
    .filter(p => p.mvps > 0)
    .sort((a, b) => b.mvps - a.mvps)
    .slice(0, 5);

  const tryLeaders = [...teamPlayers]
    .map(p => {
      const totalTries = (p.matchStats || []).reduce((sum, s) => sum + (s.tries || 0), 0);
      return { ...p, totalTries };
    })
    .filter(p => p.totalTries > 0)
    .sort((a, b) => b.totalTries - a.totalTries)
    .slice(0, 5);

  const tackleLeaders = [...teamPlayers]
    .map(p => {
      const totalTackles = (p.matchStats || []).reduce((sum, s) => sum + (s.tackles || 0), 0);
      return { ...p, totalTackles };
    })
    .filter(p => p.totalTackles > 0)
    .sort((a, b) => b.totalTackles - a.totalTackles)
    .slice(0, 5);

  const dungeonOrcs = [...teamPlayers]
    .filter(p => p.penalties.burpees > 0 || p.penalties.cones)
    .sort((a, b) => b.penalties.burpees - a.penalties.burpees)
    .slice(0, 5);

  return {
    activeSubTab, setActiveSubTab,
    selectedEventId, handleEventChange,
    attendanceState, rsvpMap, onMarkConfirmedPresent,
    matchDate, setMatchDate,
    selectedPlayerForInf, setSelectedPlayerForInf,
    infPenales, setInfPenales,
    infAmarillas, setInfAmarillas,
    infRojas, setInfRojas,
    infBurpeesExtra, setInfBurpeesExtra,
    infCustomExercise, setInfCustomExercise,
    infCustomReps, setInfCustomReps,
    infFaultType, setInfFaultType,
    infContext, setInfContext,
    infNotes, setInfNotes,
    penalizedPlayers,
    honorOrcs, mvpLeaders, tryLeaders, tackleLeaders, dungeonOrcs,
    handleAttendanceChange,
    handleSaveAttendance,
    handleSaveInfraction,
    handleShareBlacklistWhatsApp,
    redeemPenalty,
  };
}
