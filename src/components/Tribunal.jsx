import React, { useContext, useState } from 'react';
import { ClubContext } from '../context/ClubContext';
import { useToast } from '../context/ToastContext';

function Tribunal() {
  const { 
    players, recordAttendance, recordMatchInfractions, redeemPenalty, activeTeam
  } = useContext(ClubContext);
  const { showToast } = useToast();
  
  // Sub-tabs segmentados
  const [activeSubTab, setActiveSubTab] = useState('control'); // 'control', 'faltas', 'rankings'

  // Estados para Asistencia
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceState, setAttendanceState] = useState({});

  // Estados para Infracciones de Partido (Tribunal)
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPlayerForInf, setSelectedPlayerForInf] = useState('');
  const [infPenales, setInfPenales] = useState(0);
  const [infAmarillas, setInfAmarillas] = useState(0);
  const [infRojas, setInfRojas] = useState(0);
  const [infFaultType, setInfFaultType] = useState('');
  const [infContext, setInfContext] = useState('partido');
  const [infNotes, setInfNotes] = useState('');

  // Catálogo de faltas comunes de Rugby
  const FAULT_TYPES = [
    { id: 'tackle_alto', label: 'Tackle Alto / Peligroso', desc: 'Contacto por encima de los hombros' },
    { id: 'offside', label: 'Offside / Fuera de Juego', desc: 'Posición adelantada' },
    { id: 'knock_on', label: 'Knock-On / Avant', desc: 'Balón hacia adelante con la mano' },
    { id: 'pase_forward', label: 'Pase Forward', desc: 'Pase hacia adelante' },
    { id: 'obstruccion', label: 'Obstrucción', desc: 'Bloquear sin balón' },
    { id: 'juego_sucio', label: 'Juego Sucio', desc: 'Conducta antideportiva' },
    { id: 'placaje_sin_balon', label: 'Placaje sin Balón', desc: 'Tackle a jugador sin posesión' },
    { id: 'no_rodar', label: 'No Rodar / Retención', desc: 'No liberar en el tackle' },
    { id: 'entrada_lateral', label: 'Entrada Lateral', desc: 'Ingresar al ruck por el costado' },
    { id: 'derribo_peligroso', label: 'Derribo Peligroso / Spear', desc: 'Levantar y soltar de cabeza' },
    { id: 'golpe_ilegal', label: 'Golpe / Agresión', desc: 'Puñetazo, codazo o cabezazo' },
    { id: 'insulto_arbitro', label: 'Insulto al Árbitro', desc: 'Falta de respeto al referí' },
    { id: 'indisciplina', label: 'Indisciplina General', desc: 'Protestas, peleas, conducta' },
    { id: 'otro', label: 'Otro / No especificado', desc: 'Cualquier otra infracción' }
  ];

  // Filtrado de Jugadores activos
  const teamPlayers = players.filter(p => p.teamCategory === activeTeam && p.rol !== 'Entrenador');

  // Cambiar estado de asistencia
  const handleAttendanceChange = (playerId, status) => {
    setAttendanceState(prev => ({
      ...prev,
      [playerId]: status
    }));
  };

  // Enviar Asistencia
  const handleSaveAttendance = (e) => {
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
      showToast('Asistencia registrada con éxito. Penitencias aplicadas al Tribunal.', 'success');
    }
    setAttendanceState({});
  };

  // Enviar Infracciones (Tribunal)
  const handleSaveInfraction = (e) => {
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

    // Resetear formulario
    setSelectedPlayerForInf('');
    setInfPenales(0);
    setInfAmarillas(0);
    setInfRojas(0);
    setInfFaultType('');
    setInfContext('partido');
    setInfNotes('');
  };

  // Jugadores con deudas pendientes (Burpees o Cones)
  const penalizedPlayers = teamPlayers.filter(p => 
    p.penalties.burpees > 0 || p.penalties.cones
  );

  // Enviar Lista Negra por WhatsApp
  const handleShareBlacklistWhatsApp = () => {
    if (penalizedPlayers.length === 0) return;

    let text = `👹 *TRIBUNAL RUGBY ORCOS - LA LISTA NEGRA* 👹\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `⚠️ *Atención Clan*, el tribunal exige redención física en el próximo entrenamiento. Aquí los guerreros con cuentas pendientes:\n\n`;

    penalizedPlayers.forEach(p => {
      let debts = [];
      if (p.penalties.burpees > 0) debts.push(`🔋 ${p.penalties.burpees} Burpees`);
      if (p.penalties.cones) debts.push(`🗼 Recoger Conos (Servicios)`);
      
      text += `• *${p.name}* ("${p.apodo}"): ${debts.join(' y ')}\n`;
    });

    text += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🏉 ¡A sudar y pagar por el clan! Ningún Orco se queda atrás. 💪👹 #RugbyOrcos`;

    // Copiar al portapapeles
    navigator.clipboard.writeText(text);
    showToast('Lista negra copiada al portapapeles. Abriendo WhatsApp...', 'success');
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // --- CALCULAR LÍDERES REACTIVOS DE CLAN ---
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

  return (
    <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* segmentador superior */}
      <div style={{ display: 'flex', gap: '10px', width: '100%', borderBottom: '1px solid var(--border-glass)', paddingBottom: '15px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveSubTab('control')}
          className="btn-outline"
          style={{ 
            background: activeSubTab === 'control' ? 'var(--color-primary)' : 'transparent',
            color: activeSubTab === 'control' ? '#000' : '#fff',
            borderColor: activeSubTab === 'control' ? 'var(--color-primary)' : 'var(--border-glass)',
            fontWeight: activeSubTab === 'control' ? 800 : 500,
            padding: '8px 16px',
            fontSize: '0.85rem'
          }}
        >
          ⚖️ Control y Asistencia
        </button>

        <button 
          onClick={() => setActiveSubTab('faltas')}
          className="btn-outline"
          style={{ 
            background: activeSubTab === 'faltas' ? 'var(--color-red)' : 'transparent',
            color: activeSubTab === 'faltas' ? '#fff' : '#fff',
            borderColor: activeSubTab === 'faltas' ? 'var(--color-red)' : 'var(--border-glass)',
            fontWeight: activeSubTab === 'faltas' ? 800 : 500,
            padding: '8px 16px',
            fontSize: '0.85rem'
          }}
        >
          🚨 Libro de Faltas
        </button>
        <button 
          onClick={() => setActiveSubTab('rankings')}
          className="btn-outline"
          style={{ 
            background: activeSubTab === 'rankings' ? 'var(--color-blue)' : 'transparent',
            color: activeSubTab === 'rankings' ? '#000' : '#fff',
            borderColor: activeSubTab === 'rankings' ? 'var(--color-blue)' : 'var(--border-glass)',
            fontWeight: activeSubTab === 'rankings' ? 800 : 500,
            padding: '8px 16px',
            fontSize: '0.85rem'
          }}
        >
          🏆 Rankings del Clan
        </button>
      </div>

      {/* --- PANEL 1: CONTROL & ASISTENCIA --- */}
      {activeSubTab === 'control' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Control Asistencia */}
            <div className="glass-panel" style={{ padding: '25px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-primary)', marginBottom: '15px' }}>
                🟢 Control de Asistencia del Entrenamiento
              </h3>
              
              <form onSubmit={handleSaveAttendance}>
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label>Fecha de la Sesión</label>
                  <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} className="form-input" required />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto', marginBottom: '20px', paddingRight: '5px' }}>
                  {teamPlayers.map(p => {
                    const currentStatus = attendanceState[p.id] || 'presente';
                    return (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' }}>
                        <div>
                          <strong style={{ fontSize: '0.8rem' }}>{p.name}</strong>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginLeft: '4px' }}>("{p.apodo}")</span>
                        </div>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button 
                            type="button" 
                            onClick={() => handleAttendanceChange(p.id, 'presente')}
                            style={{
                              background: currentStatus === 'presente' ? 'rgba(0, 230, 118, 0.12)' : 'transparent',
                              color: currentStatus === 'presente' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                              border: '1px solid ' + (currentStatus === 'presente' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)'),
                              padding: '3px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            Presente
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleAttendanceChange(p.id, 'tarde')}
                            style={{
                              background: currentStatus === 'tarde' ? 'rgba(255, 234, 0, 0.12)' : 'transparent',
                              color: currentStatus === 'tarde' ? 'var(--color-yellow)' : 'var(--color-text-muted)',
                              border: '1px solid ' + (currentStatus === 'tarde' ? 'var(--color-yellow)' : 'rgba(255,255,255,0.05)'),
                              padding: '3px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer'
                            }}
                            title="Tarde: +15 Burpees"
                          >
                            Tarde 🟡
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleAttendanceChange(p.id, 'falta_injustificada')}
                            style={{
                              background: currentStatus === 'falta_injustificada' ? 'rgba(255, 61, 0, 0.12)' : 'transparent',
                              color: currentStatus === 'falta_injustificada' ? 'var(--color-red)' : 'var(--color-text-muted)',
                              border: '1px solid ' + (currentStatus === 'falta_injustificada' ? 'var(--color-red)' : 'rgba(255,255,255,0.05)'),
                              padding: '3px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer'
                            }}
                            title="Falta: +50 Burpees, recoge conos"
                          >
                            Falta 🔴
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button type="submit" className="btn-neon" style={{ width: '100%', justifyContent: 'center' }}>
                  Guardar Asistencia de Hoy 🏉
                </button>
              </form>
            </div>

            {/* Infracciones de Partido (Burpees correctivos) */}
            <div className="glass-panel" style={{ padding: '25px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-red)', marginBottom: '15px' }}>
                🟨 Sanciones del Tribunal (Correctivos Físicos)
              </h3>

              <form onSubmit={handleSaveInfraction} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Fecha de Infracción</label>
                    <input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="form-input" required />
                  </div>
                  <div className="form-group">
                    <label>Contexto</label>
                    <select value={infContext} onChange={(e) => setInfContext(e.target.value)} className="form-select">
                      <option value="partido">Partido</option>
                      <option value="practica">Práctica / Entrenamiento</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Seleccionar al Acusado</label>
                  <select value={selectedPlayerForInf} onChange={(e) => setSelectedPlayerForInf(e.target.value)} className="form-select" required>
                    <option value="">-- Seleccionar --</option>
                    {teamPlayers.map(p => (
                      <option key={p.id} value={p.id}>#{p.camiseta} {p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Tipo de Falta</label>
                  <select value={infFaultType} onChange={(e) => setInfFaultType(e.target.value)} className="form-select">
                    <option value="">-- Sin especificar --</option>
                    {FAULT_TYPES.map(ft => (
                      <option key={ft.id} value={ft.id}>{ft.label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.7rem' }}>Penales</label>
                    <input type="number" min="0" value={infPenales} onChange={(e) => setInfPenales(e.target.value)} className="form-input" />
                    <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)' }}>+10 Burpees c/u</span>
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.7rem' }}>Amarillas 🟨</label>
                    <input type="number" min="0" max="2" value={infAmarillas} onChange={(e) => setInfAmarillas(e.target.value)} className="form-input" />
                    <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)' }}>+50 Burpees</span>
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.7rem' }}>Rojas 🟥</label>
                    <input type="number" min="0" max="1" value={infRojas} onChange={(e) => setInfRojas(e.target.value)} className="form-input" />
                    <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)' }}>+100 Burpees + Susp.</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Notas / Observaciones</label>
                  <input type="text" value={infNotes} onChange={(e) => setInfNotes(e.target.value)} placeholder="Ej. Minuto 34, tackle alto a apertura rival" className="form-input" />
                </div>

                <button type="submit" className="btn-neon" style={{ background: 'linear-gradient(135deg, var(--color-red), #d50000)', color: '#fff', justifyContent: 'center' }}>
                  Registrar Sanción Correctiva
                </button>
              </form>
            </div>

          </div>

          {/* Penitencias Activas */}
          <div className="glass-panel" style={{ padding: '25px' }}>
            <h2 className="neon-text-gold" style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'Outfit', marginBottom: '10px' }}>
              ⚖️ La Redención del Orco (Deudas Correctivas)
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '15px' }}>
              Los jugadores deben saldar su penitencia física ante el clan para poder alinearse en el XV táctico.
            </p>

            {penalizedPlayers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <span style={{ fontSize: '3rem' }}>🟢</span>
                <h4 style={{ marginTop: '15px', fontWeight: 700 }}>¡Tribunal en Paz!</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '5px' }}>
                  No hay deudas de burpees ni de recoger conos pendientes en esta categoría.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {penalizedPlayers.map(p => (
                  <div key={p.id} style={{ padding: '12px', background: 'rgba(255, 61, 0, 0.02)', border: '1px solid rgba(255, 61, 0, 0.15)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                      <strong>{p.name} <span style={{ color: 'var(--color-red)' }}>("{p.apodo}")</span></strong>
                      {p.estado === 'suspendido' && <span className="badge badge-suspended" style={{ fontSize: '0.65rem' }}>🟥 Suspendido</span>}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {p.penalties.burpees > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                          <span>🔋 <strong>{p.penalties.burpees} Burpees</strong> pendientes</span>
                          <button onClick={() => redeemPenalty(p.id, 'burpees')} className="btn-neon" style={{ padding: '2px 8px', fontSize: '0.65rem' }}>
                            🏃‍♂️ Pagar Burpees
                          </button>
                        </div>
                      )}
                      {p.penalties.cones && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                          <span>🗼 Penitencia: <strong>Recoger Conos</strong></span>
                          <button onClick={() => redeemPenalty(p.id, 'cones')} className="btn-outline" style={{ padding: '2px 8px', fontSize: '0.65rem', color: 'var(--color-blue)', borderColor: 'rgba(0,176,255,0.2)' }}>
                            Recogido
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}



      {/* --- PANEL 3: LIBRO DE FALTAS DETALLADO (DEUDAS A PAGAR) --- */}
      {activeSubTab === 'faltas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          
          {/* Tarjetas de Resumen Global de Deudas de Faltas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
            
            <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--color-red)', background: 'rgba(255, 61, 0, 0.02)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Burpees a Pagar</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-red)', marginTop: '5px' }}>
                {teamPlayers.reduce((sum, p) => sum + (p.penalties.burpees || 0), 0)} Burpees 🔋
              </h2>
              <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '5px' }}>Faltas, tardanzas e infracciones activas.</p>
            </div>

            <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--color-blue)', background: 'rgba(0, 176, 255, 0.02)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Conos a Recoger</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-blue)', marginTop: '5px' }}>
                {teamPlayers.filter(p => p.penalties.cones).length} Orcos 🗼
              </h2>
              <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '5px' }}>Tienen deudas pendientes de servicio logístico.</p>
            </div>

            <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--color-gold)', background: 'rgba(255, 234, 0, 0.02)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Orco-Multados Activos</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-gold)', marginTop: '5px' }}>
                {teamPlayers.filter(p => p.penalties.burpees > 0 || p.penalties.cones).length} Guerreros ⚖️
              </h2>
              <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '5px' }}>Sancionados con penitencias físicas.</p>
            </div>

          </div>

          {/* Listado Detallado de Faltas */}
          <div className="glass-panel" style={{ padding: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-red)', margin: 0 }}>
                🚨 Reporte de Historial de Faltas e Infracciones
              </h3>
              {penalizedPlayers.length > 0 && (
                <button 
                  onClick={handleShareBlacklistWhatsApp}
                  className="btn-neon" 
                  style={{ 
                    padding: '6px 12px', 
                    fontSize: '0.8rem', 
                    background: 'linear-gradient(135deg, #25d366, #128c7e)', 
                    color: '#fff',
                    boxShadow: '0 4px 15px rgba(37, 211, 102, 0.2)',
                    fontWeight: 700
                  }}
                >
                  📢 Compartir Lista Negra (WhatsApp)
                </button>
              )}
            </div>
            
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-text-muted)' }}>
                    <th style={{ padding: '10px 5px' }}>Guerrero</th>
                    <th style={{ padding: '10px 5px', textAlign: 'center' }}>Llegadas Tarde</th>
                    <th style={{ padding: '10px 5px', textAlign: 'center' }}>Faltas Injust.</th>
                    <th style={{ padding: '10px 5px', textAlign: 'center' }}>Amarillas 🟨</th>
                    <th style={{ padding: '10px 5px', textAlign: 'center' }}>Rojas 🟥</th>
                    <th style={{ padding: '10px 5px', textAlign: 'center' }}>Por Pagar (Burpees)</th>
                    <th style={{ padding: '10px 5px', textAlign: 'center' }}>Por Pagar (Servicio)</th>
                    <th style={{ padding: '10px 5px', textAlign: 'center' }}>Acción Redentora</th>
                  </tr>
                </thead>
                <tbody>
                  {teamPlayers.map(p => {
                    const totalYellows = (p.matchStats || []).reduce((sum, s) => sum + (s.yellowCards || 0), 0);
                    const totalReds = (p.matchStats || []).reduce((sum, s) => sum + (s.redCards || 0), 0);
                    const hasPenalties = p.penalties.burpees > 0 || p.penalties.cones;
                    
                    return (
                      <tr 
                        key={p.id} 
                        style={{ 
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                          background: hasPenalties ? 'rgba(255, 61, 0, 0.01)' : 'transparent'
                        }}
                      >
                        <td style={{ padding: '12px 5px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong>{p.name}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>#{p.camiseta} "{p.apodo}"</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 5px', textAlign: 'center' }}>
                          <span style={{ color: p.attendance.late > 0 ? 'var(--color-yellow)' : 'var(--color-text-muted)', fontWeight: 700 }}>
                            {p.attendance.late} 🟡
                          </span>
                        </td>
                        <td style={{ padding: '12px 5px', textAlign: 'center' }}>
                          <span style={{ color: p.attendance.absentUnjustified > 0 ? 'var(--color-red)' : 'var(--color-text-muted)', fontWeight: 700 }}>
                            {p.attendance.absentUnjustified} 🔴
                          </span>
                        </td>
                        <td style={{ padding: '12px 5px', textAlign: 'center' }}>
                          <span style={{ color: totalYellows > 0 ? 'var(--color-yellow)' : 'var(--color-text-muted)', fontWeight: totalYellows > 0 ? 700 : 400 }}>
                            {totalYellows} 🟨
                          </span>
                        </td>
                        <td style={{ padding: '12px 5px', textAlign: 'center' }}>
                          <span style={{ color: totalReds > 0 ? 'var(--color-red)' : 'var(--color-text-muted)', fontWeight: totalReds > 0 ? 700 : 400 }}>
                            {totalReds} 🟥
                          </span>
                        </td>
                        <td style={{ padding: '12px 5px', textAlign: 'center' }}>
                          {p.penalties.burpees > 0 ? (
                            <strong style={{ color: 'var(--color-yellow)', fontSize: '0.95rem' }}>
                              🔋 {p.penalties.burpees} Burpees
                            </strong>
                          ) : (
                            <span style={{ color: 'var(--color-primary)' }}>Limpio 🟢</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 5px', textAlign: 'center' }}>
                          {p.penalties.cones ? (
                            <span style={{ color: 'var(--color-blue)', fontWeight: 700 }}>
                              🗼 Conos (Servicio)
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-text-muted)' }}>Ninguno</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 5px', textAlign: 'center' }}>
                          {hasPenalties ? (
                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                              {p.penalties.burpees > 0 && (
                                <button 
                                  onClick={() => redeemPenalty(p.id, 'burpees')} 
                                  className="btn-neon" 
                                  style={{ padding: '3px 8px', fontSize: '0.65rem', textTransform: 'none' }}
                                >
                                  Pagar Burpees
                                </button>
                              )}
                              {p.penalties.cones && (
                                <button 
                                  onClick={() => redeemPenalty(p.id, 'cones')} 
                                  className="btn-outline" 
                                  style={{ padding: '3px 8px', fontSize: '0.65rem', color: 'var(--color-blue)', borderColor: 'rgba(0,176,255,0.2)' }}
                                >
                                  Recogido
                                </button>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Sin deudas</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* --- PANEL 4: RANKINGS DEL CLAN (LEADERBOARDS) --- */}
      {activeSubTab === 'rankings' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          
          {/* ORCOS DE HONOR */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-primary)', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginBottom: '12px' }}>
              🌟 Orcos de Honor (Asistencia)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {honorOrcs.map((p, idx) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <span>{idx + 1}. <strong>{p.name}</strong></span>
                  <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>{p.attRate}% Asist.</span>
                </div>
              ))}
            </div>
          </div>

          {/* GLADIADORES MVP */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-gold)', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginBottom: '12px' }}>
              🏆 Gladiadores (MVPs del Club)
            </h4>
            {mvpLeaders.length === 0 ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '10px 0' }}>No hay MVPs registrados aún.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {mvpLeaders.map((p, idx) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span>{idx + 1}. <strong>{p.name}</strong></span>
                    <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>🥇 {p.mvps} MVPs</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TRY-SLAYERS */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ff3d00', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginBottom: '12px' }}>
              🏉 Demoletries (Anotadores)
            </h4>
            {tryLeaders.length === 0 ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '10px 0' }}>No hay tries anotados aún.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tryLeaders.map((p, idx) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span>{idx + 1}. <strong>{p.name}</strong></span>
                    <span className="badge" style={{ fontSize: '0.7rem', border: '1px solid #ff3d00', color: '#ff3d00', background: 'rgba(255,61,0,0.05)' }}>🔥 {p.totalTries} Tries</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TACKLE MASTERS */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-blue)', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginBottom: '12px' }}>
              🛡️ Murallas Verdes (Tacles)
            </h4>
            {tackleLeaders.length === 0 ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '10px 0' }}>No hay tacles registrados aún.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tackleLeaders.map((p, idx) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span>{idx + 1}. <strong>{p.name}</strong></span>
                    <span className="badge badge-active" style={{ fontSize: '0.7rem', color: 'var(--color-blue)', borderColor: 'rgba(0,176,255,0.2)' }}>🧱 {p.totalTackles} Tacles</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* EL CALABOZO DE BURPEES */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-red)', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginBottom: '12px' }}>
              💀 El Calabozo (Penitencias)
            </h4>
            {dungeonOrcs.length === 0 ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '10px 0' }}>🟢 ¡Calabozo libre de prisioneros!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dungeonOrcs.map((p, idx) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span>{idx + 1}. <strong>{p.name}</strong></span>
                    <span className="badge badge-injured" style={{ fontSize: '0.7rem' }}>🥵 {p.penalties.burpees} Burpees</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}

export default Tribunal;
