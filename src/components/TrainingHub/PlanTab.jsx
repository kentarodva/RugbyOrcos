import React from 'react';
import { isGeminiConfigured } from '../../engine/multiProviderCoach';
import ExerciseCard from './ExerciseCard';

function PlanTab({
  teamPlayers,
  planPlayerId,
  generatedPlan,
  generating,
  completedExercises,
  linkToDate,
  setLinkToDate,
  scheduledEvents,
  onGeneratePlan,
  onSelectPlayer,
  onToggleExercise,
  onSaveWorkout
}) {
  return (
    <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: 1, minWidth: '250px', margin: 0 }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Jugador Objetivo</label>
          <select
            value={planPlayerId}
            onChange={(e) => onSelectPlayer(e.target.value)}
            className="form-select"
          >
            <option value="">-- Seleccionar Guerrero --</option>
            {teamPlayers.map(p => (
              <option key={p.id} value={p.id}>#{p.camiseta ?? '—'} {p.name} ({p.posicion || '—'})</option>
            ))}
          </select>
        </div>
        <button
          onClick={onGeneratePlan}
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
          {generating ? 'Generando...' : 'Generar Plan'}
        </button>
        {isGeminiConfigured() && (
          <span className="badge" style={{ background: 'rgba(0, 230, 118, 0.08)', color: 'var(--color-primary)', border: '1px solid rgba(0, 230, 118, 0.2)', fontSize: '0.7rem', padding: '6px 10px' }}>
            IA Activa
          </span>
        )}
      </div>

      {generatedPlan ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '0.75rem' }}>
            <div>
              <strong style={{ color: 'var(--color-primary)' }}>{generatedPlan.playerName}</strong>
              {generatedPlan.enrichedByAI && <span className="badge" style={{ marginLeft: '8px', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--color-gold)', border: '1px solid rgba(212, 175, 55, 0.3)', fontSize: '0.65rem', padding: '3px 8px' }}>Enriquecido con IA</span>}
              {generatedPlan.isInjured && <span className="badge badge-injured" style={{ marginLeft: '8px', fontSize: '0.65rem', padding: '3px 8px' }}>En Recuperación</span>}
            </div>
            <span style={{ color: 'var(--color-text-muted)' }}>
              {generatedPlan.matchFaults.length > 0 ? `Fallos detectados: ${generatedPlan.matchFaults.join(', ')}` : 'Sin fallos críticos detectados'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'Outfit' }}>
                Plan Campo ({generatedPlan.plan.campo.length})
              </h3>
              {generatedPlan.plan.campo.map((ex, i) => (
                <ExerciseCard
                  key={i}
                  exercise={ex}
                  isDone={completedExercises[ex.id]}
                  onToggle={onToggleExercise}
                  borderColor={ex.fromAI ? 'var(--color-gold)' : 'var(--color-primary)'}
                />
              ))}
              {generatedPlan.plan.campo.length === 0 && (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>
                  Sin ejercicios de campo asignados
                </p>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-gold)', fontFamily: 'Outfit' }}>
                Plan Gimnasio ({generatedPlan.plan.gym.length})
              </h3>
              {generatedPlan.plan.gym.map((ex, i) => (
                <ExerciseCard
                  key={i}
                  exercise={ex}
                  isDone={completedExercises[ex.id]}
                  onToggle={onToggleExercise}
                  borderColor={ex.fromAI ? 'var(--color-gold)' : 'var(--color-blue)'}
                />
              ))}
              {generatedPlan.plan.gym.length === 0 && (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>
                  Sin ejercicios de gimnasio asignados
                </p>
              )}
            </div>
          </div>

          {generatedPlan.plan.recuperacion.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-blue)', fontFamily: 'Outfit' }}>
                Recuperación ({generatedPlan.plan.recuperacion.length})
              </h3>
              <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                {generatedPlan.plan.recuperacion.map((ex, i) => (
                  <ExerciseCard
                    key={i}
                    exercise={ex}
                    isDone={completedExercises[ex.id]}
                    onToggle={onToggleExercise}
                    borderColor="var(--color-blue)"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="glass-panel" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Vincular rutina a:</span>
            <select
              value={linkToDate}
              onChange={(e) => setLinkToDate(e.target.value)}
              className="form-select"
              style={{ flex: 1, minWidth: '200px', padding: '8px', fontSize: '0.8rem' }}
            >
              <option value="">-- Sin vincular --</option>
              {scheduledEvents.map(s => (
                <option key={s.id} value={s.id}>
                  {s.date} {s.time} - {s.title}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button onClick={onSaveWorkout} className="btn-neon" style={{ padding: '12px 32px', fontSize: '0.9rem', justifyContent: 'center' }}>
              Guardar Rutina Completada
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
            {isGeminiConfigured() ? 'Gemini enriquecerá el plan con ejercicios extra.' : 'Configura Gemini en Ajustes para enriquecer con IA.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default PlanTab;
