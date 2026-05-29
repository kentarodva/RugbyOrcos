import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { ClubContext, EQUIPOS_LABELS } from '../context/ClubContext';
import { useToast } from '../context/ToastContext';

function Dashboard() {
  const { players, schedule, championships, fixtures, addChampionship, activeTeam, recordWellness } = useContext(ClubContext);
  const { showToast } = useToast();
  const [showAddChamp, setShowAddChamp] = useState(false);
  const [champName, setChampName] = useState('');
  const [champDate, setChampDate] = useState('');
  const [champDesc, setChampDesc] = useState('');
  const [time, setTime] = useState(new Date());

  // Estado para Wellness Check-in
  const [selectedPlayerForWellness, setSelectedPlayerForWellness] = useState('');
  const [wellnessSleep, setWellnessSleep] = useState(5);
  const [wellnessSoreness, setWellnessSoreness] = useState(5);
  const [wellnessStress, setWellnessStress] = useState(5);
  const [wellnessLogged, setWellnessLogged] = useState(false);

  // Estados para Cronómetro de Sin-Bin (10 min en Rugby)
  const [sinBinLads, setSinBinLads] = useState([]);
  const [selectedPlayerForSinBin, setSelectedPlayerForSinBin] = useState('');
  const [demoMode, setDemoMode] = useState(false);

  // Reloj de cuenta regresiva dinámico
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000); // Actualiza cada minuto
    return () => clearInterval(timer);
  }, []);

  const audioCtxRef = useRef(null);

  const playBeep = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();
      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtxRef.current.currentTime);
      gain.gain.setValueAtTime(0.05, audioCtxRef.current.currentTime);
      osc.start();
      osc.stop(audioCtxRef.current.currentTime + 0.35);
    } catch (e) {
      // AudioContext silenciado preventivamente por el navegador
    }
  }, []);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  // Intervalo en vivo para los expulsados temporalmente (Sin-Bin)
  useEffect(() => {
    if (sinBinLads.length === 0) return;
    const interval = setInterval(() => {
      setSinBinLads(prev => prev.map(lad => {
        if (lad.timeRemaining <= 1) {
          if (lad.timeRemaining === 1) {
            playBeep();
          }
          return { ...lad, timeRemaining: 0, finished: true };
        }
        return { ...lad, timeRemaining: lad.timeRemaining - 1 };
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [sinBinLads.length, playBeep]);

  // Filtrar datos del equipo activo
  const teamPlayers = players.filter(p => p.teamCategory === activeTeam);
  const teamSchedule = schedule
    .filter(s => s.teamCategory === activeTeam)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const teamChamps = championships.filter(c => c.teamCategory === activeTeam);

  // Filtrar jugadores con protocolo HIA activo en el equipo
  const hiaSuspendedPlayers = teamPlayers.filter(p => 
    p.estado === 'lesionado' && 
    p.injuryLog.length > 0 && 
    p.injuryLog[0].diagnosis.toLowerCase().includes('hia')
  );

  // Estadísticas del Equipo
  const totalOrcos = teamPlayers.filter(p => p.rol !== 'Entrenador').length;
  const activos = teamPlayers.filter(p => p.estado === 'activo' && p.rol !== 'Entrenador').length;
  const lesionados = teamPlayers.filter(p => p.estado === 'lesionado').length;
  const suspendidos = teamPlayers.filter(p => p.estado === 'suspendido').length;
  const inactivos = teamPlayers.filter(p => p.estado === 'inactivo').length;

  // Distribución Forwards vs Backs
  const forwardsPositions = ['Pilar', 'Talonador', 'Segunda Línea', 'Flanker', 'Octavo'];
  const backsPositions = ['Medio Melé', 'Apertura', 'Centro', 'Ala', 'Zaguero'];
  
  const forwardsCount = teamPlayers.filter(p => forwardsPositions.includes(p.posicion)).length;
  const backsCount = teamPlayers.filter(p => backsPositions.includes(p.posicion)).length;
  const totalPositioned = forwardsCount + backsCount || 1;
  const forwardsPct = Math.round((forwardsCount / totalPositioned) * 100);
  const backsPct = 100 - forwardsPct;

  // Manejar envío de Campeonato
  const handleAddChampSubmit = (e) => {
    e.preventDefault();
    if (!champName || !champDate) return;
    addChampionship({
      name: champName,
      deadlineDate: champDate,
      description: champDesc
    });
    setChampName('');
    setChampDate('');
    setChampDesc('');
    setShowAddChamp(false);
  };

  // Manejar envío de Wellness
  const handleWellnessSubmit = (e) => {
    e.preventDefault();
    if (!selectedPlayerForWellness) return;
    
    const today = new Date().toISOString().split('T')[0];
    recordWellness(selectedPlayerForWellness, {
      date: today,
      sleep: Number(wellnessSleep),
      soreness: Number(wellnessSoreness),
      stress: Number(wellnessStress)
    });
    
    setWellnessLogged(true);
    setTimeout(() => setWellnessLogged(false), 3000);
    
    // Resetear formulario
    setSelectedPlayerForWellness('');
    setWellnessSleep(5);
    setWellnessSoreness(5);
    setWellnessStress(5);
  };

  // Enviar a Sin-Bin (Expulsión temporal)
  const handleSendToSinBin = () => {
    if (!selectedPlayerForSinBin) return;
    const playerObj = teamPlayers.find(p => p.id === selectedPlayerForSinBin);
    if (!playerObj) return;

    if (sinBinLads.some(l => l.id === playerObj.id)) {
      showToast('Este jugador ya se encuentra pagando sanción en el Sin-Bin.', 'warning');
      return;
    }

    const duration = demoMode ? 10 : 600; // 10 segundos para test, 10 minutos (600s) real de Rugby Union
    setSinBinLads(prev => [...prev, {
      id: playerObj.id,
      name: playerObj.name,
      apodo: playerObj.apodo,
      camiseta: playerObj.camiseta,
      timeRemaining: duration,
      duration: duration,
      finished: false
    }]);
    setSelectedPlayerForSinBin('');
  };

  const handleReleasePlayer = (id) => {
    setSinBinLads(prev => prev.filter(l => l.id !== id));
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  // Renderizador de Cuenta Regresiva
  const renderCountdown = (deadlineStr) => {
    const deadline = new Date(deadlineStr + 'T00:00:00');
    const diff = deadline - time;

    if (diff <= 0) {
      return <span style={{ color: 'var(--color-text-muted)' }}>🏆 ¡Torneo en Curso / Finalizado!</span>;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return (
      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{ background: 'var(--bg-dark)', padding: '5px 10px', borderRadius: 'var(--radius-sm)', textAlign: 'center', minWidth: '60px' }}>
          <h4 style={{ color: 'var(--color-primary)', fontSize: '1.25rem', fontWeight: 800 }}>{days}</h4>
          <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Días</p>
        </div>
        <div style={{ background: 'var(--bg-dark)', padding: '5px 10px', borderRadius: 'var(--radius-sm)', textAlign: 'center', minWidth: '60px' }}>
          <h4 style={{ color: 'var(--color-gold)', fontSize: '1.25rem', fontWeight: 800 }}>{hours}</h4>
          <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Horas</p>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '25px', width: '100%' }}>
        
        {/* Encabezado del Dashboard */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
            Panel General: <span style={{ color: 'var(--color-primary)' }}>{EQUIPOS_LABELS[activeTeam]}</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Resumen en tiempo real del estado de tus guerreros y torneos.
          </p>
        </div>
      </div>

      {/* --- ALERTA MÉDICA CRÍTICA PROTOCOLO HIA --- */}
      {hiaSuspendedPlayers.length > 0 && (
        <div 
          className="animated-pulse"
          style={{ 
            background: 'linear-gradient(135deg, rgba(255, 61, 0, 0.15), rgba(255, 179, 0, 0.15))', 
            border: '2px dashed var(--color-red)', 
            borderRadius: 'var(--radius-lg)', 
            padding: '15px 20px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px',
            boxShadow: '0 0 15px rgba(255, 61, 0, 0.2)'
          }}
        >
          <div style={{ fontSize: '2.2rem' }}>⚠️</div>
          <div>
            <h4 style={{ color: 'var(--color-red)', fontWeight: 800, fontFamily: 'Outfit', fontSize: '1rem', textTransform: 'uppercase' }}>
              Alerta Médica: Suspensión Preventiva HIA
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#fff', marginTop: '3px' }}>
              Los siguientes orcos están bajo protocolo de conmoción cerebral y tienen restringido el contacto físico por seguridad:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {hiaSuspendedPlayers.map(p => (
                <span key={p.id} className="badge badge-injured" style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'var(--color-red)', color: '#fff', border: '1px solid #ff1744' }}>
                  💀 {p.name} (Protocolo HIA de 14 Días)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- BLOQUE 1: MÉTRICTAS RÁPIDAS --- */}
      <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {/* Total Roster */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '2.5rem' }}>🛡️</div>
          <div>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Outfit' }}>{totalOrcos}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Guerreros Totales</p>
          </div>
        </div>
        
        {/* Activos */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '3px solid var(--color-primary)' }}>
          <div style={{ fontSize: '2.5rem' }}>🟢</div>
          <div>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'Outfit' }}>{activos}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Listos para Combate</p>
          </div>
        </div>

        {/* Lesionados */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '3px solid var(--color-red)' }}>
          <div style={{ fontSize: '2.5rem' }}>🚑</div>
          <div>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-red)', fontFamily: 'Outfit' }}>{lesionados}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Bajas por Lesión</p>
          </div>
        </div>

        {/* Suspendidos / Inactivos */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '3px solid var(--color-yellow)' }}>
          <div style={{ fontSize: '2.5rem' }}>⚖️</div>
          <div>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-yellow)', fontFamily: 'Outfit' }}>{suspendidos + inactivos}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Sanciones / Bajas</p>
          </div>
        </div>
      </div>

      {/* --- BLOQUE 2: BALANCE & HITOS --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Distribución Forwards vs Backs */}
        <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Outfit' }}>⚖️ Balance de Plantilla (Delanteros vs Backs)</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Distribución de posiciones del roster en campo de rugby.
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginTop: '10px' }}>
            <span>🏉 Delanteros (Forwards): <strong style={{ color: 'var(--color-primary)' }}>{forwardsCount}</strong></span>
            <span>🏃‍♂️ Backs (Tres Cuartos): <strong style={{ color: 'var(--color-gold)' }}>{backsCount}</strong></span>
          </div>

          {/* Barra de progreso bicolor */}
          <div style={{ width: '100%', height: '14px', background: 'var(--bg-dark)', borderRadius: '7px', display: 'flex', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
            <div style={{ width: `${forwardsPct}%`, height: '100%', background: 'var(--color-primary)', boxShadow: '0 0 10px var(--color-primary-glow)', transition: 'width 0.5s' }} />
            <div style={{ width: `${backsPct}%`, height: '100%', background: 'var(--color-gold)', boxShadow: '0 0 10px var(--color-gold-glow)', transition: 'width 0.5s' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            <span>{forwardsPct}% Forwards</span>
            <span>{backsPct}% Backs</span>
          </div>
        </div>

        {/* Cuenta Regresiva de Campeonatos */}
        <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Outfit' }}>🏆 Cuenta Regresiva de Campeonatos</h3>
            <button onClick={() => setShowAddChamp(true)} className="btn-outline" style={{ padding: '5px 10px', fontSize: '0.75rem' }}>
              + Añadir Hito
            </button>
          </div>

          {teamChamps.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '15px 0' }}>
              No hay campeonatos agendados. ¡Programa tu meta de temporada!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {teamChamps.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{c.name}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{c.description}</p>
                  </div>
                  <div>
                    {renderCountdown(c.deadlineDate)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* --- NUEVO BLOQUE: CONSOLA DE SIN-BIN DE DÍA DE PARTIDO --- */}
      <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px', borderLeft: '4px solid var(--color-yellow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-yellow)' }}>
              ⏱️ Consola de Sin-Bin en Vivo (Sanciones del Staff)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Expulsa temporalmente a un jugador (10 minutos de castigo) y sigue el conteo regresivo de reingreso en tiempo real.
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '5px 10px', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
            <input 
              type="checkbox" 
              id="demoMode" 
              checked={demoMode} 
              onChange={(e) => setDemoMode(e.target.checked)} 
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="demoMode" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer' }}>
              ⚡ Modo Demo (10 segundos)
            </label>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '10px' }}>
          
          {/* Formulario de Envío a Sin-Bin */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group">
              <label>Seleccionar Infractor</label>
              <select 
                value={selectedPlayerForSinBin} 
                onChange={(e) => setSelectedPlayerForSinBin(e.target.value)} 
                className="form-select"
              >
                <option value="">-- Seleccionar Guerrero --</option>
                {teamPlayers.filter(p => p.rol !== 'Entrenador').map(p => (
                  <option key={p.id} value={p.id}>#{p.camiseta} {p.name}</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={handleSendToSinBin} 
              className="btn-neon" 
              style={{ 
                background: 'linear-gradient(135deg, var(--color-yellow), #fdd835)', 
                color: '#000', 
                fontWeight: 800,
                justifyContent: 'center' 
              }}
              disabled={!selectedPlayerForSinBin}
            >
              🟨 Mandar al Sin-Bin (Expulsión)
            </button>
          </div>

          {/* Listado de Tiempos Activos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '5px' }}>
              Relojes en Vivo ({sinBinLads.length} Activos)
            </h4>
            
            {sinBinLads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '15px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                🟢 Ningún orco en el Sin-Bin. ¡Disciplina intachable en cancha!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '160px', overflowY: 'auto' }}>
                {sinBinLads.map(l => {
                  const pct = Math.round((l.timeRemaining / l.duration) * 100);
                  return (
                    <div 
                      key={l.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        background: l.finished ? 'rgba(0, 230, 118, 0.05)' : 'rgba(255, 234, 0, 0.03)',
                        border: '1px solid ' + (l.finished ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 234, 0, 0.2)'),
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)'
                      }}
                      className={l.finished ? 'animated-pulse' : ''}
                    >
                      <div>
                        <strong style={{ fontSize: '0.8rem' }}>{l.name}</strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-yellow)', marginLeft: '5px' }}>#{l.camiseta}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {l.finished ? (
                          <>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 800 }}>¡REINGRESO! 🟢</span>
                            <button 
                              onClick={() => handleReleasePlayer(l.id)} 
                              className="btn-neon" 
                              style={{ padding: '3px 8px', fontSize: '0.65rem' }}
                            >
                              Habilitar ✅
                            </button>
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: '0.9rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--color-yellow)' }}>
                              ⏳ {formatTime(l.timeRemaining)}
                            </span>
                            <div style={{ width: '40px', height: '6px', background: 'var(--bg-dark)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-yellow)' }}></div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* --- BLOQUE 3: EXPEDIENTE MÉDICO, BIENESTAR & PRÓXIMAS CITAS --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Registro diario de Wellness (Fatiga y Descanso) */}
        <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Outfit', color: 'var(--color-primary)' }}>😴 Test Wellness Diario (Fatiga)</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Monitorea el descanso y la recuperación de tus orcos antes de los entrenos.
          </p>

          <form onSubmit={handleWellnessSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Selecciona al Jugador</label>
              <select
                value={selectedPlayerForWellness}
                onChange={(e) => setSelectedPlayerForWellness(e.target.value)}
                className="form-select"
                required
                style={{ padding: '8px' }}
              >
                <option value="">-- Seleccionar Jugador --</option>
                {teamPlayers.filter(p => p.rol !== 'Entrenador').map(p => (
                  <option key={p.id} value={p.id}>#{p.camiseta} {p.name} ("{p.apodo}")</option>
                ))}
              </select>
            </div>

            {selectedPlayerForWellness && (
              <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Sueño */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem' }}>Calidad de Sueño (😴):</span>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {[1, 2, 3, 4, 5].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setWellnessSleep(v)}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '4px',
                          border: 'none',
                          background: wellnessSleep >= v ? 'var(--color-primary)' : 'var(--bg-dark)',
                          color: wellnessSleep >= v ? '#000' : '#fff',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dolor Muscular */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem' }}>Estado Muscular (💪):</span>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {[1, 2, 3, 4, 5].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setWellnessSoreness(v)}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '4px',
                          border: 'none',
                          background: wellnessSoreness >= v ? 'var(--color-gold)' : 'var(--bg-dark)',
                          color: wellnessSoreness >= v ? '#000' : '#fff',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estrés */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem' }}>Estrés Mental (🧠):</span>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {[1, 2, 3, 4, 5].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setWellnessStress(v)}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '4px',
                          border: 'none',
                          background: wellnessStress >= v ? 'var(--color-blue)' : 'var(--bg-dark)',
                          color: wellnessStress >= v ? '#000' : '#fff',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn-neon" 
                  style={{ 
                    padding: '8px', 
                    fontSize: '0.8rem', 
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, var(--color-primary), #00e676)',
                    color: '#000',
                    fontWeight: 700,
                    boxShadow: '0 4px 15px rgba(0, 230, 118, 0.2)'
                  }}
                >
                  Registrar Bienestar
                </button>
              </div>
            )}

            {wellnessLogged && (
              <div className="animated-fade" style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, padding: '5px 0' }}>
                ✅ ¡Recuperación registrada con éxito!
              </div>
            )}
          </form>
        </div>

        {/* Reporte de lesionados actual */}
        <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Outfit', color: 'var(--color-red)' }}>🚑 Control Clínico de Lesionados</h3>
          
          {teamPlayers.filter(p => p.estado === 'lesionado').length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px 0' }}>
              🟢 ¡Excelente! No hay jugadores en el departamento médico.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {teamPlayers.filter(p => p.estado === 'lesionado').map(p => {
                const injury = p.injuryLog[0] || { diagnosis: 'Lesión sin especificar', weeks: 1, phase: 1 };
                const phases = ['Reposo Absoluto 🛑', 'Fortalecimiento 🏋️‍♂️', 'Reacondicionamiento 🏃‍♂️', 'Alta para Contacto 🟢'];
                return (
                  <div key={p.id} style={{ padding: '12px', background: 'rgba(255, 61, 0, 0.03)', border: '1px solid rgba(255, 61, 0, 0.1)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1, marginRight: '10px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{p.name} <span style={{ color: 'var(--color-red)', fontWeight: 500 }}>({p.apodo})</span></h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>🩺 {injury.diagnosis}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-blue)', fontWeight: 600, marginTop: '4px' }}>📋 Fase: {phases[injury.phase - 1] || 'Fase HIA'}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span className="badge badge-injured" style={{ padding: '5px 8px' }}>
                        🏥 {injury.weeks} Semanas
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Próximos Entrenamientos / Partidos */}
        <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Outfit' }}>📅 Próximas Citas (Agenda)</h3>
          
          {teamSchedule.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px 0' }}>
              No hay entrenamientos ni partidos agendados en esta categoría.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {teamSchedule.slice(0, 3).map(e => (
                <div key={e.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ background: e.title.includes('PARTIDO') ? 'rgba(255,179,0,0.1)' : 'rgba(0,230,118,0.1)', border: '1px solid rgba(255,255,255,0.05)', width: '45px', height: '45px', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.25rem' }}>
                    {e.title.includes('PARTIDO') ? '🏉' : '🏃‍♂️'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>{e.title}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>📅 {e.date} | ⏰ {e.time} PM</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginTop: '4px' }}>📍 {e.location}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Partidos Recientes */}
        <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Outfit', color: 'var(--color-gold)' }}>🏉 Partidos Recientes</h3>
          {fixtures.filter(f => f.teamCategory === activeTeam).length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px 0' }}>
              No se han registrado partidos en esta categoría aún.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {fixtures
                .filter(f => f.teamCategory === activeTeam)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 4)
                .map(f => {
                  const isWinner = f.orcosScore > f.opponentScore;
                  const isDraw = f.orcosScore === f.opponentScore;
                  return (
                    <div key={f.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>Orcos vs {f.opponent}</h4>
                        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          📅 {new Date(f.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {f.mvp && <span style={{ marginLeft: '8px' }}>⭐ MVP: {f.mvp}</span>}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: isWinner ? 'var(--color-primary)' : isDraw ? 'var(--color-gold)' : 'var(--color-red)' }}>
                          {f.orcosScore} - {f.opponentScore}
                        </span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: isWinner ? 'rgba(0,230,118,0.1)' : isDraw ? 'rgba(255,234,0,0.1)' : 'rgba(255,61,0,0.1)', color: isWinner ? 'var(--color-primary)' : isDraw ? 'var(--color-gold)' : 'var(--color-red)' }}>
                          {isWinner ? 'V' : isDraw ? 'E' : 'D'}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
      </div>

      {/* --- FORMULARIO MODAL: AGREGAR CAMPEONATO --- */}
      {showAddChamp && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animated-slide">
            <h3 className="neon-text-primary" style={{ marginBottom: '20px', fontFamily: 'Outfit' }}>🏆 Agendar Hito de Campeonato</h3>
            
            <form onSubmit={handleAddChampSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div className="form-group">
                <label>Nombre del Torneo / Partido</label>
                <input 
                  type="text" 
                  value={champName} 
                  onChange={(e) => setChampName(e.target.value)} 
                  placeholder="Ej. Final Copa de Oro, Campeonato Apertura" 
                  className="form-input" 
                  required
                />
              </div>

              <div className="form-group">
                <label>Fecha de Límite / Partido</label>
                <input 
                  type="date" 
                  value={champDate} 
                  onChange={(e) => setChampDate(e.target.value)} 
                  className="form-input" 
                  required
                />
              </div>

              <div className="form-group">
                <label>Descripción / Meta del Club</label>
                <textarea 
                  value={champDesc} 
                  onChange={(e) => setChampDesc(e.target.value)} 
                  placeholder="Ej. Clasificar en primer lugar, entrenar alta intensidad." 
                  className="form-textarea" 
                  rows="3"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddChamp(false)} className="btn-outline">
                  Cancelar
                </button>
                <button type="submit" className="btn-neon">
                  Guardar Hito
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;
