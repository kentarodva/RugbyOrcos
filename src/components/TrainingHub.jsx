import React, { useState, useContext } from 'react';
import { ClubContext } from '../context/ClubContext';
import { generatePlan } from '../engine/assignmentEngine';
import { enrichWithGemini, isGeminiConfigured } from '../engine/geminiCoach';
import { useToast } from '../context/ToastContext';

function TrainingHub() {
  const { players, activeTeam, logWorkout, schedule } = useContext(ClubContext);
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('plan');
  const [activeCategory, setActiveCategory] = useState('forwards');
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  // Plan Inteligente
  const [planPlayerId, setPlanPlayerId] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [completedExercises, setCompletedExercises] = useState({});
  const [linkToDate, setLinkToDate] = useState('');

  // Filtrar jugadores del equipo activo
  const teamPlayers = players.filter(p => p.teamCategory === activeTeam);

  // Catálogo completo de Entrenamientos
  const WORKOUTS = {
    forwards: [
      {
        title: '🏋️‍♂️ Empuje de Scrum y Estabilidad del Core',
        focus: 'Pilar, Talonador, Segunda Línea, Flanker, Octavo',
        duration: '45 minutos',
        difficulty: 'Alta 🔥🔥🔥',
        description: 'Enfocado en fortalecer el cuello, la espalda baja y la estabilidad abdominal para transferir el 100% de fuerza en el melé.',
        drills: [
          'Planchas frontales con peso (3 series x 1 minuto)',
          'Sentadillas profundas pesadas (4 series x 6 repeticiones)',
          'Empuje de trineo de carga pesada (5 pasadas x 15 metros)',
          'Técnica de empaque: Formar primera línea en cuclillas y aguantar binds (3 series x 30 seg)'
        ]
      },
      {
        title: '🗼 Lanzamiento y Salto en el Line-out',
        focus: 'Talonador, Segunda Línea, Flankers, Octavo',
        duration: '35 minutos',
        difficulty: 'Media 🔥🔥',
        description: 'Coordinación milimétrica para robar lines ajenos y asegurar posesión propia. Incluye explosividad de salto y precisión.',
        drills: [
          'Lanzamiento a diana con pelota Gilbert (30 lanzamientos de precisión a 7m, 10m y 15m)',
          'Saltos explosivos en cajón con chaleco lastrado (4 series x 8 saltos)',
          'Levantamiento rápido: Levantadores cargan al saltador explosivamente en el aire (15 repeticiones)',
          'Simulación de juego: 5 Lines seguidos a máxima velocidad con defensor pasivo'
        ]
      },
      {
        title: '🛡️ Limpieza de Ruck y Contra-Ruck',
        focus: 'Delanteros (Forwards)',
        duration: '40 minutos',
        difficulty: 'Alta 🔥🔥🔥',
        description: 'La ley de la melé abierta: Cómo entrar bajo a la zona de tackle y remover amenazas defensivas usando la espalda recta y el empuje de cadera.',
        drills: [
          'Tackle al escudo de impacto + Limpieza inmediata de oponente parado (10 repeticiones por jugador)',
          'Ejercicio de 3 vs 2 en espacio reducido: Limpiar el ruck en menos de 2 segundos',
          'Técnica del Gate (Entrar por la puerta del tackle): Corrección de ángulos para evitar infracciones'
        ]
      }
    ],
    backs: [
      {
        title: '🏉 Destreza y Handling de Alta Velocidad (Pases)',
        focus: 'Medio Melé, Apertura, Centro, Ala, Zaguero',
        duration: '35 minutos',
        difficulty: 'Media 🔥🔥',
        description: 'Garantizar pases perfectos en carrera a máxima intensidad. Reducir el tiempo de retención del balón a menos de 0.5 segundos.',
        drills: [
          'Pases en L: Correr en escuadra y pasar la pelota en espiral perfecta (15 repeticiones por lado)',
          'El reloj de pases: 5 jugadores en círculo, pases rápidos de primera intención sin soltar la carrera',
          'Pase plano bajo presión defensiva: Apertura ataca la línea y suelta pase corto al centro en el último segundo'
        ]
      },
      {
        title: '🦵 Técnica de Patada Táctica y Despeje',
        focus: 'Medio Melé, Apertura, Centros, Zaguero',
        duration: '40 minutos',
        difficulty: 'Alta 🔥🔥🔥',
        description: 'Dominio del espacio territorial. Cómo usar la patada para salir de las 22 metros propias u ofender a la espalda contraria.',
        drills: [
          'Patada de cajón (Box Kick): Medio melé saca la pelota de la base y patea alto cubriendo 20-30 metros (15 intentos)',
          'Patada al touch (despeje lateral): Patear angulado buscando que la pelota bote fuera (15 patadas)',
          'Pateo rastrero (Grubber): Pases en carrera con patada sutil al ras del suelo para la superación del wing'
        ]
      },
      {
        title: '⚡ Evasión, Cambios de Ritmo y Tackle Abierto',
        focus: 'Alas (Wings), Centros, Zaguero',
        duration: '35 minutos',
        difficulty: 'Alta 🔥🔥🔥',
        description: 'Cómo explotar el espacio exterior. Cambios de pie (Side-step) explosivos y tackles uno contra uno en campo abierto.',
        drills: [
          'Canal de tackle en campo abierto 1 vs 1: Atacante intenta evadir, defensor debe canalizar y tacklear de hombro',
          'Sprints de aceleración con cambio de dirección marcado por conos (5 repeticiones)',
          'Recepción de patada aérea bajo presión + contragolpe coordinado con pases de apoyo'
        ]
      }
    ],
    captain: [
      {
        title: '👑 Liderazgo del Clan y Toma de Decisiones bajo Fatiga',
        focus: 'Capitanes y Subcapitanes',
        duration: '30 minutos',
        difficulty: 'Media 🔥🔥',
        description: 'Enfocado en la toma de decisiones críticas bajo fatiga física extrema, arengas motivacionales y comunicación con el árbitro.',
        drills: [
          'Sprints del 100m + Simulación de penal: elegir patear a palos, touch o scrum en 3 segundos bajo fatiga (10 repeticiones)',
          'Práctica de comunicación asertiva y respetuosa con el árbitro principal bajo presión competitiva',
          'Ajuste táctico: Coordinación del pizarrón y plan de juego de terceras líneas en situaciones adversas',
          'Arenga del Líder: Simulación de charla motivacional de medio tiempo para reactivar el clan'
        ]
      }
    ],
    coach: [
      {
        title: '📋 Planificación Táctica, Biomecánica y Gestión',
        focus: 'Entrenadores y Staff Técnico',
        duration: '50 minutos',
        difficulty: 'Baja 🟢',
        description: 'Análisis profundo de estadísticas de los oponentes, calibración del Roster táctico de juego y monitoreo de kinesiología.',
        drills: [
          'Análisis de video del oponente: mapear patrones del medio melé y zona defensiva rival',
          'Elaboración y ajuste de las plantillas de alineación en la Pizarra Táctica y plan de carga física',
          'Simulacros de sustitución rápida por emergencias médicas (HIA) y deudas disciplinarias de burpees'
        ]
      }
    ],
    general: [
      {
        title: '🏃‍♂️ Test Bronco (Resistencia Aeróbica)',
        focus: 'Toda la plantilla del Club (Forwards y Backs)',
        duration: '30 minutos',
        difficulty: 'Extrema 💀💀💀',
        description: 'El test de resistencia física clásico del Rugby. Mide la recuperación cardiovascular mediante sprints repetitivos intermitentes.',
        drills: [
          'Distancia de carrera ida y vuelta continua: Correr 20m (ida y vuelta), correr 40m (ida y vuelta), correr 60m (ida y vuelta)',
          'Realizar este ciclo 5 veces seguidas sin detener el cronómetro',
          'Meta para Delanteros (Forwards): Menos de 5 minutos y 15 segundos',
          'Meta para Tres Cuartos (Backs): Menos de 4 minutos y 45 segundos'
        ]
      },
      {
        title: '💪 Prevención de Lesiones (Kinesiología Preventiva)',
        focus: 'Todos los jugadores',
        duration: '20 minutos',
        difficulty: 'Baja 🟢',
        description: 'Fortalecimiento de articulaciones clave para el rugby (hombros, cuello, tobillos) para reducir el riesgo de luxaciones y desgarros.',
        drills: [
          'Rotación de hombros con banda elástica (3 series x 15 repeticiones)',
          'Ejercicios isométricos de cuello con resistencia manual (3 series x 10 segundos por lado)',
          'Propiocepción en base inestable (Bosu) para fortalecer tobillos y rodillas (3 series x 1 minuto por pierna)'
        ]
      },
      {
        title: '🏋️‍♂️ Acondicionamiento de Fuerza General',
        focus: 'Toda la plantilla',
        duration: '45 minutos',
        difficulty: 'Media 🔥🔥',
        description: 'Circuito de fuerza funcional y acondicionamiento general para mantener la base atlética durante la temporada competitiva.',
        drills: [
          'Circuito de 5 estaciones: Sentadilla Goblet, Remo con Mancuerna, Press de Hombro, Peso Muerto Rumano, Plancha Dinámica',
          '3 rondas completas del circuito con 45 segundos de trabajo por estación y 15 segundos de descanso',
          'Enfriamiento con estiramientos dinámicos de cadena posterior'
        ]
      },
      {
        title: '🧘 Recuperación Activa Post-Partido',
        focus: 'Todos los jugadores (día después del partido)',
        duration: '30 minutos',
        difficulty: 'Baja 🟢',
        description: 'Protocolo de recuperación activa para acelerar la regeneración muscular, drenaje linfático y reducir la inflamación post-competencia.',
        drills: [
          'Trote regenerativo suave en césped (10 minutos a ritmo de conversación)',
          'Foam roller en cuádriceps, isquiotibiales, gemelos y espalda baja (2 minutos por grupo muscular)',
          'Estiramientos estáticos asistidos en pareja para cadenas musculares principales',
          'Hidroterapia: Alternar agua fría y caliente en piernas si hay disponibilidad de duchas'
        ]
      }
    ]
  };

  // Clasificador de Jugador a Categoría de Entrenamiento
  const getPlayerCategory = (player) => {
    if (player.rol === 'Entrenador') return 'coach';
    if (player.rol === 'Capitán' || player.rol === 'Subcapitán') return 'captain';
    
    const forwardsPositions = ['Pilar', 'Talonador', 'Segunda Línea', 'Flanker', 'Octavo'];
    if (forwardsPositions.includes(player.posicion)) {
      return 'forwards';
    }
    return 'backs';
  };

  // Obtener texto descriptivo de la categoría de entrenamiento
  const getCategoryLabel = (cat) => {
    switch(cat) {
      case 'coach': return '📋 Staff Técnico (Coach)';
      case 'captain': return '👑 Liderazgo y Táctica (Capitán)';
      case 'forwards': return '🛡️ Delanteros (Forwards)';
      case 'backs': return '🏃‍♂️ Tres Cuartos (Backs)';
      default: return '⚡ Entrenamiento General';
    }
  };

  // Si no hay jugador seleccionado, seleccionar el primero por defecto
  const activePlayerId = selectedPlayerId || (teamPlayers.length > 0 ? teamPlayers[0].id : null);
  const selectedPlayer = teamPlayers.find(p => p.id === activePlayerId);
  const assignedCategory = selectedPlayer ? getPlayerCategory(selectedPlayer) : 'general';
  const playerWorkouts = WORKOUTS[assignedCategory] || WORKOUTS.general;

  const handleGeneratePlan = async () => {
    if (!planPlayerId) {
      showToast('Selecciona un jugador para generar el plan.', 'warning');
      return;
    }
    const player = teamPlayers.find(p => p.id === planPlayerId);
    if (!player) return;

    setGenerating(true);
    setGeneratedPlan(null);
    setCompletedExercises({});

    let plan = generatePlan(player);

    if (isGeminiConfigured()) {
      try {
        plan = await enrichWithGemini(plan, player);
      } catch (e) {
        // fallback al plan base
      }
    }

    setGeneratedPlan(plan);
    setGenerating(false);
    if (plan.enrichedByAI) {
      showToast('Plan generado y enriquecido con IA.', 'success');
    } else {
      showToast('Plan generado con motor de reglas.', 'success');
    }
  };

  const handleToggleExercise = (exerciseId) => {
    setCompletedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  };

  const handleSaveWorkout = () => {
    if (!planPlayerId) return;
    const completed = Object.entries(completedExercises)
      .filter(([, done]) => done)
      .map(([id]) => ({ exerciseId: id, completed: true }));

    if (completed.length === 0) {
      showToast('Marca al menos un ejercicio como completado.', 'warning');
      return;
    }

    logWorkout(planPlayerId, {
      ejercicios: completed,
      type: 'plan',
      linkedDate: linkToDate || null
    });

    showToast(`Rutina registrada: ${completed.length} ejercicios completados.${linkToDate ? ' Vinculada a fecha del calendario.' : ''}`, 'success');
    setCompletedExercises({});
    setGeneratedPlan(null);
    setLinkToDate('');
  };

  return (
    <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Encabezado Principal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }} className="neon-text-primary">
            🏋️‍♂️ Centro de Entrenamientos Específicos
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Rutinas tácticas y físicas personalizadas reactivamente según la posición y el rol de cada guerrero.
          </p>
        </div>
      </div>

      {/* --- SELECTOR DE PESTAÑAS PRINCIPALES --- */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('plan')} 
          className={`tab-btn ${activeTab === 'plan' ? 'active' : ''}`}
          style={{ fontSize: '0.9rem', padding: '10px 20px' }}
        >
          🤖 Plan Inteligente
        </button>
        <button 
          onClick={() => setActiveTab('players')} 
          className={`tab-btn ${activeTab === 'players' ? 'active' : ''}`}
          style={{ fontSize: '0.9rem', padding: '10px 20px' }}
        >
          👥 Rutinas por Jugador
        </button>
        <button 
          onClick={() => setActiveTab('catalog')} 
          className={`tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
          style={{ fontSize: '0.9rem', padding: '10px 20px' }}
        >
          📚 Catálogo General
        </button>
      </div>

      {/* ======================================================== */}
      {/* PESTAÑA 0: PLAN INTELIGENTE (MOTOR + IA)                  */}
      {/* ======================================================== */}
      {activeTab === 'plan' && (
        <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Selector de Jugador + Botón Generar */}
          <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '250px', margin: 0 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Jugador Objetivo</label>
              <select
                value={planPlayerId}
                onChange={(e) => { setPlanPlayerId(e.target.value); setGeneratedPlan(null); setCompletedExercises({}); }}
                className="form-select"
              >
                <option value="">-- Seleccionar Guerrero --</option>
                {teamPlayers.map(p => (
                  <option key={p.id} value={p.id}>#{p.camiseta} {p.name} ({p.posicion})</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleGeneratePlan}
              disabled={generating || !planPlayerId}
              className="btn-neon"
              style={{
                padding: '10px 24px',
                justifyContent: 'center',
                fontSize: '0.9rem',
                opacity: planPlayerId ? 1 : 0.5,
                whiteSpace: 'nowrap',
                background: 'linear-gradient(135deg, var(--color-primary), #00b359)'
              }}
            >
              {generating ? '⏳ Generando...' : '🤖 Generar Plan'}
            </button>
            {isGeminiConfigured() && (
              <span className="badge" style={{ background: 'rgba(0, 230, 118, 0.08)', color: 'var(--color-primary)', border: '1px solid rgba(0, 230, 118, 0.2)', fontSize: '0.7rem', padding: '6px 10px' }}>
                🧠 IA Activa
              </span>
            )}
          </div>

          {/* Plan Generado */}
          {generatedPlan ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Info del Plan */}
              <div className="glass-panel" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '0.75rem' }}>
                <div>
                  <strong style={{ color: 'var(--color-primary)' }}>{generatedPlan.playerName}</strong>
                  {generatedPlan.enrichedByAI && <span className="badge" style={{ marginLeft: '8px', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--color-gold)', border: '1px solid rgba(212, 175, 55, 0.3)', fontSize: '0.65rem', padding: '3px 8px' }}>🧠 Enriquecido con IA</span>}
                  {generatedPlan.isInjured && <span className="badge badge-injured" style={{ marginLeft: '8px', fontSize: '0.65rem', padding: '3px 8px' }}>🚑 En Recuperación</span>}
                </div>
                <span style={{ color: 'var(--color-text-muted)' }}>
                  {generatedPlan.matchFaults.length > 0 ? `🔍 Fallos detectados: ${generatedPlan.matchFaults.join(', ')}` : '✅ Sin fallos críticos detectados'}
                </span>
              </div>

              {/* Columnas Campo + Gym */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Columna Campo */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'Outfit' }}>
                    🏉 Plan Campo ({generatedPlan.plan.campo.length})
                  </h3>
                  {generatedPlan.plan.campo.map((ex, i) => {
                    const isDone = completedExercises[ex.id];
                    return (
                      <div key={i} className="glass-panel" style={{
                        padding: '15px',
                        borderLeft: ex.fromAI ? '3px solid var(--color-gold)' : '3px solid var(--color-primary)',
                        opacity: isDone ? 0.6 : 1
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 800 }}>{ex.name}</h4>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.7rem' }}>
                            <input
                              type="checkbox"
                              checked={isDone || false}
                              onChange={() => handleToggleExercise(ex.id, 'campo')}
                              style={{ transform: 'scale(1.2)', accentColor: 'var(--color-primary)' }}
                            />
                            {isDone ? '✅' : 'Completar'}
                          </label>
                        </div>
                        {ex.aiReason && (
                          <p style={{ fontSize: '0.68rem', color: 'var(--color-gold)', marginBottom: '8px', fontStyle: 'italic' }}>💡 {ex.aiReason}</p>
                        )}
                        <ul style={{ paddingLeft: '16px', fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {(ex.drills || []).map((d, di) => <li key={di}>{d}</li>)}
                        </ul>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                          <span>⏱️ {ex.durationMin} min</span>
                          <span>⭐ {'⭐'.repeat(ex.difficulty || 1)}</span>
                        </div>
                      </div>
                    );
                  })}
                  {generatedPlan.plan.campo.length === 0 && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>
                      Sin ejercicios de campo asignados
                    </p>
                  )}
                </div>

                {/* Columna Gym */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-gold)', fontFamily: 'Outfit' }}>
                    🏋️ Plan Gimnasio ({generatedPlan.plan.gym.length})
                  </h3>
                  {generatedPlan.plan.gym.map((ex, i) => {
                    const isDone = completedExercises[ex.id];
                    return (
                      <div key={i} className="glass-panel" style={{
                        padding: '15px',
                        borderLeft: ex.fromAI ? '3px solid var(--color-gold)' : '3px solid var(--color-blue)',
                        opacity: isDone ? 0.6 : 1
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 800 }}>{ex.name}</h4>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.7rem' }}>
                            <input
                              type="checkbox"
                              checked={isDone || false}
                              onChange={() => handleToggleExercise(ex.id, 'gym')}
                              style={{ transform: 'scale(1.2)', accentColor: 'var(--color-gold)' }}
                            />
                            {isDone ? '✅' : 'Completar'}
                          </label>
                        </div>
                        {ex.oneRMWeight && (
                          <div style={{ background: 'var(--bg-dark)', padding: '6px 10px', borderRadius: '4px', marginBottom: '8px', fontSize: '0.72rem', color: 'var(--color-blue)', fontWeight: 700 }}>
                            🎯 Carga: {ex.oneRMWeight} kg ({ex.loadPercentage})
                          </div>
                        )}
                        {ex.aiReason && (
                          <p style={{ fontSize: '0.68rem', color: 'var(--color-gold)', marginBottom: '8px', fontStyle: 'italic' }}>💡 {ex.aiReason}</p>
                        )}
                        <ul style={{ paddingLeft: '16px', fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {(ex.drills || []).map((d, di) => <li key={di}>{d}</li>)}
                        </ul>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                          <span>⏱️ {ex.durationMin} min</span>
                          <span>⭐ {'⭐'.repeat(ex.difficulty || 1)}</span>
                        </div>
                      </div>
                    );
                  })}
                  {generatedPlan.plan.gym.length === 0 && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>
                      Sin ejercicios de gimnasio asignados
                    </p>
                  )}
                </div>
              </div>

              {/* Recuperación */}
              {generatedPlan.plan.recuperacion.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-blue)', fontFamily: 'Outfit' }}>
                    🩹 Recuperación ({generatedPlan.plan.recuperacion.length})
                  </h3>
                  <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                    {generatedPlan.plan.recuperacion.map((ex, i) => {
                      const isDone = completedExercises[ex.id];
                      return (
                        <div key={i} className="glass-panel" style={{
                          padding: '15px',
                          borderLeft: '3px solid var(--color-blue)',
                          opacity: isDone ? 0.6 : 1
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 800 }}>{ex.name}</h4>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.7rem' }}>
                              <input
                                type="checkbox"
                                checked={isDone || false}
                                onChange={() => handleToggleExercise(ex.id, 'recuperacion')}
                                style={{ transform: 'scale(1.2)', accentColor: 'var(--color-blue)' }}
                              />
                              {isDone ? '✅' : 'Completar'}
                            </label>
                          </div>
                          <ul style={{ paddingLeft: '16px', fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {(ex.drills || []).map((d, di) => <li key={di}>{d}</li>)}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Vincular a Fecha */}
              <div className="glass-panel" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>📅 Vincular rutina a:</span>
                <select 
                  value={linkToDate} 
                  onChange={(e) => setLinkToDate(e.target.value)} 
                  className="form-select"
                  style={{ flex: 1, minWidth: '200px', padding: '8px', fontSize: '0.8rem' }}
                >
                  <option value="">-- Sin vincular --</option>
                  {schedule
                    .filter(s => s.teamCategory === activeTeam)
                    .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time))
                    .slice(0, 10)
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {s.date} {s.time} - {s.title}
                      </option>
                    ))}
                </select>
              </div>

              {/* Botón Guardar Rutina */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button onClick={handleSaveWorkout} className="btn-neon" style={{ padding: '12px 32px', fontSize: '0.9rem', justifyContent: 'center' }}>
                  💾 Guardar Rutina Completada
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '50px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '3rem' }}>🤖</span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Plan de Entrenamiento Inteligente</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', maxWidth: '500px', lineHeight: 1.6 }}>
                Selecciona un jugador y presiona <strong>Generar Plan</strong>. El motor analiza posición, fallos de partidos recientes, historial de ejercicios y estado físico para armar un plan personalizado de campo y gimnasio.
              </p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                {isGeminiConfigured() ? '🧠 Gemini enriquecerá el plan con ejercicios extra.' : '🔑 Configura Gemini en Ajustes para enriquecer con IA.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA A: RUTINAS INDIVIDUALES POR JUGADOR (PREMIUM V2) */}
      {/* ======================================================== */}
      {activeTab === 'players' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', minHeight: '500px' }} className="animated-fade">
          
          {/* Columna Izquierda: Roster de Jugadores */}
          <div className="glass-panel" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '600px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', marginBottom: '8px' }}>
              🏃‍♂️ Guerrero del Clan
            </h3>
            
            {teamPlayers.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', margin: '20px 0' }}>
                No hay jugadores registrados en esta categoría.
              </p>
            ) : (
              teamPlayers.map((player) => {
                const cat = getPlayerCategory(player);
                const isSelected = player.id === activePlayerId;
                
                // Color temático para la categoría
                let themeColor = 'var(--color-primary)';
                if (cat === 'coach') themeColor = '#a855f7'; // Purple
                if (cat === 'captain') themeColor = 'var(--color-gold)'; // Gold
                if (cat === 'backs') themeColor = '#3b82f6'; // Blue

                return (
                  <div
                    key={player.id}
                    onClick={() => setSelectedPlayerId(player.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                      border: isSelected ? `1px solid ${themeColor}` : '1px solid transparent',
                      boxShadow: isSelected ? `0 0 10px ${themeColor}20` : 'none',
                      transition: 'all 0.25s ease'
                    }}
                    className="player-list-item-hover"
                  >
                    {/* Avatar Iniciales */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${themeColor}30, ${themeColor}60)`,
                      border: `1px solid ${themeColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}>
                      {player.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>

                    {/* Datos Cortos */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '5px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isSelected ? '#ffffff' : 'var(--color-text)' }}>
                          {player.name}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: themeColor }}>
                          #{player.camiseta}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {player.posicion}
                        </span>
                        <span style={{ 
                          fontSize: '0.65rem', 
                          fontWeight: 700, 
                          padding: '2px 6px', 
                          borderRadius: '10px', 
                          background: `${themeColor}20`,
                          color: themeColor,
                          textTransform: 'uppercase'
                        }}>
                          {player.rol}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Columna Derecha: Ficha de Entrenamiento Asignada */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {selectedPlayer ? (
              <div className="glass-panel animated-slide" style={{ padding: '30px', position: 'relative', overflow: 'hidden' }}>
                {/* Decoración con degradado de fondo */}
                <div style={{
                  position: 'absolute',
                  top: '-150px',
                  right: '-150px',
                  width: '300px',
                  height: '300px',
                  borderRadius: '50%',
                  background: assignedCategory === 'coach' 
                    ? 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)'
                    : assignedCategory === 'captain'
                      ? 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%)'
                      : assignedCategory === 'backs'
                        ? 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
                  zIndex: 0,
                  pointerEvents: 'none'
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* Encabezado del Perfil de Trabajo */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '20px', marginBottom: '25px' }}>
                    <div>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 800, 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        background: assignedCategory === 'coach' ? 'rgba(168, 85, 247, 0.2)' : assignedCategory === 'captain' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: assignedCategory === 'coach' ? '#c084fc' : assignedCategory === 'captain' ? 'var(--color-gold)' : 'var(--color-primary)',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>
                        {getCategoryLabel(assignedCategory)}
                      </span>
                      
                      <h3 style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', marginTop: '10px' }}>
                        {selectedPlayer.name} {selectedPlayer.apodo && <span style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>"{selectedPlayer.apodo}"</span>}
                      </h3>
                      
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
                        Posición en Roster: <strong>{selectedPlayer.posicion}</strong> | Camiseta: <strong>#{selectedPlayer.camiseta}</strong> | Rol: <strong style={{ textTransform: 'capitalize' }}>{selectedPlayer.rol}</strong>
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Estado Físico:</p>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        fontWeight: 800, 
                        color: selectedPlayer.estado === 'activo' ? 'var(--color-primary)' : selectedPlayer.estado === 'lesionado' ? 'var(--color-danger)' : 'var(--color-gold)',
                        background: selectedPlayer.estado === 'activo' ? 'rgba(16, 185, 129, 0.1)' : selectedPlayer.estado === 'lesionado' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        display: 'inline-block',
                        marginTop: '4px',
                        textTransform: 'uppercase'
                      }}>
                        {selectedPlayer.estado === 'activo' ? '🛡️ Activo y Apto' : selectedPlayer.estado === 'lesionado' ? '🚨 En Enfermería' : '⚠️ En Observación'}
                      </span>
                    </div>
                  </div>

                  {/* Advertencia de Lesión */}
                  {selectedPlayer.estado === 'lesionado' && (
                    <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '15px', borderRadius: 'var(--radius-sm)', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <span style={{ fontSize: '1.75rem' }}>🏥</span>
                      <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-danger)' }}>GUERRERO EN REHABILITACIÓN MÉDICA</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          Debe modular la carga de la rutina al 50%. Priorizar kinesiología preventiva y evitar impactos físicos en el melé.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Listado de Rutinas del Jugador */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', color: 'var(--color-primary)' }}>
                      📋 Trabajos Tácticos & Físicos Asignados:
                    </h4>

                    {playerWorkouts.map((workout, wIdx) => (
                      <div 
                        key={wIdx} 
                        className="glass-panel" 
                        style={{ 
                          padding: '20px', 
                          borderLeft: assignedCategory === 'coach' 
                            ? '4px solid #a855f7' 
                            : assignedCategory === 'captain' 
                              ? '4px solid var(--color-gold)' 
                              : assignedCategory === 'backs' 
                                ? '4px solid #3b82f6' 
                                : '4px solid var(--color-primary)',
                          background: 'rgba(0,0,0,0.15)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                          <h5 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit' }}>{workout.title}</h5>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)' }}>
                            🎯 Enfoque: {workout.focus}
                          </span>
                        </div>

                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.5', background: 'var(--bg-dark)', padding: '10px', borderRadius: 'var(--radius-sm)', marginBottom: '15px' }}>
                          {workout.description}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ejercicios y Drills a Completar:</span>
                          <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '15px', fontSize: '0.8rem', color: 'var(--color-text)' }}>
                            {workout.drills.map((drill, dIdx) => (
                              <li key={dIdx} style={{ lineHeight: '1.4' }}>{drill}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Footer del ejercicio */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          <span>⏱️ Tiempo Estimado: <strong>{workout.duration}</strong></span>
                          <span>Dificultad: <strong style={{ color: 'var(--color-gold)' }}>{workout.difficulty}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                <span style={{ fontSize: '2.5rem', marginBottom: '15px' }}>👥</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Selecciona un Jugador</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
                  Elige un miembro del clan del menú lateral para desplegar su rutina de entrenamiento adaptativa.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA B: CATÁLOGO GENERAL DE ENTRENAMIENTOS            */}
      {/* ======================================================== */}
      {activeTab === 'catalog' && (
        <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Selector de Posiciones en Catálogo */}
          <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setActiveCategory('forwards')} 
              className={`tab-btn ${activeCategory === 'forwards' ? 'active' : ''}`}
            >
              🛡️ Delanteros (Forwards)
            </button>
            <button 
              onClick={() => setActiveCategory('backs')} 
              className={`tab-btn ${activeCategory === 'backs' ? 'active' : ''}`}
            >
              🏃‍♂️ Tres Cuartos (Backs)
            </button>
            <button 
              onClick={() => setActiveCategory('captain')} 
              className={`tab-btn ${activeCategory === 'captain' ? 'active' : ''}`}
            >
              👑 Capitanes (Liderazgo)
            </button>
            <button 
              onClick={() => setActiveCategory('coach')} 
              className={`tab-btn ${activeCategory === 'coach' ? 'active' : ''}`}
            >
              📋 Staff Técnico (Coach)
            </button>
            <button 
              onClick={() => setActiveCategory('general')} 
              className={`tab-btn ${activeCategory === 'general' ? 'active' : ''}`}
            >
              ⚡ Acondicionamiento General
            </button>
          </div>

          {/* Despliegue de Trabajos */}
          <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
            {WORKOUTS[activeCategory]?.map((w, index) => (
              <div 
                key={index}
                className="glass-panel animated-slide"
                style={{ 
                  padding: '25px', 
                  borderLeft: activeCategory === 'forwards' 
                    ? '4px solid var(--color-primary)' 
                    : activeCategory === 'backs' 
                      ? '4px solid #3b82f6' 
                      : activeCategory === 'captain'
                        ? '4px solid var(--color-gold)'
                        : activeCategory === 'coach'
                          ? '4px solid #a855f7'
                          : '4px solid var(--color-blue)' 
                }}
              >
                
                {/* Cabecera Tarjeta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '15px' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit' }}>{w.title}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>🎯 Posiciones: <strong>{w.focus}</strong></p>
                  </div>
                </div>

                {/* Descripción */}
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.5', marginBottom: '15px', background: 'var(--bg-dark)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                  {w.description}
                </p>

                {/* Ejercicios */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase' }}>📋 Rutina de Campo:</span>
                  
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '15px', fontSize: '0.8rem', color: 'var(--color-text)' }}>
                    {w.drills.map((drill, dIndex) => (
                      <li key={dIndex} style={{ lineHeight: '1.4' }}>
                        {drill}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer Tarjeta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <span>⏱️ Duración: <strong>{w.duration}</strong></span>
                  <span>Dificultad: <strong style={{ color: 'var(--color-gold)' }}>{w.difficulty}</strong></span>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}

export default TrainingHub;
