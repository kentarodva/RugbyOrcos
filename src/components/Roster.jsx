import React, { useContext, useState, useEffect } from 'react';
import { ClubContext, SYSTEM_ROLES, SYSTEM_ROLES_LABELS } from '../context/ClubContext';

// Helper de Gamificación: Calcular Medallas del Clan
const getPlayerBadges = (player) => {
  const list = [];
  if (!player || player.rol === 'Entrenador') return list;

  // 1. Asistencia de Hierro
  const attRate = player.attendance.total > 0 ? (player.attendance.present / player.attendance.total) : 0;
  if (player.attendance.total >= 5 && attRate >= 0.9) {
    list.push({ icon: '🌟', name: 'Orco de Hierro', color: 'var(--color-gold)', desc: 'Asistencia perfecta (>=90%)' });
  }
  
  // 2. Tacles Defensivos
  const stats = player.matchStats || [];
  const totalTackles = stats.reduce((sum, s) => sum + (s.tackles || 0), 0);
  const maxTacklesSingleMatch = stats.reduce((max, s) => Math.max(max, s.tackles || 0), 0);
  if (totalTackles >= 12 || maxTacklesSingleMatch >= 8) {
    list.push({ icon: '🛡️', name: 'Muralla Verde', color: 'var(--color-primary)', desc: 'Alta efectividad de tackle' });
  }
  
  // 3. Demoledor de Tries
  const totalTries = stats.reduce((sum, s) => sum + (s.tries || 0), 0);
  if (totalTries >= 3) {
    list.push({ icon: '🏉', name: 'Demoledor', color: '#ff3d00', desc: 'Máximo anotador de tries (>=3)' });
  }
  
  // 4. Medallas MVP
  const totalMvps = stats.filter(s => s.mvp).length;
  if (totalMvps >= 1) {
    list.push({ icon: '🏆', name: 'Gladiador (MVP)', color: 'var(--color-yellow)', desc: 'Elegido jugador del partido' });
  }
  
  return list;
};

function Roster() {
  const { 
    players, addPlayer, updatePlayer, deletePlayer, 
    recordPhysicalTest, recordInjury, updateInjuryPhase, activeTeam,
    runHiaProtocol, updateClothingSizes, updateGymStats
  } = useContext(ClubContext);

  const [search, setSearch] = useState('');
  
  // Modals States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Selected Player for details/edit
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    if (!selectedPlayer) return;
    const fresh = players.find(p => p.id === selectedPlayer.id);
    if (fresh) setSelectedPlayer(fresh);
  }, [players, selectedPlayer?.id]);

  // Form States (Agregar/Editar Jugador)
  const [formName, setFormName] = useState('');
  const [formApodo, setFormApodo] = useState('');
  const [formCamiseta, setFormCamiseta] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRol, setFormRol] = useState('Titular');
  const [formSystemRole, setFormSystemRole] = useState(SYSTEM_ROLES.JUGADOR);
  const [formPosicion, setFormPosicion] = useState('Pilar');
  const [formForce, setFormForce] = useState(50);
  const [formSpeed, setFormSpeed] = useState(50);
  const [formStamina, setFormStamina] = useState(50);
  const [formTechnique, setFormTechnique] = useState(50);

  // Form States (Registrar Lesión)
  const [showInjuryForm, setShowInjuryForm] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [injuryWeeks, setInjuryWeeks] = useState(2);

  // Form States (Registrar Test Físico Científico)
  const [showTestForm, setShowTestForm] = useState(false);
  const [test1RMSquat, setTest1RMSquat] = useState(120);
  const [test1RMBench, setTest1RMBench] = useState(90);
  const [testSprintTime, setTestSprintTime] = useState(5.3);
  const [testBroncoMin, setTestBroncoMin] = useState(5);
  const [testBroncoSec, setTestBroncoSec] = useState(10);
  const [testIllinoisTime, setTestIllinoisTime] = useState(16.5);

  // Form States (Récords de Fuerza Gym 1RM)
  const [showGymForm, setShowGymForm] = useState(false);
  const [gymSquat, setGymSquat] = useState(0);
  const [gymBench, setGymBench] = useState(0);
  const [gymDeadlift, setGymDeadlift] = useState(0);
  const [gymWeight, setGymWeight] = useState(85);

  // Form States (Tallas de Uniforme)
  const [showClothingForm, setShowClothingForm] = useState(false);
  const [jerseySize, setJerseySize] = useState('M');
  const [shortsSize, setShortsSize] = useState('M');
  const [socksSize, setSocksSize] = useState('40-42');

  // Form States (Asistente Conmoción HIA)
  const [showHiaForm, setShowHiaForm] = useState(false);
  const [hiaHeadache, setHiaHeadache] = useState(false);
  const [hiaDizziness, setHiaDizziness] = useState(false);
  const [hiaConfusion, setHiaConfusion] = useState(false);
  const [hiaNausea, setHiaNausea] = useState(false);
  const [hiaBalance, setHiaBalance] = useState(false);

  // Filtrado de Jugadores
  const teamPlayers = players.filter(p => p.teamCategory === activeTeam);
  
  const filteredPlayers = teamPlayers.filter(p => {
    const query = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      p.apodo.toLowerCase().includes(query) ||
      p.camiseta.toString().includes(search) ||
      p.posicion.toLowerCase().includes(query)
    );
  });

  // Lista de posiciones reglamentarias de Rugby
  const POSICIONES_RUGBY = [
    'Pilar', 'Talonador', 'Segunda Línea', 'Flanker', 'Octavo',
    'Medio Melé', 'Apertura', 'Centro', 'Ala', 'Zaguero', 'Ninguno (Coach)'
  ];

  const ROLES_CLUB = ['Entrenador', 'Capitán', 'Subcapitán', 'Titular', 'Suplente'];

  // Abrir Modal Agregar
  const openAddModal = () => {
    setFormName('');
    setFormApodo('');
    setFormCamiseta('');
    setFormPhone('');
    setFormEmail('');
    setFormRol('Titular');
    setFormSystemRole(SYSTEM_ROLES.JUGADOR);
    setFormPosicion('Pilar');
    setFormForce(50);
    setFormSpeed(50);
    setFormStamina(50);
    setFormTechnique(50);
    setShowAddModal(true);
  };

  // Enviar Nuevo Jugador
  const handleAddSubmit = (e) => {
    e.preventDefault();
    addPlayer({
      name: formName,
      apodo: formApodo,
      camiseta: Number(formCamiseta),
      contacto: { phone: formPhone, email: formEmail },
      rol: formRol,
      posicion: formPosicion,
      systemRole: formSystemRole,
      attributes: {
        force: Number(formForce),
        speed: Number(formSpeed),
        stamina: Number(formStamina),
        technique: Number(formTechnique)
      }
    });
    setShowAddModal(false);
  };

  // Abrir Modal Detalle
  const openDetailModal = (player) => {
    // Sincronizar jugador con base de datos real
    const actualPlayer = players.find(p => p.id === player.id) || player;
    setSelectedPlayer(actualPlayer);
    setShowDetailModal(true);
    setShowInjuryForm(false);
    setShowTestForm(false);
    setShowClothingForm(false);
    setShowHiaForm(false);
  };

  // Abrir Modal Editar
  const openEditModal = (player) => {
    setSelectedPlayer(player);
    setFormName(player.name);
    setFormApodo(player.apodo);
    setFormCamiseta(player.camiseta);
    setFormPhone(player.contacto.phone);
    setFormEmail(player.contacto.email);
    setFormRol(player.rol);
    setFormSystemRole(player.systemRole || SYSTEM_ROLES.JUGADOR);
    setFormPosicion(player.posicion);
    setShowEditModal(true);
  };

  // Enviar Modificación Jugador
  const handleEditSubmit = (e) => {
    e.preventDefault();
    const updated = {
      ...selectedPlayer,
      name: formName,
      apodo: formApodo,
      camiseta: Number(formCamiseta),
      contacto: { phone: formPhone, email: formEmail },
      rol: formRol,
      posicion: formPosicion,
      systemRole: formSystemRole
    };
    updatePlayer(updated);
    setShowEditModal(false);
  };

  // Enviar Registro de Lesión
  const handleInjurySubmit = (e) => {
    e.preventDefault();
    if (!diagnosis) return;
    recordInjury(selectedPlayer.id, diagnosis, Number(injuryWeeks));
    setDiagnosis('');
    setShowInjuryForm(false);
  };

  // Enviar Registro de Test Físico Científico (Calibración automática a RPG)
  const handleTestSubmit = (e) => {
    e.preventDefault();
    
    // 1. Fuerza (Squat + Bench relative to 320kg professional benchmark)
    const forceRPG = Math.min(100, Math.max(10, Math.round(((Number(test1RMSquat) + Number(test1RMBench)) / 320) * 100)));
    
    // 2. Velocidad (40m sprint time calibrated relative to 4.5s elite baseline)
    const speedRPG = Math.min(100, Math.max(10, Math.round(100 - (Number(testSprintTime) - 4.5) * 30)));
    
    // 3. Resistencia (Bronco total seconds calibrated relative to 260s elite baseline)
    const totalBroncoSec = Number(testBroncoMin) * 60 + Number(testBroncoSec);
    const staminaRPG = Math.min(100, Math.max(10, Math.round(100 - (totalBroncoSec - 260) * 0.5)));
    
    // 4. Técnica (Illinois Agility time calibrated relative to 14.0s elite baseline)
    const techniqueRPG = Math.min(100, Math.max(10, Math.round(100 - (Number(testIllinoisTime) - 14.0) * 12)));

    const stats = {
      force: forceRPG,
      speed: speedRPG,
      stamina: staminaRPG,
      technique: techniqueRPG
    };
    
    const today = new Date().toISOString().split('T')[0];
    recordPhysicalTest(selectedPlayer.id, today, stats);
    setShowTestForm(false);
  };

  // Enviar Registro de Fuerza de Gimnasio (1RM)
  const handleGymSubmit = (e) => {
    e.preventDefault();
    updateGymStats(selectedPlayer.id, {
      squat: Number(gymSquat),
      bench: Number(gymBench),
      deadlift: Number(gymDeadlift),
      weight: Number(gymWeight)
    });
    setShowGymForm(false);
  };

  // Cambio de Fase de Lesión (Kinesiología)
  const handlePhaseChange = (phase) => {
    updateInjuryPhase(selectedPlayer.id, phase);
  };

  // Editar Tallas de Ropa
  const handleClothingSubmit = (e) => {
    e.preventDefault();
    updateClothingSizes(selectedPlayer.id, {
      jersey: jerseySize,
      shorts: shortsSize,
      socks: socksSize
    });
    setShowClothingForm(false);
  };

  // Correr Asistente HIA (Conmociones)
  const handleHiaSubmit = (e) => {
    e.preventDefault();
    const symptomsDetected = hiaHeadache || hiaDizziness || hiaConfusion || hiaNausea || hiaBalance;
    runHiaProtocol(selectedPlayer.id, symptomsDetected);

    // Limpiar checkmarks
    setHiaHeadache(false);
    setHiaDizziness(false);
    setHiaConfusion(false);
    setHiaNausea(false);
    setHiaBalance(false);
    setShowHiaForm(false);
  };

  // Estado para modal de confirmación
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Borrar Jugador
  const handleDelete = (id) => {
    setConfirmDeleteId(id);
  };

  // --- DIBUJADOR DE GRÁFICO SVG DE RENDIMIENTO FÍSICO ---
  const renderSVGChart = (history = []) => {
    if (history.length < 2) {
      return (
        <div style={{ padding: '20px', background: 'var(--bg-dark)', borderRadius: 'var(--radius-md)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          📈 Agrega al menos 2 pruebas físicas para visualizar el gráfico de progreso.
        </div>
      );
    }

    const chartWidth = 460;
    const chartHeight = 150;
    const padding = 20;

    const xStep = (chartWidth - padding * 2) / (history.length - 1);
    
    const getPoints = (key) => {
      return history.map((h, index) => {
        const x = padding + index * xStep;
        const val = h[key] || 50;
        const y = chartHeight - padding - (val / 100) * (chartHeight - padding * 2);
        return { x, y, value: val };
      });
    };

    const drawPath = (points) => {
      if (points.length === 0) return '';
      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i].x} ${points[i].y}`;
      }
      return d;
    };

    const statsKeys = [
      { key: 'force', color: '#ff1744', name: 'Fza' },
      { key: 'speed', color: '#2979ff', name: 'Vel' },
      { key: 'stamina', color: '#00e676', name: 'Res' },
      { key: 'technique', color: '#d500f9', name: 'Téc' }
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>📈 Curva de Progreso Físico</h4>
        
        <div style={{ width: '100%', overflowX: 'auto', background: 'var(--bg-dark)', borderRadius: 'var(--radius-md)', padding: '10px 5px' }}>
          <svg width={chartWidth} height={chartHeight} style={{ overflow: 'visible' }}>
            
            {/* Grid Lines Horizontales */}
            {[25, 50, 75, 100].map(val => {
              const y = chartHeight - padding - (val / 100) * (chartHeight - padding * 2);
              return (
                <g key={val}>
                  <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="4 4" />
                  <text x={chartWidth - padding + 5} y={y + 3} fill="rgba(255,255,255,0.2)" fontSize="7" fontWeight="bold">{val}</text>
                </g>
              );
            })}

            {/* Dibujar las líneas de atributos */}
            {statsKeys.map(stat => {
              const points = getPoints(stat.key);
              const pathD = drawPath(points);
              return (
                <g key={stat.key}>
                  <path d={pathD} fill="none" stroke={stat.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 4px ${stat.color}44)` }} />
                  {points.map((pt, i) => (
                    <g key={i}>
                      <circle cx={pt.x} cy={pt.y} r="4" fill="var(--bg-dark)" stroke={stat.color} strokeWidth="2" />
                      <text x={pt.x} y={pt.y - 8} fill={stat.color} fontSize="8" fontWeight="bold" textAnchor="middle">{pt.value}</text>
                    </g>
                  ))}
                </g>
              );
            })}

            {/* Eje X (Fechas) */}
            {history.map((h, i) => {
              const x = padding + i * xStep;
              const dateStr = h.date.split('-').slice(1).join('/');
              return (
                <text key={i} x={x} y={chartHeight - 4} fill="rgba(255,255,255,0.3)" fontSize="7.5" fontWeight="600" textAnchor="middle">
                  {dateStr}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Leyenda */}
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '5px' }}>
          {statsKeys.map(st => (
            <div key={st.key} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 600 }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: st.color }} />
              <span style={{ color: 'var(--color-text-muted)' }}>{st.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Controles de Búsqueda y Roster */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        
        {/* Barra de búsqueda */}
        <div style={{ display: 'flex', gap: '10px', flex: 1, maxWidth: '400px' }}>
          <input 
            type="text"
            placeholder="🔍 Buscar por nombre, apodo o camiseta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ width: '100%', paddingLeft: '15px' }}
          />
        </div>

        {/* Botón Añadir Jugador */}
        <button onClick={openAddModal} className="btn-neon">
          🏉 Reclutar Orco
        </button>
      </div>

      {/* --- GRID DE TARJETAS DE JUGADORES --- */}
      {filteredPlayers.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          📭 No hay guerreros registrados con ese filtro en esta categoría.
        </div>
      ) : (
        <div className="grid-cards">
          {filteredPlayers.map(p => {
            const isCoach = p.rol === 'Entrenador';
            return (
              <div 
                key={p.id} 
                className="glass-panel animated-slide"
                onClick={() => openDetailModal(p)}
                style={{ 
                  padding: '20px', 
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  borderTop: isCoach 
                    ? '3px solid var(--color-blue)' 
                    : p.rol === 'Capitán' 
                      ? '3px solid var(--color-gold)' 
                      : p.estado === 'lesionado' 
                        ? '3px solid var(--color-red)' 
                        : '1px solid var(--border-glass)'
                }}
              >
                
                {/* Cabecera Tarjeta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit' }}>
                      {p.name}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                      👹 "{p.apodo}"
                    </p>
                    
                    {/* Mini badges list */}
                    {!isCoach && (() => {
                      const badges = getPlayerBadges(p);
                      if (badges.length === 0) return null;
                      return (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                          {badges.map((b, i) => (
                            <span key={i} title={b.name} style={{ fontSize: '0.8rem' }}>{b.icon}</span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  
                  {/* Número de Camiseta / Escudo */}
                  {!isCoach && (
                    <div style={{ 
                      background: 'var(--bg-input)', 
                      width: '35px', 
                      height: '35px', 
                      borderRadius: '50%', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      fontSize: '0.9rem', 
                      fontWeight: 800,
                      color: p.rol === 'Capitán' ? 'var(--color-gold)' : 'var(--color-text)',
                      border: p.rol === 'Capitán' ? '1.5px solid var(--color-gold)' : '1px solid var(--border-glass)'
                    }}>
                      #{p.camiseta}
                    </div>
                  )}
                </div>

                {/* Badges de Posición y Estado */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '15px' }}>
                  <span className="badge badge-active" style={{ background: 'var(--bg-input)', color: 'var(--color-text)' }}>
                    🏉 {p.posicion}
                  </span>
                  
                  {p.rol === 'Capitán' && <span className="badge badge-gold">👑 Capitán</span>}
                  {p.rol === 'Subcapitán' && <span className="badge badge-gold">🛡️ Subcapitán</span>}
                  {isCoach && <span className="badge badge-active" style={{ color: 'var(--color-blue)', border: '1px solid var(--color-blue)' }}>👔 Staff</span>}

                  {p.estado === 'activo' && <span className="badge badge-active">Activo 🟢</span>}
                  {p.estado === 'lesionado' && <span className="badge badge-injured">Lesionado 🔴</span>}
                  {p.estado === 'suspendido' && <span className="badge badge-suspended">🟥 Suspendido</span>}
                </div>

                {/* Atributos RPG Rápidos (Omitido para Entrenador) */}
                {!isCoach && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="rpg-stat">
                      <div className="rpg-stat-bar-container">
                        <div className="rpg-stat-bar force" style={{ width: `${p.attributes.force}%` }} />
                      </div>
                    </div>
                    <div className="rpg-stat">
                      <div className="rpg-stat-bar-container">
                        <div className="rpg-stat-bar speed" style={{ width: `${p.attributes.speed}%` }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Pie de Tarjeta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <span>📈 Nivel: {isCoach ? 'Coach' : Math.round((p.attributes.force + p.attributes.speed + p.attributes.stamina + p.attributes.technique) / 4)}</span>
                  <span style={{ color: 'var(--color-primary)' }}>Ver Ficha ➔</span>
                </div>

              </div>
            );
          })}
        </div>
      )}
      </div>

      {/* --- FORMULARIO MODAL: AGREGAR JUGADOR --- */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animated-slide">
            <h3 className="neon-text-primary" style={{ marginBottom: '20px', fontFamily: 'Outfit' }}>🏉 Reclutar Nuevo Orco</h3>
            
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>Nombre Completo</label>
                  <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ej. Grom Hellscream" className="form-input" required />
                </div>
                <div className="form-group">
                  <label>Apodo / Nickname</label>
                  <input type="text" value={formApodo} onChange={(e) => setFormApodo(e.target.value)} placeholder="Ej. El Rompelíneas" className="form-input" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>Número de Camiseta</label>
                  <input type="number" value={formCamiseta} onChange={(e) => setFormCamiseta(e.target.value)} placeholder="Ej. 8" className="form-input" required />
                </div>
                <div className="form-group">
                  <label>Rol en el Equipo</label>
                  <select value={formRol} onChange={(e) => setFormRol(e.target.value)} className="form-select">
                    {ROLES_CLUB.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Rol del Sistema (Permisos)</label>
                <select value={formSystemRole} onChange={(e) => setFormSystemRole(e.target.value)} className="form-select">
                  {Object.values(SYSTEM_ROLES).map(r => (
                    <option key={r} value={r}>{SYSTEM_ROLES_LABELS[r] || r}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Posición en Campo</label>
                <select value={formPosicion} onChange={(e) => setFormPosicion(e.target.value)} className="form-select">
                  {POSICIONES_RUGBY.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>Celular / WhatsApp</label>
                  <input type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="Ej. +57 300 000 0000" className="form-input" />
                </div>
                <div className="form-group">
                  <label>Correo Electrónico</label>
                  <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="orco@rugby.com" className="form-input" />
                </div>
              </div>

              {/* Atributos RPG */}
              <div style={{ background: 'var(--bg-dark)', padding: '15px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>💪 Atributos Iniciales RPG</h4>
                
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <label>Fuerza: {formForce}</label>
                  </div>
                  <input type="range" min="10" max="100" value={formForce} onChange={(e) => setFormForce(e.target.value)} style={{ accentColor: '#ff1744' }} />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <label>Velocidad: {formSpeed}</label>
                  </div>
                  <input type="range" min="10" max="100" value={formSpeed} onChange={(e) => setFormSpeed(e.target.value)} style={{ accentColor: '#2979ff' }} />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <label>Resistencia: {formStamina}</label>
                  </div>
                  <input type="range" min="10" max="100" value={formStamina} onChange={(e) => setFormStamina(e.target.value)} style={{ accentColor: '#00e676' }} />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <label>Técnica/Destreza: {formTechnique}</label>
                  </div>
                  <input type="range" min="10" max="100" value={formTechnique} onChange={(e) => setFormTechnique(e.target.value)} style={{ accentColor: '#d500f9' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-outline">
                  Cancelar
                </button>
                <button type="submit" className="btn-neon">
                  Reclutar Orco
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- FORMULARIO MODAL: EDITAR JUGADOR --- */}
      {showEditModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content glass-panel animated-slide">
            <h3 className="neon-text-gold" style={{ marginBottom: '20px', fontFamily: 'Outfit' }}>✏️ Editar Datos de Guerrero</h3>
            
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>Nombre Completo</label>
                  <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="form-input" required />
                </div>
                <div className="form-group">
                  <label>Apodo / Nickname</label>
                  <input type="text" value={formApodo} onChange={(e) => setFormApodo(e.target.value)} className="form-input" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>Número de Camiseta</label>
                  <input type="number" value={formCamiseta} onChange={(e) => setFormCamiseta(e.target.value)} className="form-input" required />
                </div>
                <div className="form-group">
                  <label>Rol en el Equipo</label>
                  <select value={formRol} onChange={(e) => setFormRol(e.target.value)} className="form-select">
                    {ROLES_CLUB.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Rol del Sistema (Permisos)</label>
                <select value={formSystemRole} onChange={(e) => setFormSystemRole(e.target.value)} className="form-select">
                  {Object.values(SYSTEM_ROLES).map(r => (
                    <option key={r} value={r}>{SYSTEM_ROLES_LABELS[r] || r}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Posición en Campo</label>
                <select value={formPosicion} onChange={(e) => setFormPosicion(e.target.value)} className="form-select">
                  {POSICIONES_RUGBY.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>Celular / WhatsApp</label>
                  <input type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Correo Electrónico</label>
                  <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="form-input" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-outline">
                  Cancelar
                </button>
                <button type="submit" className="btn-neon" style={{ background: 'linear-gradient(135deg, var(--color-gold), #ff8f00)', color: '#000', boxShadow: '0 4px 15px rgba(255, 179, 0, 0.3)' }}>
                  Guardar Cambios
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DETALLE COMPLETO DEL JUGADOR --- */}
      {showDetailModal && selectedPlayer && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animated-slide" style={{ maxWidth: '650px' }}>
            
            {/* Header del Perfil */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '20px', marginBottom: '20px' }}>
              <div>
                <span className="badge badge-gold" style={{ marginBottom: '8px' }}>
                  🏉 {selectedPlayer.posicion}
                </span>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Outfit' }}>{selectedPlayer.name}</h2>
                <p style={{ color: 'var(--color-primary)', fontWeight: 700 }}>👹 Apodo: "{selectedPlayer.apodo}"</p>
                
                {/* Wellness Index Gauges */}
                {selectedPlayer.rol !== 'Entrenador' && selectedPlayer.wellnessLogs && selectedPlayer.wellnessLogs.length > 0 && (() => {
                  const lastLog = selectedPlayer.wellnessLogs[selectedPlayer.wellnessLogs.length - 1];
                  const wellnessScore = Math.round(((lastLog.sleep + lastLog.soreness + lastLog.stress) / 15) * 100);
                  let badgeColor = 'var(--color-primary)';
                  let label = 'Excelente Recuperación 🟢';
                  if (wellnessScore < 50) {
                    badgeColor = 'var(--color-red)';
                    label = 'Sobrecarga / Alerta de Lesión 🔴';
                  } else if (wellnessScore < 80) {
                    badgeColor = 'var(--color-gold)';
                    label = 'Fatiga Moderada 🟡';
                  }
                  
                  return (
                    <span 
                      className="badge" 
                      style={{ 
                        background: 'rgba(255,255,255,0.02)', 
                        border: `1.5px solid ${badgeColor}`, 
                        color: badgeColor, 
                        fontSize: '0.75rem', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '8px',
                        fontWeight: 700
                      }}
                    >
                      Descanso: {wellnessScore}% — {label}
                    </span>
                  );
                })()}

                {/* RPG Neon Badges */}
{selectedPlayer.rol !== 'Entrenador' && (() => {
                const badges = getPlayerBadges(selectedPlayer);
                  if (badges.length === 0) return null;
                  return (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                      {badges.map((b, i) => (
                        <div 
                          key={i} 
                          title={b.desc}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px', 
                            background: 'rgba(255,255,255,0.03)', 
                            padding: '3px 8px', 
                            borderRadius: '4px', 
                            border: `1px solid ${b.color}`,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: b.color,
                            boxShadow: `0 0 8px ${b.color}22`
                          }}
                        >
                          <span>{b.icon}</span>
                          <span>{b.name}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                  📞 {selectedPlayer.contacto.phone || 'Sin número'} | ✉️ {selectedPlayer.contacto.email || 'Sin correo'}
                </p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  #{selectedPlayer.camiseta}
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={() => openEditModal(selectedPlayer)} className="btn-outline" style={{ padding: '6px 10px', fontSize: '0.75rem' }}>
                    ✏️ Editar
                  </button>
                  <button onClick={() => handleDelete(selectedPlayer.id)} className="btn-outline" style={{ padding: '6px 10px', fontSize: '0.75rem', color: 'var(--color-red)', borderColor: 'rgba(255, 61, 0, 0.2)' }}>
                    ❌ Dar Baja
                  </button>
                </div>
              </div>
            </div>

            {/* Cuerpo del Perfil */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Sección: Atributos RPG */}
              <div style={{ background: 'var(--bg-dark)', padding: '20px', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-primary)' }}>💪 Atributos Deportivos RPG</h4>
                  <button onClick={() => setShowTestForm(true)} className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                    + Registrar Test Físico
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="rpg-stat">
                    <div className="rpg-stat-header">
                      <span>Fuerza</span>
                      <span>{selectedPlayer.attributes.force}/100</span>
                    </div>
                    <div className="rpg-stat-bar-container">
                      <div className="rpg-stat-bar force" style={{ width: `${selectedPlayer.attributes.force}%` }} />
                    </div>
                  </div>
                  
                  <div className="rpg-stat">
                    <div className="rpg-stat-header">
                      <span>Velocidad</span>
                      <span>{selectedPlayer.attributes.speed}/100</span>
                    </div>
                    <div className="rpg-stat-bar-container">
                      <div className="rpg-stat-bar speed" style={{ width: `${selectedPlayer.attributes.speed}%` }} />
                    </div>
                  </div>

                  <div className="rpg-stat">
                    <div className="rpg-stat-header">
                      <span>Resistencia</span>
                      <span>{selectedPlayer.attributes.stamina}/100</span>
                    </div>
                    <div className="rpg-stat-bar-container">
                      <div className="rpg-stat-bar stamina" style={{ width: `${selectedPlayer.attributes.stamina}%` }} />
                    </div>
                  </div>

                  <div className="rpg-stat">
                    <div className="rpg-stat-header">
                      <span>Técnica / Destreza</span>
                      <span>{selectedPlayer.attributes.technique}/100</span>
                    </div>
                    <div className="rpg-stat-bar-container">
                      <div className="rpg-stat-bar technique" style={{ width: `${selectedPlayer.attributes.technique}%` }} />
                    </div>
                  </div>
                </div>

                {/* Formulario Test Físico Científico */}
                {showTestForm && (
                  <form onSubmit={handleTestSubmit} style={{ marginTop: '20px', padding: '20px', background: 'rgba(0,230,118,0.02)', border: '1px dashed var(--color-primary)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    
                    <div>
                      <h5 style={{ fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 800 }}>📋 REGISTRO DE TEST CLÍNICO Y ATHLETIC COMBINE</h5>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        Introduce las métricas físicas y el motor de calibración deportiva mapeará automáticamente su rango RPG (10-100) basándose en las marcas de la Premiership y Super Rugby.
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
                      {/* Fuerza */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>🏋️‍♂️ Fuerza: 1RM Sentadilla (kg)</label>
                        <input type="number" min="30" max="300" value={test1RMSquat} onChange={(e) => setTest1RMSquat(e.target.value)} className="form-input" required />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>🏋️‍♂️ Fuerza: 1RM Press Banca (kg)</label>
                        <input type="number" min="20" max="250" value={test1RMBench} onChange={(e) => setTest1RMBench(e.target.value)} className="form-input" required />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
                      {/* Velocidad */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>⚡ Velocidad: Sprint 40m (seg)</label>
                        <input type="number" step="0.01" min="4.0" max="10.0" value={testSprintTime} onChange={(e) => setTestSprintTime(e.target.value)} className="form-input" required />
                      </div>

                      {/* Agilidad / Illinois */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>🔀 Agilidad: Test Illinois (seg)</label>
                        <input type="number" step="0.01" min="10.0" max="25.0" value={testIllinoisTime} onChange={(e) => setTestIllinoisTime(e.target.value)} className="form-input" required />
                      </div>
                    </div>

                    {/* Resistencia / Bronco */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--color-text)', display: 'block', marginBottom: '8px', fontWeight: 700 }}>
                        🏃‍♂️ Resistencia: Tiempo Test Bronco (1.2km Shuttles)
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Minutos</span>
                          <input type="number" min="3" max="8" value={testBroncoMin} onChange={(e) => setTestBroncoMin(e.target.value)} className="form-input" required />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Segundos</span>
                          <input type="number" min="0" max="59" value={testBroncoSec} onChange={(e) => setTestBroncoSec(e.target.value)} className="form-input" required />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '5px' }}>
                      <button type="button" onClick={() => setShowTestForm(false)} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                        Cancelar
                      </button>
                      <button type="submit" className="btn-neon" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                        💥 Calibrar RPG
                      </button>
                    </div>

                  </form>
                )}

                <div style={{ marginTop: '20px' }}>
                  {renderSVGChart(selectedPlayer.history)}
                </div>
              </div>

              {/* Sección: Kinesiología & Lesiones */}
              <div style={{ background: 'var(--bg-dark)', padding: '20px', borderRadius: 'var(--radius-lg)', borderLeft: selectedPlayer.estado === 'lesionado' ? '4px solid var(--color-red)' : '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-red)' }}>🚑 Control Clínico de Rehabilitación</h4>
                  
                  {selectedPlayer.estado !== 'lesionado' && (
                    <button onClick={() => setShowInjuryForm(true)} className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--color-red)', borderColor: 'rgba(255,61,0,0.2)' }}>
                      + Ingresar a Clínica
                    </button>
                  )}
                </div>

                {selectedPlayer.estado === 'lesionado' ? (
                  <div>
                    {selectedPlayer.injuryLog && selectedPlayer.injuryLog[0] && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span>🩺 Diagnóstico: <strong>{selectedPlayer.injuryLog[0].diagnosis}</strong></span>
                          <span style={{ color: 'var(--color-red)' }}>⏳ {selectedPlayer.injuryLog[0].weeks} Semanas de baja</span>
                        </div>
                        
                        <div className="form-group" style={{ marginTop: '10px' }}>
                          <label>Fase de Recuperación Médica</label>
                          <select 
                            value={selectedPlayer.injuryLog[0].phase} 
                            onChange={(e) => handlePhaseChange(e.target.value)}
                            className="form-select"
                            style={{ borderColor: 'var(--color-red)', color: 'var(--color-red)' }}
                          >
                            <option value="1">Fase 1: Reposo Absoluto 🛑</option>
                            <option value="2">Fase 2: Fortalecimiento (Gym) 🏋️‍♂️</option>
                            <option value="3">Fase 3: Reacondicionamiento en Campo (Trote) 🏃‍♂️</option>
                            <option value="4">Fase 4: Alta Médica / Prueba de Contacto 🟢</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    🟢 El jugador se encuentra en óptimo estado físico para entrenamientos y partidos.
                  </p>
                )}

                {/* Formulario Clínico */}
                {showInjuryForm && (
                  <form onSubmit={handleInjurySubmit} style={{ marginTop: '15px', padding: '15px', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--color-red)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h5 style={{ fontSize: '0.8rem', color: 'var(--color-red)', fontWeight: 700 }}>🚨 EXPEDIENTE DE LESIÓN</h5>
                    <div className="form-group">
                      <label>Diagnóstico Médico</label>
                      <input type="text" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Ej. Esguince de tobillo grado I" className="form-input" required />
                    </div>
                    <div className="form-group">
                      <label>Semanas Estimadas de Baja</label>
                      <input type="number" min="1" max="52" value={injuryWeeks} onChange={(e) => setInjuryWeeks(e.target.value)} className="form-input" required />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '5px' }}>
                      <button type="button" onClick={() => setShowInjuryForm(false)} className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Cancelar</button>
                      <button type="submit" className="btn-neon" style={{ padding: '5px 10px', fontSize: '0.75rem', background: 'var(--color-red)', boxShadow: '0 4px 15px rgba(255,61,0,0.3)' }}>Ingresar</button>
                    </div>
                  </form>
                )}
              </div>

              {/* Sección: Récords de Fuerza 1RM (Gimnasio) */}
              {selectedPlayer.rol !== 'Entrenador' && (
                <div style={{ background: 'var(--bg-dark)', padding: '20px', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid var(--color-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-primary)' }}>🏋️‍♂️ Récords de Fuerza RPG (1RM)</h4>
                    <button 
                      onClick={() => {
                        setGymSquat(selectedPlayer.gymStats?.squat || 0);
                        setGymBench(selectedPlayer.gymStats?.bench || 0);
                        setGymDeadlift(selectedPlayer.gymStats?.deadlift || 0);
                        setGymWeight(selectedPlayer.weight || 85);
                        setShowGymForm(!showGymForm);
                      }} 
                      className="btn-outline" 
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    >
                      {showGymForm ? 'Cancelar' : '✏️ Actualizar Levantes'}
                    </button>
                  </div>

                  {!showGymForm ? (
                    (() => {
                      const squat = selectedPlayer.gymStats?.squat || 0;
                      const bench = selectedPlayer.gymStats?.bench || 0;
                      const deadlift = selectedPlayer.gymStats?.deadlift || 0;
                      const weight = selectedPlayer.weight || 85;
                      const totalLifts = squat + bench + deadlift;
                      const ratio = weight > 0 ? (totalLifts / weight).toFixed(2) : '0.00';
                      
                      let rank = 'Principiante 🏅';
                      let rankColor = 'var(--color-text-muted)';
                      if (ratio >= 5.0) {
                        rank = 'Élite del Clan 🥇🔥';
                        rankColor = 'var(--color-primary)';
                      } else if (ratio >= 4.0) {
                        rank = 'Avanzado 🥈⚔️';
                        rankColor = 'var(--color-gold)';
                      } else if (ratio >= 3.0) {
                        rank = 'Intermedio 🥉';
                        rankColor = 'var(--color-blue)';
                      }

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 5px', borderRadius: 'var(--radius-sm)' }}>
                              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block' }}>SENTADILLA</span>
                              <strong style={{ fontSize: '1rem', color: 'var(--color-primary)' }}>{squat} Kg</strong>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 5px', borderRadius: 'var(--radius-sm)' }}>
                              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block' }}>PECHO (BENCH)</span>
                              <strong style={{ fontSize: '1rem', color: 'var(--color-gold)' }}>{bench} Kg</strong>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 5px', borderRadius: 'var(--radius-sm)' }}>
                              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block' }}>PESO MUERTO</span>
                              <strong style={{ fontSize: '1rem', color: 'var(--color-blue)' }}>{deadlift} Kg</strong>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 5px', borderRadius: 'var(--radius-sm)' }}>
                              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block' }}>PESO CORPORAL</span>
                              <strong style={{ fontSize: '1rem', color: 'var(--color-text)' }}>{weight} Kg</strong>
                            </div>
                          </div>

                          <div style={{ background: 'rgba(255, 61, 0, 0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '12px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Índice de Fuerza Relativa:</span>
                              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: rankColor, marginTop: '2px' }}>{ratio} x Peso Corp.</h4>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block' }}>RANGO TÁCTICO</span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: rankColor }}>{rank}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <form onSubmit={handleGymSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--color-primary)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="form-group">
                          <label style={{ fontSize: '0.75rem' }}>Sentadilla 1RM (Kg)</label>
                          <input type="number" value={gymSquat} onChange={(e) => setGymSquat(Number(e.target.value))} className="form-input" required />
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '0.75rem' }}>Press de Banca 1RM (Kg)</label>
                          <input type="number" value={gymBench} onChange={(e) => setGymBench(Number(e.target.value))} className="form-input" required />
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '0.75rem' }}>Peso Muerto 1RM (Kg)</label>
                          <input type="number" value={gymDeadlift} onChange={(e) => setGymDeadlift(Number(e.target.value))} className="form-input" required />
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '0.75rem' }}>Peso Corporal Actual (Kg)</label>
                          <input type="number" value={gymWeight} onChange={(e) => setGymWeight(Number(e.target.value))} className="form-input" required />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '5px' }}>
                        <button type="button" onClick={() => setShowGymForm(false)} className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Cancelar</button>
                        <button type="submit" className="btn-neon" style={{ padding: '5px 10px', fontSize: '0.75rem' }}>Guardar Récord</button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Sección: Logística (Tallas) & HIA Conmociones */}
{selectedPlayer.rol !== 'Entrenador' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '15px' }}>
                  
                  {/* TALLAS DE UNIFORME */}
                  <div style={{ background: 'var(--bg-dark)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-gold)' }}>👕 Tallas de Uniforme</h4>
                      <button 
                        onClick={() => {
                          const sizes = selectedPlayer.clothingSizes || { jersey: 'M', shorts: 'M', socks: '40-42' };
                          setJerseySize(sizes.jersey);
                          setShortsSize(sizes.shorts);
                          setSocksSize(sizes.socks);
                          setShowClothingForm(!showClothingForm);
                        }} 
                        className="btn-outline" 
                        style={{ padding: '3px 6px', fontSize: '0.7rem' }}
                      >
                        {showClothingForm ? 'Cerrar' : '✏️ Editar'}
                      </button>
                    </div>

                    {!showClothingForm ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center', fontSize: '0.8rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 5px', borderRadius: '4px' }}>
                          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.65rem' }}>JERSEY</span>
                          <strong>{selectedPlayer.clothingSizes?.jersey || 'N/A'}</strong>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 5px', borderRadius: '4px' }}>
                          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.65rem' }}>SHORTS</span>
                          <strong>{selectedPlayer.clothingSizes?.shorts || 'N/A'}</strong>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 5px', borderRadius: '4px' }}>
                          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.65rem' }}>MEDIAS</span>
                          <strong>{selectedPlayer.clothingSizes?.socks || 'N/A'}</strong>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleClothingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
                          <div className="form-group">
                            <label style={{ fontSize: '0.6rem' }}>Jersey</label>
                            <input type="text" value={jerseySize} onChange={(e) => setJerseySize(e.target.value.toUpperCase())} className="form-input" style={{ padding: '4px', fontSize: '0.75rem' }} required />
                          </div>
                          <div className="form-group">
                            <label style={{ fontSize: '0.6rem' }}>Shorts</label>
                            <input type="text" value={shortsSize} onChange={(e) => setShortsSize(e.target.value.toUpperCase())} className="form-input" style={{ padding: '4px', fontSize: '0.75rem' }} required />
                          </div>
                          <div className="form-group">
                            <label style={{ fontSize: '0.6rem' }}>Medias</label>
                            <input type="text" value={socksSize} onChange={(e) => setSocksSize(e.target.value)} className="form-input" style={{ padding: '4px', fontSize: '0.75rem' }} required />
                          </div>
                        </div>
                        <button type="submit" className="btn-neon" style={{ padding: '5px', fontSize: '0.7rem', justifyContent: 'center' }}>
                          Guardar Tallas
                        </button>
                      </form>
                    )}
                  </div>

                  {/* PROTOCOLO DE CONMOCIÓN HIA */}
                  <div style={{ background: 'var(--bg-dark)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-red)' }}>🧠 Protocolo Conmoción HIA</h4>
                      <button 
                        onClick={() => setShowHiaForm(!showHiaForm)} 
                        className="btn-outline" 
                        style={{ padding: '3px 6px', fontSize: '0.7rem', color: 'var(--color-red)', borderColor: 'rgba(255, 61, 0, 0.2)' }}
                      >
                        {showHiaForm ? 'Cerrar' : '⚠️ Correr Test'}
                      </button>
                    </div>

                    {!showHiaForm ? (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                        🏥 <strong>World Rugby HIA</strong>: Evalúa de inmediato golpes de cabeza sospechosos en cancha para aplicar exclusión y descanso obligatorio.
                      </div>
                    ) : (
                      <form onSubmit={handleHiaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '110px', overflowY: 'auto', paddingRight: '5px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={hiaHeadache} onChange={(e) => setHiaHeadache(e.target.checked)} />
                            🤕 Dolor / Presión de Cabeza
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={hiaDizziness} onChange={(e) => setHiaDizziness(e.target.checked)} />
                            🌀 Mareo o Inestabilidad
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={hiaConfusion} onChange={(e) => setHiaConfusion(e.target.checked)} />
                            🧠 Confusión o Desorientación
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={hiaNausea} onChange={(e) => setHiaNausea(e.target.checked)} />
                            🤮 Náuseas / Vómitos
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={hiaBalance} onChange={(e) => setHiaBalance(e.target.checked)} />
                            🚶 Pérdida de Equilibrio
                          </label>
                        </div>
                        <button 
                          type="submit" 
                          className="btn-neon" 
                          style={{ 
                            padding: '6px', 
                            fontSize: '0.7rem', 
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, var(--color-red), #d50000)',
                            color: '#fff',
                            boxShadow: '0 2px 8px rgba(255, 61, 0, 0.2)'
                          }}
                        >
                          Confirmar Diagnóstico HIA
                        </button>
                      </form>
                    )}
                  </div>

                </div>
              )}

            </div>

            {/* SECCIÓN PREMIUM: HISTORIAL DE BATALLAS (ESTADÍSTICAS TÉCNICAS) */}
            {selectedPlayer.rol !== 'Entrenador' && (
              <div style={{ background: 'var(--bg-dark)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)', marginTop: '20px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '15px' }}>
                  📊 Historial de Batallas (Estadísticas Técnicas)
                </h4>

                {/* Acumuladores de Carrera / Temporada */}
                {(() => {
                  const stats = selectedPlayer.matchStats || [];
                  const totalTries = stats.reduce((sum, s) => sum + (s.tries || 0), 0);
                  const totalConversions = stats.reduce((sum, s) => sum + (s.conversions || 0), 0);
                  const totalTackles = stats.reduce((sum, s) => sum + (s.tackles || 0), 0);
                  const totalTurnovers = stats.reduce((sum, s) => sum + (s.turnovers || 0), 0);
                  const totalMvp = stats.filter(s => s.mvp).length;

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', textAlign: 'center' }}>
                        <div style={{ background: 'rgba(0, 230, 118, 0.02)', border: '1px solid rgba(0, 230, 118, 0.1)', padding: '8px 4px', borderRadius: 'var(--radius-sm)' }}>
                          <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', display: 'block' }}>ENSAYOS</span>
                          <strong style={{ fontSize: '1rem', color: 'var(--color-primary)' }}>🏉 {totalTries}</strong>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '8px 4px', borderRadius: 'var(--radius-sm)' }}>
                          <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', display: 'block' }}>CONV.</span>
                          <strong style={{ fontSize: '1rem', color: '#fff' }}>🎯 {totalConversions}</strong>
                        </div>
                        <div style={{ background: 'rgba(255, 179, 0, 0.02)', border: '1px solid rgba(255, 179, 0, 0.1)', padding: '8px 4px', borderRadius: 'var(--radius-sm)' }}>
                          <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', display: 'block' }}>PLACAJES</span>
                          <strong style={{ fontSize: '1rem', color: 'var(--color-gold)' }}>🛡️ {totalTackles}</strong>
                        </div>
                        <div style={{ background: 'rgba(33, 150, 243, 0.02)', border: '1px solid rgba(33, 150, 243, 0.1)', padding: '8px 4px', borderRadius: 'var(--radius-sm)' }}>
                          <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', display: 'block' }}>TURNOVERS</span>
                          <strong style={{ fontSize: '1rem', color: 'var(--color-blue)' }}>🔄 {totalTurnovers}</strong>
                        </div>
                        <div style={{ background: 'rgba(255, 234, 0, 0.02)', border: '1px solid rgba(255, 234, 0, 0.1)', padding: '8px 4px', borderRadius: 'var(--radius-sm)' }}>
                          <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', display: 'block' }}>MVP</span>
                          <strong style={{ fontSize: '1rem', color: 'var(--color-gold)' }}>⭐ {totalMvp}</strong>
                        </div>
                      </div>

                      {/* Tabla de Historial Detallado */}
                      {stats.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', margin: '10px 0' }}>
                          📭 Aún no se han disputado batallas registradas para este guerrero.
                        </p>
                      ) : (
                        <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '5px' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-text-muted)' }}>
                                <th style={{ padding: '6px 4px' }}>FECHA</th>
                                <th style={{ padding: '6px 4px' }}>RIVAL</th>
                                <th style={{ padding: '6px 4px', textAlign: 'center' }}>🏉</th>
                                <th style={{ padding: '6px 4px', textAlign: 'center' }}>🎯</th>
                                <th style={{ padding: '6px 4px', textAlign: 'center' }}>🛡️</th>
                                <th style={{ padding: '6px 4px', textAlign: 'center' }}>🔄</th>
                                <th style={{ padding: '6px 4px', textAlign: 'center' }}>MVP</th>
                              </tr>
                            </thead>
                            <tbody>
                              {stats.slice().reverse().map(st => (
                                <tr key={st.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontWeight: st.mvp ? 700 : 400 }}>
                                  <td style={{ padding: '8px 4px', color: 'var(--color-text-muted)' }}>{st.date}</td>
                                  <td style={{ padding: '8px 4px' }}>{st.opponent}</td>
                                  <td style={{ padding: '8px 4px', textAlign: 'center', color: st.tries > 0 ? 'var(--color-primary)' : 'inherit' }}>{st.tries}</td>
                                  <td style={{ padding: '8px 4px', textAlign: 'center' }}>{st.conversions}</td>
                                  <td style={{ padding: '8px 4px', textAlign: 'center', color: st.tackles >= 10 ? 'var(--color-gold)' : 'inherit' }}>{st.tackles}</td>
                                  <td style={{ padding: '8px 4px', textAlign: 'center' }}>{st.turnovers}</td>
                                  <td style={{ padding: '8px 4px', textAlign: 'center' }}>{st.mvp ? '👑' : '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Footer Modal */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '25px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '15px' }}>
              <button onClick={() => setShowDetailModal(false)} className="btn-neon">
                Cerrar Ficha
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal de Confirmación para Eliminar */}
      {confirmDeleteId && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animated-slide" style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>⚠️</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit', marginBottom: '10px', color: 'var(--color-red)' }}>
              Dar de Baja al Orco
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
              Esta acción es irreversible. El guerrero será eliminado permanentemente del roster del clan.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setConfirmDeleteId(null)} className="btn-outline">
                Cancelar
              </button>
              <button
                onClick={() => {
                  deletePlayer(confirmDeleteId);
                  setConfirmDeleteId(null);
                  setShowDetailModal(false);
                }}
                className="btn-neon"
                style={{ background: 'linear-gradient(135deg, var(--color-red), #d50000)', color: '#fff', boxShadow: '0 4px 15px rgba(255, 61, 0, 0.3)' }}
              >
                Confirmar Baja
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Roster;
