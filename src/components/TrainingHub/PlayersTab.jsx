import React from 'react';
import { WORKOUTS, getPlayerCategory, getCategoryLabel, getCategoryColor } from './constants';

function PlayersTab({ teamPlayers, selectedPlayerId, onSelectPlayer }) {
  const activePlayerId = selectedPlayerId || (teamPlayers.length > 0 ? teamPlayers[0].id : null);
  const selectedPlayer = teamPlayers.find(p => p.id === activePlayerId);
  const assignedCategory = selectedPlayer ? getPlayerCategory(selectedPlayer) : 'general';
  const themeColor = getCategoryColor(assignedCategory);

  const playerWorkouts = WORKOUTS[assignedCategory] || WORKOUTS.general;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', minHeight: '500px' }} className="animated-fade">

      <div className="glass-panel" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '600px', overflowY: 'auto' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', marginBottom: '8px' }}>
          Guerrero del Clan
        </h3>

        {teamPlayers.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', margin: '20px 0' }}>
            No hay jugadores registrados en esta categoría.
          </p>
        ) : (
          teamPlayers.map((player) => {
            const cat = getPlayerCategory(player);
            const isSelected = player.id === activePlayerId;
            const color = getCategoryColor(cat);

            return (
              <div
                key={player.id}
                onClick={() => onSelectPlayer(player.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  border: isSelected ? `1px solid ${color}` : '1px solid transparent',
                  boxShadow: isSelected ? `0 0 10px ${color}20` : 'none',
                  transition: 'all 0.25s ease'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${color}30, ${color}60)`,
                  border: `1px solid ${color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  color: '#ffffff',
                  fontSize: '0.85rem'
                }}>
                  {player.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '5px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isSelected ? '#ffffff' : 'var(--color-text)' }}>
                      {player.name}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>{player.camiseta ?? '—'}</span>
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
                      background: `${color}20`,
                      color,
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {selectedPlayer ? (
          <div className="glass-panel animated-slide" style={{ padding: '30px', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute',
              top: '-150px',
              right: '-150px',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${themeColor}15 0%, transparent 70%)`,
              zIndex: 0,
              pointerEvents: 'none'
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '20px', marginBottom: '25px' }}>
                <div>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: `${themeColor}20`,
                    color: themeColor,
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    {getCategoryLabel(assignedCategory)}
                  </span>

                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', marginTop: '10px' }}>
                    {selectedPlayer.name} {selectedPlayer.apodo && <span style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>"{selectedPlayer.apodo}"</span>}
                  </h3>

                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
                    Posición en Roster: <strong>{selectedPlayer.posicion || '—'}</strong> | Camiseta: <strong>#{selectedPlayer.camiseta ?? '—'}</strong> | Rol: <strong style={{ textTransform: 'capitalize' }}>{selectedPlayer.rol}</strong>
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Estado Físico:</p>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: selectedPlayer.estado === 'activo' ? 'var(--color-primary)' : selectedPlayer.estado === 'lesionado' ? 'var(--color-red)' : 'var(--color-gold)',
                    background: selectedPlayer.estado === 'activo' ? 'rgba(16, 185, 129, 0.1)' : selectedPlayer.estado === 'lesionado' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    display: 'inline-block',
                    marginTop: '4px',
                    textTransform: 'uppercase'
                  }}>
                    {selectedPlayer.estado === 'activo' ? 'Activo y Apto' : selectedPlayer.estado === 'lesionado' ? 'En Enfermería' : 'En Observación'}
                  </span>
                </div>
              </div>

              {selectedPlayer.estado === 'lesionado' && (
                <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '15px', borderRadius: 'var(--radius-sm)', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontSize: '1.75rem' }}>🏥</span>
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-red)' }}>GUERRERO EN REHABILITACIÓN MÉDICA</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Debe modular la carga de la rutina al 50%. Priorizar kinesiología preventiva y evitar impactos físicos en el melé.
                    </p>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', color: 'var(--color-primary)' }}>
                  Trabajos Tácticos y Físicos Asignados:
                </h4>

                {playerWorkouts.map((workout, wIdx) => (
                  <div
                    key={wIdx}
                    className="glass-panel"
                    style={{
                      padding: '20px',
                      borderLeft: `4px solid ${themeColor}`,
                      background: 'rgba(0,0,0,0.15)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                      <h5 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit' }}>{workout.title}</h5>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)' }}>
                        Enfoque: {workout.focus}
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
  );
}

export default PlayersTab;
