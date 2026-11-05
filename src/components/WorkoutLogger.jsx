import { useState, useMemo, useCallback } from 'react';
import { Timer, PlayCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { completePlan } from '../engine/trainingPlanService';
import { analyzeProgress } from '../engine/progressCoach';
import RestTimer, { REST_PRESETS, formatRest } from './workout/RestTimer';
import SetTable from './workout/SetTable';
import TechniqueSheet from './workout/TechniqueSheet';
import { buildInitialSets, findPreviousSets, summarizeSets } from './workout/setLogs';

const CATEGORY_LABELS = { campo: 'Campo', gym: 'Gimnasio', recuperacion: 'Recuperación' };
const LOAD_CATEGORIES = new Set(['gym', 'crossfit']);
const TRACKED_FIELDS = ['completed', 'sets', 'warmupSets', 'reps', 'weight', 'durationMin', 'rpe', 'setLogs'];

const stepBtn = {
  width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontSize: '1.1rem',
  fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};
const numInput = {
  width: '44px', minWidth: 0, padding: 0, height: '44px', fontSize: '0.95rem', background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', textAlign: 'center', fontWeight: 800,
};

function Stepper({ label, value, onChange, min, max, step = 1, color = '#fff', suffix, inputMode = 'numeric', placeholder, decLabel, incLabel }) {
  const num = Number(value) || 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.5px', color, fontWeight: 800 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        <button type="button" aria-label={decLabel || `Restar ${label}`} style={stepBtn}
          onClick={() => onChange(step === 1 ? Math.max(min, num - 1) : -step)}>−</button>
        <input type="text" inputMode={inputMode} aria-label={label} value={value} placeholder={placeholder}
          onFocus={e => e.target.select()}
          onChange={e => onChange(e.target.value, true)} style={{ ...numInput, color }} />
        <button type="button" aria-label={incLabel || `Sumar ${label}`} style={stepBtn}
          onClick={() => onChange(step === 1 ? Math.min(max, num + 1) : step)}>+</button>
        {suffix && <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>{suffix}</span>}
      </div>
    </div>
  );
}

function WorkoutLogger({ player, logWorkout, myTrainingPlan, onOpenBuilder, onGeneratePlan, generatingPlan }) {
  const { showToast } = useToast();
  const [exercises, setExercises] = useState({});
  const [restPreset, setRestPreset] = useState(90);
  const [rest, setRest] = useState(null); // { endsAt, total, label }
  const [techEx, setTechEx] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setActiveCategory] = useState('campo');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 3, comment: '' });

  const plan = myTrainingPlan?.plan;
  const isExerciseList = (list) => Array.isArray(list) && list.length > 0 && list.every(x => x && typeof x === 'object' && x.name);
  const categories = plan ? Object.entries(plan).filter(([, list]) => isExerciseList(list)) : [];
  // Fall back to the first non-empty category so a gym-only plan never opens on an empty 'campo' tab.
  const activeCategory = plan?.[selectedCategory]?.length ? selectedCategory : (categories[0]?.[0] || selectedCategory);

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
        durationMin: saved?.durationMin ?? ex.durationMin ?? 15,
        fromAI: ex.fromAI,
        completed: saved?.completed ?? false,
        sets: saved?.sets ?? ex.sets ?? 3,
        warmupSets: saved?.warmupSets ?? ex.warmupSets ?? 0,
        exerciseId: ex.id || null,
        code: ex.code || null,
        setLogs: saved?.setLogs ?? null,
        reps: saved?.reps ?? ex.reps ?? 10,
        weight: saved?.weight ?? ex.weight ?? '',
        rpe: saved?.rpe ?? 8,
      };
    });
  }, [plan, activeCategory, exercises]);

  // Seed from the values on screen so the plan's prescription (e.g. 5x5) is kept when editing one field.
  const updateExercise = (ex, field, value) => {
    setExercises(prev => {
      const base = Object.fromEntries(TRACKED_FIELDS.map(f => [f, ex[f]]));
      return { ...prev, [ex.key]: { ...base, ...prev[ex.key], [field]: value } };
    });
  };

  // Per-set rows: the exercise counts as done as soon as one set is ticked (Hevy behaviour).
  const updateSets = (ex, setLogs) => {
    setExercises(prev => {
      const base = Object.fromEntries(TRACKED_FIELDS.map(f => [f, ex[f]]));
      return { ...prev, [ex.key]: { ...base, ...prev[ex.key], setLogs, completed: setLogs.some(r => r.done) } };
    });
  };

  const startRest = (label) => setRest({ endsAt: Date.now() + restPreset * 1000, total: restPreset, label });
  const adjustRest = (delta) => setRest(r => r && ({
    ...r,
    endsAt: Math.max(Date.now(), r.endsAt + delta * 1000),
    total: Math.max(1, r.total + delta),
  }));
  const finishRest = useCallback(() => {
    showToast('¡Descanso terminado! A por la siguiente serie 💪', 'success');
    setRest(null);
  }, [showToast]);

  const completedCount = currentExercises.filter(e => e.completed).length;
  const totalCount = currentExercises.length;

  const allExercisesCount = useMemo(() => {
    if (!plan) return 0;
    return Object.values(plan).filter(isExerciseList).reduce((s, list) => s + list.length, 0);
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
            ...(v.setLogs ? (() => {
              const sum = summarizeSets(v.setLogs);
              return { sets: sum.sets, warmupSets: sum.warmupSets, reps: sum.reps, weight: sum.weight,
                setLogs: v.setLogs.filter(r => r.done).map(r => ({ type: r.type, weight: Number(r.weight) || 0, reps: Number(r.reps) || 0, done: true })) };
            })() : {
              sets: v.sets || 0,
              warmupSets: v.warmupSets || 0,
              reps: v.reps || 0,
              weight: v.weight ? Number(v.weight) : null,
            }),
            durationMin: v.durationMin ? Number(v.durationMin) : null,
            rpe: v.rpe ? Number(v.rpe) : null,
          };
        });
      await logWorkout(player.id, {
        type: activeCategory,
        ejercicios: loggedExercises,
        exerciseLogs: loggedExercises,
        planId: myTrainingPlan?.id || null,
      });

      // Logs store the category under `category` (new) or `type` (legacy).
      const prevLogs = (player.workoutLog || []).filter(w => (w.type || w.category) === activeCategory).slice(-1);
      const prevExercises = prevLogs.length > 0 ? (prevLogs[0].exerciseLogs || prevLogs[0].ejercicios || []) : [];
      const analysis = analyzeProgress(loggedExercises, prevExercises);
      let msg = `Entreno de ${CATEGORY_LABELS[activeCategory] || activeCategory} guardado (${loggedExercises.length} ejercicios).`;
      if (analysis?.summary) msg += ` ${analysis.summary}`;
      showToast(msg, 'success');
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
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>No hay plan de entrenamiento aún</p>
        <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '18px' }}>
          Elige cómo quieres crear tu rutina de entrenamiento
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '360px', margin: '0 auto' }}>
          <button onClick={onGeneratePlan} disabled={generatingPlan}
            className="btn-neon"
            style={{ padding: '14px 20px', fontSize: '0.85rem', justifyContent: 'center', display: 'flex', flexDirection: 'column', gap: '2px', opacity: generatingPlan ? 0.7 : 1 }}>
            {generatingPlan ? (
              <>🧠 Creando plan de preparación...</>
            ) : (
              <><span style={{ fontWeight: 800 }}>⚡ Generar Plan de Entrenamiento</span>
              <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>Rutina adaptada a tu posición y objetivos</span></>
            )}
          </button>

          <button onClick={onOpenBuilder}
            className="btn-outline"
            style={{ padding: '14px 20px', fontSize: '0.85rem', justifyContent: 'center', display: 'flex', flexDirection: 'column', gap: '2px', borderColor: 'var(--color-primary)' }}>
            <span style={{ fontWeight: 800 }}>🏋️ Crear Rutina Manual</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>Elige tus ejercicios del catálogo por categoría</span>
          </button>
        </div>
      </div>
    );
  }

  const categoryIcons = {
    campo: '🏉',
    gym: '🏋️',
    recuperacion: '🧊',
    calentamiento: '🔥',
    crossfit: '⚡',
    casa: '🏠',
    prevencion: '🛡️',
  };

  const categoryColors = {
    calentamiento: { color: '#ff9800', label: 'Calentamiento' },
    campo: { color: 'var(--color-primary)', label: 'Campo' },
    gym: { color: '#ff3d00', label: 'Gimnasio' },
    crossfit: { color: '#e040fb', label: 'CrossFit' },
    casa: { color: '#00e676', label: 'Casa' },
    recuperacion: { color: '#00b0ff', label: 'Recuperación' },
    prevencion: { color: '#ffb300', label: 'Prevención' },
  };

  const recentLogs = (player?.workoutLog || []).slice(-5).reverse();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {myTrainingPlan.isInjured && (
        <div className="glass-panel" style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,61,0,0.3)', fontSize: '0.78rem', color: '#ff7043', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🩹</span>
          <div>
            <strong>Fase de recuperación {player.injuryLog?.[0]?.phase || 1}/4:</strong> {myTrainingPlan.matchFaults.length > 0 ? `Atención a: ${myTrainingPlan.matchFaults.join(', ')}` : 'Sigue el protocolo preventivo al pie de la letra.'}
          </div>
        </div>
      )}

      {/* Category Navigation Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        {categories.map(([cat]) => {
          const cc = categoryColors[cat] || { color: 'var(--color-text-muted)', label: cat };
          const icon = categoryIcons[cat] || '🏉';
          const catCompleted = Object.entries(exercises)
            .filter(([k]) => k.startsWith(cat + '_'))
            .filter(([, v]) => v.completed).length;
          const catTotal = (plan[cat] || []).length;
          const isActive = activeCategory === cat;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.18s ease',
                background: isActive ? `${cc.color}22` : 'rgba(255, 255, 255, 0.03)',
                border: `1.5px solid ${isActive ? cc.color : 'rgba(255, 255, 255, 0.08)'}`,
                color: isActive ? '#fff' : 'var(--color-text-muted)',
                boxShadow: isActive ? `0 0 16px ${cc.color}35` : 'none',
              }}
            >
              <span>{icon}</span>
              <span>{cc.label}</span>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  background: isActive ? cc.color : 'rgba(255, 255, 255, 0.08)',
                  color: isActive ? '#000' : 'var(--color-text-muted)',
                  fontWeight: 800,
                }}
              >
                {catCompleted}/{catTotal}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onOpenBuilder}
          style={{
            marginLeft: 'auto',
            padding: '6px 12px',
            fontSize: '0.72rem',
            color: 'var(--color-blue)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            background: 'rgba(56, 189, 248, 0.08)',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: 700,
          }}
        >
          ✏️ Personalizar Rutina
        </button>
      </div>

      {/* Main Exercises Panel */}
      <div className="glass-panel" style={{ padding: 'clamp(12px, 3vw, 20px)', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>{categoryIcons[activeCategory] || '🏉'}</span>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'Outfit', color: (categoryColors[activeCategory] || {}).color || '#fff', margin: 0 }}>
              {(categoryColors[activeCategory] || {}).label || activeCategory}
            </h4>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            {completedCount} de {totalCount} completados
          </span>
        </div>

        <div role="group" aria-label="Duración del descanso entre series" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Descanso:</span>
          {REST_PRESETS.map(s => (
            <button key={s} type="button" aria-pressed={restPreset === s} onClick={() => setRestPreset(s)}
              style={{ minWidth: '52px', height: '36px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                border: `1px solid ${restPreset === s ? '#00e676' : 'rgba(255,255,255,0.1)'}`,
                background: restPreset === s ? 'rgba(0,230,118,0.15)' : 'rgba(255,255,255,0.03)',
                color: restPreset === s ? '#00e676' : 'var(--color-text-muted)' }}>
              {formatRest(s)}
            </button>
          ))}
        </div>

        {totalCount > 0 && (
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', marginBottom: '18px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(completedCount / totalCount) * 100}%`,
                background: (categoryColors[activeCategory] || {}).color || 'var(--color-primary)',
                borderRadius: '3px',
                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>
        )}

        {currentExercises.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '28px' }}>
            No hay ejercicios registrados en esta categoría.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentExercises.map((ex) => {
              const activeColor = (categoryColors[activeCategory] || {}).color || 'var(--color-primary)';
              // Field drills / recovery don't use load or warm-up sets: hide those controls unless the plan prescribes a load.
              const isLoad = LOAD_CATEGORIES.has(activeCategory) || !!ex.oneRMWeight || ex.weight !== '';
              return (
                <div
                  key={ex.key}
                  style={{
                    padding: 'clamp(12px, 3vw, 16px)',
                    borderRadius: '14px',
                    background: ex.completed ? 'rgba(0, 230, 118, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1.5px solid ${ex.completed ? 'rgba(0, 230, 118, 0.35)' : 'rgba(255, 255, 255, 0.07)'}`,
                    boxShadow: ex.completed ? '0 0 16px rgba(0, 230, 118, 0.1)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Top Bar: Title + Badges + Large Check Button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          onClick={() => updateExercise(ex, 'completed', !ex.completed)}
                          style={{
                            fontSize: '0.92rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            color: ex.completed ? 'var(--color-primary)' : '#fff',
                          }}
                        >
                          {ex.name}
                        </span>

                        {ex.durationMin && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                            ⏱️ {ex.durationMin} min
                          </span>
                        )}

                        {ex.fromAI && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--color-gold)', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                            ⚡ Plan Guerrero
                          </span>
                        )}
                      </div>

                      {ex.aiReason && (
                        <p style={{ fontSize: '0.72rem', color: 'var(--color-gold)', fontStyle: 'italic', margin: '4px 0 0' }}>
                          💡 {ex.aiReason}
                        </p>
                      )}

                      {ex.oneRMWeight && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-blue)', marginTop: '4px', fontWeight: 600 }}>
                          🎯 Carga objetivo: {ex.oneRMWeight} kg {ex.loadPercentage ? `(${ex.loadPercentage})` : ''}
                        </div>
                      )}
                    </div>

                    <button type="button" onClick={() => setTechEx(ex)} aria-label={`Ver técnica de ${ex.name}`} title="Ver técnica"
                      style={{ width: '44px', height: '44px', flexShrink: 0, borderRadius: '12px', border: '1px solid rgba(56,189,248,0.35)', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PlayCircle size={22} aria-hidden="true" />
                    </button>

                    {/* Big Action Check Button */}
                    <button
                      type="button"
                      onClick={() => updateExercise(ex, 'completed', !ex.completed)}
                      style={{
                        minHeight: '44px',
                        padding: '8px 16px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        border: 'none',
                        background: ex.completed
                          ? 'var(--color-primary)'
                          : 'rgba(255, 255, 255, 0.06)',
                        color: ex.completed ? '#000' : 'var(--color-text-muted)',
                        boxShadow: ex.completed
                          ? '0 0 16px rgba(0, 230, 118, 0.4)'
                          : 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexShrink: 0,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {ex.completed ? '✓ ¡Listo!' : '○ Marcar'}
                    </button>
                  </div>

                  {/* Clean Unified Telemetry Controls */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginTop: '12px',
                      flexWrap: 'wrap',
                      background: 'rgba(0, 0, 0, 0.35)',
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    {isLoad && (
                      <SetTable
                        sets={ex.setLogs || buildInitialSets({ warmupSets: ex.warmupSets, sets: ex.sets, reps: ex.reps, weight: ex.weight })}
                        previous={findPreviousSets(player?.workoutLog || [], { exerciseId: ex.exerciseId, name: ex.name })}
                        suggestedWeight={ex.oneRMWeight}
                        onChange={(rows) => updateSets(ex, rows)}
                        onSetDone={(type) => { if (type !== 'warmup') startRest(ex.name); }}
                      />
                    )}

                    {/* Field / recovery drills: simple touch steppers (44px targets) */}
                    {!isLoad && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(138px, 1fr))', gap: '12px 8px', width: '100%' }}>
                        <Stepper label="Series" color="#00e676" value={ex.sets} min={1} max={20}
                          decLabel="Restar serie" incLabel="Sumar serie"
                          onChange={(v, typed) => updateExercise(ex, 'sets', typed ? Math.min(20, Math.max(1, parseInt(v) || 1)) : v)} />
                        <Stepper label="Reps" value={ex.reps} min={1} max={100}
                          onChange={(v, typed) => updateExercise(ex, 'reps', typed ? Math.min(100, Math.max(1, parseInt(v) || 1)) : v)} />
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                        {isLoad ? (() => {
                          const sum = summarizeSets(ex.setLogs || []);
                          return sum.sets + sum.warmupSets === 0
                            ? 'Toca ✓ al terminar cada serie'
                            : <><span style={{ color: '#00e676' }}>{sum.sets} efectivas</span>{sum.warmupSets > 0 && <> · <span style={{ color: '#ff9800' }}>{sum.warmupSets} calent.</span></>}{sum.weight && <> · máx <span style={{ color: '#ffd700' }}>{sum.weight} kg</span></>}</>;
                        })() : <span style={{ color: '#00e676' }}>{ex.sets} × {ex.reps}</span>}
                      </span>
                      <button type="button" onClick={() => startRest(ex.name)}
                        aria-label={`Iniciar descanso de ${formatRest(restPreset)} para ${ex.name}`}
                        style={{ marginLeft: 'auto', height: '44px', padding: '0 14px', borderRadius: '12px', border: '1px solid rgba(0,230,118,0.4)', background: 'rgba(0,230,118,0.1)', color: '#00e676', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <Timer size={16} aria-hidden="true" /> Descanso {formatRest(restPreset)}
                      </button>
                    </div>

                    {/* Duration */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Tiempo:</span>
                      <input
                        type="number"
                        min={1}
                        max={180}
                        value={ex.durationMin}
                        onChange={e => updateExercise(ex, 'durationMin', Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ width: '42px', padding: '3px 4px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', textAlign: 'center', fontWeight: 800 }}
                      />
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>min</span>
                    </div>

                    {/* RPE Effort */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Esfuerzo:</span>
                      <select
                        value={ex.rpe || ''}
                        onChange={e => updateExercise(ex, 'rpe', e.target.value)}
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.75rem',
                          background: '#0d1821',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          color: 'var(--color-gold)',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <option value="">—</option>
                        {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(v => (
                          <option key={v} value={v}>RPE {v}/10</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Tactical Drills / Playbook */}
                  {ex.drills.length > 0 && (
                    <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.015)', borderRadius: '8px', borderLeft: `3px solid ${activeColor}` }}>
                      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: '4px' }}>
                        Puntos Clave del Ejercicio:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {ex.drills.map((d, di) => (
                          <div key={di} style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                            <span style={{ color: activeColor }}>🏉</span>
                            <span>{d}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Save Session CTA */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || completedCount === 0}
          className="btn-neon"
          style={{
            width: '100%',
            justifyContent: 'center',
            padding: '14px',
            fontSize: '0.9rem',
            fontWeight: 800,
            marginTop: '16px',
            borderRadius: '12px',
            opacity: (saving || completedCount === 0) ? 0.45 : 1,
            cursor: (saving || completedCount === 0) ? 'not-allowed' : 'pointer',
            boxShadow: completedCount > 0 ? '0 0 24px rgba(0, 230, 118, 0.35)' : 'none',
          }}
        >
          {saving
            ? '⏳ Guardando sesión...'
            : completedCount === 0
            ? '⚡ Marca los ejercicios completados para guardar sesión'
            : `💾 Guardar Sesión (${completedCount} ${completedCount === 1 ? 'ejercicio' : 'ejercicios'} listos)`}
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

      {techEx && <TechniqueSheet exercise={techEx} onClose={() => setTechEx(null)} />}

      {rest && (
        <RestTimer endsAt={rest.endsAt} total={rest.total} label={rest.label}
          onAdjust={adjustRest} onSkip={() => setRest(null)} onFinish={finishRest} />
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
