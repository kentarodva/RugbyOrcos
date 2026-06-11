import { useState, useMemo } from 'react';
import { useToast } from '../context/ToastContext';
import { completePlan } from '../engine/trainingPlanService';

const CATEGORY_LABELS = { campo: 'Campo', gym: 'Gimnasio', recuperacion: 'Recuperación' };
const EMPTY_SERIES = { completed: false, sets: 3, reps: 10, weight: '' };

function WorkoutLogger({ player, logWorkout, myTrainingPlan }) {
  const { showToast } = useToast();
  const [exercises, setExercises] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('campo');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 3, comment: '' });

  const plan = myTrainingPlan?.plan;
  const categories = plan ? Object.entries(plan).filter(([, list]) => list.length > 0) : [];

  const currentExercises = useMemo(() => {
    if (!plan) return [];
    const items = plan[activeCategory] || [];
    return items.map((ex, i) => {
      const key = `${activeCategory}_${i}`;
      const saved = exercises[key];
      return {
        key,
        name: ex.name,
        oneRMWeight: ex.oneRMWeight,
        loadPercentage: ex.loadPercentage,
        aiReason: ex.aiReason,
        drills: ex.drills || [],
        durationMin: ex.durationMin,
        fromAI: ex.fromAI,
        completed: saved?.completed ?? false,
        sets: saved?.sets ?? ex.sets ?? 3,
        reps: saved?.reps ?? ex.reps ?? 10,
        weight: saved?.weight ?? '',
      };
    });
  }, [plan, activeCategory, exercises]);

  const updateExercise = (key, field, value) => {
    setExercises(prev => ({
      ...prev,
      [key]: { ...prev[key], ...EMPTY_SERIES, ...prev[key], [field]: value },
    }));
  };

  const completedCount = currentExercises.filter(e => e.completed).length;
  const totalCount = currentExercises.length;

  const allExercisesCount = useMemo(() => {
    if (!plan) return 0;
    return Object.values(plan).reduce((s, list) => s + list.length, 0);
  }, [plan]);

  const allCompletedCount = useMemo(() => {
    if (!plan) return 0;
    return Object.entries(exercises).filter(([k, v]) => {
      if (!v.completed) return false;
      const [cat] = k.split('_');
      return plan[cat]?.length > 0;
    }).length;
  }, [plan, exercises]);

  const handleSave = async () => {
    if (!player?.id || !logWorkout) return;
    setSaving(true);
    try {
      const loggedExercises = Object.entries(exercises)
        .filter(([, v]) => v.completed)
        .map(([key, v]) => {
          const [cat, idx] = key.split('_');
          const ex = plan?.[cat]?.[Number(idx)];
          return {
            exerciseId: ex?.id || null,
            name: ex?.name || key,
            category: cat,
            sets: v.sets || 0,
            reps: v.reps || 0,
            weight: v.weight ? Number(v.weight) : null,
          };
        });
      await logWorkout(player.id, {
        type: activeCategory,
        ejercicios: loggedExercises,
      });
      showToast(`Entreno de ${CATEGORY_LABELS[activeCategory] || activeCategory} guardado (${loggedExercises.length} ejercicios).`, 'success');
      setExercises({});
    } catch (err) {
      showToast('Error al guardar el entreno.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteWeek = async () => {
    if (!player?.id || !myTrainingPlan?.id) return;
    setSaving(true);
    try {
      const rate = allExercisesCount > 0 ? Math.round((allCompletedCount / allExercisesCount) * 100) : 0;
      await completePlan(myTrainingPlan.id, { rating: feedback.rating, comment: feedback.comment, completionRate: rate });
      showToast('Semana completada! Plan archivado.', 'success');
      setShowFeedbackModal(false);
      setFeedback({ rating: 3, comment: '' });
    } catch {
      showToast('Error al archivar la semana.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!plan) {
    return (
      <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>No hay plan de entrenamiento generado aún.</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
          Ve a la sección de Agenda para generar un plan según tu próxima fecha.
        </p>
      </div>
    );
  }

  const categoryColors = {
    campo: { color: 'var(--color-primary)', label: 'Campo' },
    gym: { color: '#ff3d00', label: 'Gimnasio' },
    recuperacion: { color: '#00b0ff', label: 'Recuperación' },
  };

  const recentLogs = (player?.workoutLog || []).slice(-5).reverse();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {myTrainingPlan.isInjured && (
        <div className="glass-panel" style={{ padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,61,0,0.3)', fontSize: '0.75rem', color: '#ff3d00', textAlign: 'center' }}>
          🩹 Fase de recuperación {player.injuryLog?.[0]?.phase || 1}/4 — {myTrainingPlan.matchFaults.length > 0 ? `Fallos: ${myTrainingPlan.matchFaults.join(', ')}` : 'Sigue el plan al pie de la letra.'}
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        {categories.map(([cat]) => {
          const cc = categoryColors[cat] || { color: 'var(--color-text-muted)', label: cat };
          const catCompleted = Object.entries(exercises)
            .filter(([k]) => k.startsWith(cat + '_'))
            .filter(([, v]) => v.completed).length;
          const catTotal = (plan[cat] || []).length;
          return (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={activeCategory === cat ? 'btn-neon' : 'btn-outline'}
              style={{ padding: '6px 14px', fontSize: '0.75rem', borderColor: cc.color, color: activeCategory === cat ? '#000' : cc.color }}>
              {cc.label} ({catCompleted}/{catTotal})
            </button>
          );
        })}
        {myTrainingPlan.enrichedByAI && (
          <span className="badge" style={{ marginLeft: 'auto', background: 'rgba(212,175,55,0.12)', color: 'var(--color-gold)', border: '1px solid rgba(212,175,55,0.25)', fontSize: '0.65rem', padding: '3px 8px' }}>
            IA
          </span>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'Outfit', color: (categoryColors[activeCategory] || {}).color }}>
            {(categoryColors[activeCategory] || {}).label || activeCategory}
          </h4>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            {completedCount}/{totalCount} completados
          </span>
        </div>
        {totalCount > 0 && (
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '12px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(completedCount / totalCount) * 100}%`, background: (categoryColors[activeCategory] || {}).color || 'var(--color-primary)', borderRadius: '2px', transition: 'width 0.3s' }} />
          </div>
        )}

        {currentExercises.length === 0 ? (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>
            No hay ejercicios en esta categoría.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {currentExercises.map((ex) => (
              <div key={ex.key}
                style={{
                  padding: '10px', borderRadius: 'var(--radius-sm)',
                  background: ex.completed ? 'rgba(0,230,118,0.05)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${ex.completed ? 'rgba(0,230,118,0.2)' : 'var(--border-glass)'}`,
                  transition: 'all 0.2s',
                }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <input type="checkbox" checked={ex.completed}
                    onChange={() => updateExercise(ex.key, 'completed', !ex.completed)}
                    style={{ marginTop: '3px', transform: 'scale(1.1)', accentColor: (categoryColors[activeCategory] || {}).color || 'var(--color-primary)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', color: ex.completed ? '#00e676' : 'var(--color-text)' }}
                        onClick={() => updateExercise(ex.key, 'completed', !ex.completed)}>
                        {ex.name}
                      </label>
                      {ex.durationMin && (
                        <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.04)', padding: '1px 6px', borderRadius: '8px' }}>
                          ⏱️ {ex.durationMin}min
                        </span>
                      )}
                      {ex.fromAI && (
                        <span style={{ fontSize: '0.6rem', color: 'var(--color-gold)', background: 'rgba(212,175,55,0.1)', padding: '1px 6px', borderRadius: '8px' }}>
                          🤖 IA
                        </span>
                      )}
                    </div>
                    {ex.aiReason && (
                      <p style={{ fontSize: '0.65rem', color: 'var(--color-gold)', fontStyle: 'italic', marginTop: '2px' }}>💡 {ex.aiReason}</p>
                    )}
                    {ex.oneRMWeight && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-blue)', marginTop: '2px' }}>
                        🎯 Carga sugerida: {ex.oneRMWeight}kg {ex.loadPercentage ? `(${ex.loadPercentage})` : ''}
                      </div>
                    )}

                    {ex.completed && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Series:</span>
                          <input type="number" min={1} max={20} value={ex.sets}
                            onChange={e => updateExercise(ex.key, 'sets', Math.max(1, parseInt(e.target.value) || 1))}
                            style={{ width: '40px', padding: '2px 4px', fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--color-text)', textAlign: 'center' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Reps:</span>
                          <input type="number" min={1} max={100} value={ex.reps}
                            onChange={e => updateExercise(ex.key, 'reps', Math.max(1, parseInt(e.target.value) || 1))}
                            style={{ width: '40px', padding: '2px 4px', fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--color-text)', textAlign: 'center' }} />
                        </div>
                        {activeCategory === 'gym' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Peso:</span>
                            <input type="number" min={0} value={ex.weight}
                              onChange={e => updateExercise(ex.key, 'weight', e.target.value)}
                              placeholder={ex.oneRMWeight ? String(ex.oneRMWeight) : ''}
                              style={{ width: '55px', padding: '2px 4px', fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--color-text)', textAlign: 'center' }} />
                            <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>kg</span>
                          </div>
                        )}
                      </div>
                    )}

                    {ex.drills.length > 0 && (
                      <ul style={{ paddingLeft: '14px', marginTop: '4px', fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {ex.drills.map((d, di) => <li key={di}>{d}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={handleSave} disabled={saving || completedCount === 0}
          className="btn-neon"
          style={{
            width: '100%', justifyContent: 'center', padding: '10px', fontSize: '0.82rem', marginTop: '12px',
            opacity: (saving || completedCount === 0) ? 0.5 : 1,
          }}>
          {saving ? 'Guardando...' : completedCount === 0
            ? '✅ Marca ejercicios para guardar'
            : `💾 Guardar Entreno (${completedCount} ejercicios)`}
        </button>
      </div>

      {myTrainingPlan?.fromDB && allExercisesCount > 0 && (
        <button onClick={() => setShowFeedbackModal(true)}
          className="btn-outline"
          disabled={saving}
          style={{
            width: '100%', justifyContent: 'center', padding: '10px', fontSize: '0.82rem',
            borderColor: 'var(--color-gold)', color: 'var(--color-gold)',
            opacity: saving ? 0.5 : 1,
          }}>
          {allCompletedCount >= allExercisesCount ? '🏁 Finalizar Semana' : `📊 Progreso ${allCompletedCount}/${allExercisesCount} — Cerrar Semana`}
        </button>
      )}

      {recentLogs.length > 0 && (
        <div className="glass-panel" style={{ padding: '14px', borderRadius: 'var(--radius-lg)' }}>
          <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-gold)', marginBottom: '8px', fontFamily: 'Outfit' }}>
            Últimos Entrenos
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {recentLogs.map((w, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--color-text)' }}>
                  {CATEGORY_LABELS[w.type] || w.type || 'General'} {w.completed ? '✅' : '⏳'}
                  <span style={{ color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                    {Array.isArray(w.ejercicios) ? `${w.ejercicios.length} ejercicios` : ''}
                  </span>
                </span>
                <span style={{ color: 'var(--color-text-muted)' }}>{w.date || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showFeedbackModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setShowFeedbackModal(false)}>
          <div className="glass-panel" style={{
            maxWidth: '420px', width: '90%', padding: '24px', borderRadius: 'var(--radius-lg)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-gold)', marginBottom: '16px', fontFamily: 'Outfit' }}>
              🏁 Cerrar Semana de Entreno
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
              {allCompletedCount >= allExercisesCount
                ? 'Completaste todos los ejercicios. ¡Buen trabajo!'
                : `Completaste ${allCompletedCount} de ${allExercisesCount} ejercicios. La IA usará este dato para ajustar la siguiente semana.`}
            </p>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>
                ¿Cómo fue la semana?
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setFeedback({ ...feedback, rating: n })}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${feedback.rating >= n ? 'var(--color-gold)' : 'var(--border-glass)'}`,
                      background: feedback.rating >= n ? 'rgba(255,179,0,0.1)' : 'transparent',
                      color: feedback.rating >= n ? 'var(--color-gold)' : 'var(--color-text-muted)',
                      cursor: 'pointer', fontSize: '0.75rem', textAlign: 'center',
                    }}>{n}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                Comentario (opcional)
              </label>
              <textarea value={feedback.comment}
                onChange={e => setFeedback({ ...feedback, comment: e.target.value })}
                placeholder="¿Qué te pareció el plan? Demasiado duro, poco desafiante..."
                rows={3}
                style={{
                  width: '100%', padding: '8px', fontSize: '0.78rem',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--color-text)',
                  resize: 'none', fontFamily: 'inherit',
                }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowFeedbackModal(false)}
                className="btn-outline"
                style={{ flex: 1, justifyContent: 'center', padding: '10px', fontSize: '0.82rem' }}>
                Cancelar
              </button>
              <button onClick={handleCompleteWeek} disabled={saving}
                className="btn-neon"
                style={{ flex: 1, justifyContent: 'center', padding: '10px', fontSize: '0.82rem' }}>
                {saving ? 'Archivando...' : 'Archivar Semana'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkoutLogger;
