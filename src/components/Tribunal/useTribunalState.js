import { useState, useCallback } from 'react';

export function useTribunalState(teamPlayers, recordAttendance, recordMatchInfractions, redeemPenalty, showToast) {
  const [activeSubTab, setActiveSubTab] = useState('control');

  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceState, setAttendanceState] = useState({});

  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPlayerForInf, setSelectedPlayerForInf] = useState('');
  const [infPenales, setInfPenales] = useState(0);
  const [infAmarillas, setInfAmarillas] = useState(0);
  const [infRojas, setInfRojas] = useState(0);
  const [infFaultType, setInfFaultType] = useState('');
  const [infContext, setInfContext] = useState('partido');
  const [infNotes, setInfNotes] = useState('');

  const handleAttendanceChange = useCallback((playerId, status) => {
    setAttendanceState(prev => ({
      ...prev,
      [playerId]: status
    }));
  }, []);

  const handleSaveAttendance = useCallback((e) => {
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
    recordAttendance(sessionDate, list);
    if (unmarkedCount > 0) {
      showToast(`Asistencia registrada. ${unmarkedCount} jugador(es) sin marcar fueron omitidos.`, 'info');
    } else {
      showToast('Asistencia registrada con exito. Penitencias aplicadas al Tribunal.', 'success');
    }
    setAttendanceState({});
  }, [teamPlayers, attendanceState, sessionDate, recordAttendance, showToast]);

  const handleSaveInfraction = useCallback((e) => {
    e.preventDefault();
    if (!selectedPlayerForInf) {
      showToast('Por favor selecciona un jugador.', 'warning');
      return;
    }

    const infList = [
      {
        playerId: selectedPlayerForInf,
        penales: Number(infPenales),
        amarillas: Number(infAmarillas),
        rojas: Number(infRojas),
        faultType: infFaultType || null,
        context: infContext,
        notes: infNotes
      }
    ];

    recordMatchInfractions(matchDate, infList);
    showToast('Infracciones registradas en el Tribunal correctivo.', 'success');

    setSelectedPlayerForInf('');
    setInfPenales(0);
    setInfAmarillas(0);
    setInfRojas(0);
    setInfFaultType('');
    setInfContext('partido');
    setInfNotes('');
  }, [selectedPlayerForInf, infPenales, infAmarillas, infRojas, infFaultType, infContext, infNotes, matchDate, recordMatchInfractions, showToast]);

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
    sessionDate, setSessionDate,
    attendanceState, setAttendanceState,
    matchDate, setMatchDate,
    selectedPlayerForInf, setSelectedPlayerForInf,
    infPenales, setInfPenales,
    infAmarillas, setInfAmarillas,
    infRojas, setInfRojas,
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
