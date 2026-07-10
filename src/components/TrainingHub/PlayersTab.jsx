import React, { useState } from 'react';
import ExerciseCard from './ExerciseCard';

function PlayersTab({
  teamPlayers, selectedPlayerId, onSelectPlayer,
  generatedPlan, generating, completedExercises,
  linkToDate, setLinkToDate, scheduledEvents,
  onGeneratePlan, onToggleExercise, onSaveWorkout
}) {
  const activePlayerId = selectedPlayerId || null;

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
            const a = player.attributes || {};
            const avg = Object.values(a).length > 0 ? Math.round(Object.values(a).reduce((s, v) => s + v, 0) / Object.values(a).length) : 0;
            const color = player.rol === 'Capitan' ? 'var(--color-gold)' : player.rol === 'Entrenador' ? '#a855f7' : player.estado === 'lesionado' ? 'var(--color-red)' : 'var(--color-primary)';
            const isSelected = player.id === activePlayerId;

            return (
              <div
                key={player.id}
                onClick={() => onSelectPlayer(player.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  border: isSelected ? `1px solid ${color}` : '1px solid transparent',
                  boxShadow: isSelected ? `0 0 10px ${color}20` : 'none',
                  transition: 'all 0.25s ease'
                }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: `linear-gradient(135deg, ${color}30, ${color}60)`,
                  border: `1px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, color: '#fff', fontSize: '0.75rem'
                }}>
                  {player.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '5px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isSelected ? '#ffffff' : 'var(--color-text)' }}>
                      {player.name}
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color }}>{avg} pts</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{player.posicion || '—'}</span>
                    {player.makgora_team_id && (
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px', borderRadius: '8px', background: 'rgba(212,175,55,0.15)', color: 'var(--color-gold)' }}>M</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {!activePlayerId ? (
          <div className="glass-panel" style={{ padding: '50px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '3rem' }}>👆</span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Selecciona un Guerrero</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', maxWidth: '400px' }}>Elige un jugador de la lista para generar su plan de entrenamiento.</p>
          </div>
        ) : generating ? (
          <div className="glass-panel" style={{ padding: '50px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '3rem' }}>🤖</span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Generando plan personalizado...</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>La IA está analizando el historial completo del jugador.</p>
          </div>
        ) : !generatedPlan ? (
          <div className="glass-panel" style={{ padding: '50px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '3rem' }}>🧠</span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Sin plan de entrenamiento</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', maxWidth: '400px' }}>
              Genera un plan con IA para este guerrero.
            </p>
            <button onClick={() => activePlayerId && onGeneratePlan(activePlayerId)}
              className="btn-neon" style={{ padding: '12px 28px', fontSize: '0.85rem', justifyContent: 'center' }}>
              🧠 Generar Plan con IA
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '0.75rem' }}>
              <div>
                <strong style={{ color: 'var(--color-primary)' }}>{generatedPlan.playerName}</strong>
                {generatedPlan.enrichedByAI && <span className="badge" style={{ marginLeft: '8px', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--color-gold)', border: '1px solid rgba(212, 175, 55, 0.3)', fontSize: '0.65rem', padding: '3px 8px' }}>IA Multi-Proveedor</span>}
                {generatedPlan.isInjured && <span className="badge badge-injured" style={{ marginLeft: '8px', fontSize: '0.65rem', padding: '3px 8px' }}>En Recuperación</span>}
              </div>
              <span style={{ color: 'var(--color-text-muted)' }}>
                {generatedPlan.matchFaults.length > 0 ? `Fallos: ${generatedPlan.matchFaults.join(', ')}` : 'Sin fallos críticos'}
              </span>
            </div>

            {generatedPlan.aiAnalysis && (
              <div style={{ padding: '15px', background: 'rgba(255,179,0,0.05)', border: '1px solid rgba(255,179,0,0.15)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--color-gold)', lineHeight: 1.5 }}>
                <strong>Análisis IA:</strong> {generatedPlan.aiAnalysis}
                {generatedPlan.aiRisks?.length > 0 && <div style={{ marginTop: '8px', color: 'var(--color-red)' }}>⚠️ Riesgos: {generatedPlan.aiRisks.join(' | ')}</div>}
                {generatedPlan.aiGoals?.length > 0 && <div style={{ marginTop: '6px', color: 'var(--color-primary)' }}>🎯 Metas: {generatedPlan.aiGoals.join(' | ')}</div>}
                {generatedPlan.aiRecommendations && (
                  <div style={{ marginTop: '8px', fontSize: '0.72rem', color: 'var(--color-blue)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {generatedPlan.aiRecommendations.sueno && <span>😴 {generatedPlan.aiRecommendations.sueno}</span>}
                    {generatedPlan.aiRecommendations.nutricion && <span>🥗 {generatedPlan.aiRecommendations.nutricion}</span>}
                    {generatedPlan.aiRecommendations.prevencion && <span>🛡️ {generatedPlan.aiRecommendations.prevencion}</span>}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'Outfit' }}>Campo ({generatedPlan.plan.campo.length})</h3>
                {generatedPlan.plan.campo.map((ex, i) => (
                  <ExerciseCard key={i} exercise={ex} isDone={completedExercises[ex.id]} onToggle={onToggleExercise} borderColor={ex.fromAI ? 'var(--color-gold)' : 'var(--color-primary)'} />
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-gold)', fontFamily: 'Outfit' }}>Gym ({generatedPlan.plan.gym.length})</h3>
                {generatedPlan.plan.gym.map((ex, i) => (
                  <ExerciseCard key={i} exercise={ex} isDone={completedExercises[ex.id]} onToggle={onToggleExercise} borderColor={ex.fromAI ? 'var(--color-gold)' : 'var(--color-blue)'} />
                ))}
              </div>
            </div>

            {generatedPlan.plan.recuperacion.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-blue)', fontFamily: 'Outfit' }}>Recuperación ({generatedPlan.plan.recuperacion.length})</h3>
                <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                  {generatedPlan.plan.recuperacion.map((ex, i) => (
                    <ExerciseCard key={i} exercise={ex} isDone={completedExercises[ex.id]} onToggle={onToggleExercise} borderColor="var(--color-blue)" />
                  ))}
                </div>
              </div>
            )}

            <div className="glass-panel" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Vincular a:</span>
              <select value={linkToDate} onChange={(e) => setLinkToDate(e.target.value)} className="form-select" style={{ flex: 1, minWidth: '200px', padding: '8px', fontSize: '0.8rem' }}>
                <option value="">-- Sin vincular --</option>
                {scheduledEvents.map(s => <option key={s.id} value={s.id}>{s.date} {s.time} - {s.title}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={onSaveWorkout} className="btn-neon" style={{ padding: '12px 32px', fontSize: '0.9rem', justifyContent: 'center' }}>Guardar Rutina Completada</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayersTab;
