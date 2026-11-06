import React, { useState, useEffect, useContext } from 'react';
import { Dumbbell, Scale, Plus, Check, TrendingUp, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../supabaseClient';
import { ClubContext } from '../context/ClubContext';
import { useToast } from '../context/ToastContext';
import { HeightInput, WeightInput } from './common/FormattedInputs';
import { formatHeightM, formatWeightKg } from '../utils/inputFormatters';
import { TRACKABLE_EXERCISES } from '../constants/exerciseConstants';
export { TRACKABLE_EXERCISES };

const DEMO_DATA = [
  { date: 'Sem 1', weight: 82, squat: 60, bench: 45, deadlift: 80 },
  { date: 'Sem 2', weight: 82.5, squat: 65, bench: 47, deadlift: 85 },
  { date: 'Sem 3', weight: 83, squat: 68, bench: 50, deadlift: 90 },
  { date: 'Sem 4', weight: 83.2, squat: 70, bench: 52, deadlift: 95 },
  { date: 'Sem 5', weight: 83.8, squat: 75, bench: 55, deadlift: 100 },
  { date: 'Sem 6', weight: 84, squat: 80, bench: 57, deadlift: 105 },
];

function ChartContent({ data, activeExercises, visibleLines, onToggleLine }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '6px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.75rem' }}>
          <input
            type="checkbox"
            checked={!!visibleLines.weight}
            onChange={() => onToggleLine('weight')}
            style={{ accentColor: '#26c6da' }}
          />
          <span style={{ color: '#26c6da', fontWeight: 700 }}>Peso Corporal (kg)</span>
        </label>
        {activeExercises.map(ex => (
          <label key={ex.key} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.75rem' }}>
            <input
              type="checkbox"
              checked={visibleLines[ex.key] !== false}
              onChange={() => onToggleLine(ex.key)}
              style={{ accentColor: ex.color }}
            />
            <span style={{ color: ex.color, fontWeight: 600 }}>{ex.label}</span>
          </label>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
          <Tooltip contentStyle={{ background: '#181B19', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', fontSize: '0.75rem' }} />
          <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
          {visibleLines.weight && (
            <Line type="monotone" dataKey="weight" stroke="#26c6da" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3 }} name="Peso Corporal (kg)" />
          )}
          {activeExercises.map(ex => (
            visibleLines[ex.key] !== false && (
              <Line
                key={ex.key}
                type="monotone"
                dataKey={ex.key}
                stroke={ex.color}
                strokeWidth={2.2}
                dot={{ r: 3 }}
                name={ex.label}
              />
            )
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function PlayerProgressTab({ playerId }) {
  const { players, updatePlayer } = useContext(ClubContext);
  const { showToast } = useToast();
  const player = (players || []).find(p => p.id === playerId);

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleLines, setVisibleLines] = useState({ weight: true, squat: true, bench: true, deadlift: true });
  const [view, setView] = useState('chart');
  const [showDemo, setShowDemo] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [savingCheckIn, setSavingCheckIn] = useState(false);

  const savedTracked = player?.preferences?.tracked_exercises;
  const initialTrackedKeys = Array.isArray(savedTracked) && savedTracked.length > 0
    ? savedTracked
    : ['squat', 'bench', 'deadlift'];

  const [selectedExercises, setSelectedExercises] = useState(initialTrackedKeys);
  const [liftForm, setLiftForm] = useState({
    weight: player?.weight || '',
    height: player?.height || '',
    squat: player?.gymStats?.squat || '',
    bench: player?.gymStats?.bench || '',
    deadlift: player?.gymStats?.deadlift || '',
    ...(player?.preferences?.custom_lifts || {}),
  });

  const loadHistory = () => {
    if (!playerId) return;
    setLoading(true);
    supabase.from('gym_history')
      .select('recorded_date, squat, bench, deadlift, weight, height, custom_lifts')
      .eq('player_id', playerId)
      .order('recorded_date', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setHistory(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadHistory();
  }, [playerId]);

  useEffect(() => {
    if (!player) return;
    const tracked = player.preferences?.tracked_exercises;
    if (Array.isArray(tracked) && tracked.length > 0) {
      setSelectedExercises(tracked);
    }
    setLiftForm({
      weight: player.weight || '',
      height: player.height || '',
      squat: player.gymStats?.squat || '',
      bench: player.gymStats?.bench || '',
      deadlift: player.gymStats?.deadlift || '',
      ...(player.preferences?.custom_lifts || {}),
    });
  }, [player?.id]);

  const toggleLine = (key) => {
    setVisibleLines(prev => ({ ...prev, [key]: prev[key] === false ? true : !prev[key] }));
  };

  const toggleExerciseSelection = (key) => {
    setSelectedExercises(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const activeExercises = TRACKABLE_EXERCISES.filter(ex => selectedExercises.includes(ex.key));

  const handleSaveCheckIn = async (e) => {
    e.preventDefault();
    if (!player) return;
    if (selectedExercises.length === 0) {
      showToast('Selecciona al menos un ejercicio para seguir tu progreso.', 'warning');
      return;
    }
    setSavingCheckIn(true);
    try {
      const customLifts = {};
      TRACKABLE_EXERCISES.forEach(ex => {
        if (!['squat', 'bench', 'deadlift'].includes(ex.key) && selectedExercises.includes(ex.key)) {
          customLifts[ex.key] = Number(liftForm[ex.key] || 0);
        }
      });

      const squatVal = selectedExercises.includes('squat') ? Number(liftForm.squat || 0) : Number(player.gymStats?.squat || 0);
      const benchVal = selectedExercises.includes('bench') ? Number(liftForm.bench || 0) : Number(player.gymStats?.bench || 0);
      const deadliftVal = selectedExercises.includes('deadlift') ? Number(liftForm.deadlift || 0) : Number(player.gymStats?.deadlift || 0);
      const weightVal = liftForm.weight ? Number(liftForm.weight) : player.weight || null;
      const heightVal = liftForm.height ? Number(liftForm.height) : player.height || null;

      await supabase.rpc('player_record_progress_snapshot', {
        p_player_id: player.id,
        p_weight: weightVal,
        p_height: heightVal,
        p_squat: squatVal,
        p_bench: benchVal,
        p_deadlift: deadliftVal,
        p_custom_lifts: customLifts,
        p_tracked_exercises: selectedExercises,
      });

      const nextPrefs = {
        ...(player.preferences || {}),
        profile_confirmed: true,
        tracked_exercises: selectedExercises,
        custom_lifts: customLifts,
      };

      await updatePlayer({
        ...player,
        weight: weightVal,
        height: heightVal,
        gymStats: { squat: squatVal, bench: benchVal, deadlift: deadliftVal },
        preferences: nextPrefs,
      });

      setShowCheckInModal(false);
      loadHistory();
      showToast('Control de progreso guardado en tu historial.', 'success');
    } catch {
      showToast('Error al guardar el control de progreso.', 'error');
    } finally {
      setSavingCheckIn(false);
    }
  };

  const hasData = history.length >= 2;
  const chartData = hasData
    ? history.map(h => {
        const custom = h.custom_lifts || {};
        const point = {
          date: h.recorded_date ? new Date(h.recorded_date + 'T00:00:00').toLocaleDateString('es', { month: 'short', day: 'numeric' }) : '—',
          weight: Number(h.weight) || null,
          squat: Number(h.squat) || 0,
          bench: Number(h.bench) || 0,
          deadlift: Number(h.deadlift) || 0,
        };
        Object.entries(custom).forEach(([k, v]) => {
          point[k] = Number(v) || 0;
        });
        return point;
      })
    : showDemo ? DEMO_DATA : [];

  const latest = history[history.length - 1] || {};
  const first = history[0] || {};

  const getMetricValue = (row, key) => {
    if (!row) return 0;
    if (['squat', 'bench', 'deadlift', 'weight', 'height'].includes(key)) {
      return Number(row[key] || 0);
    }
    return Number(row.custom_lifts?.[key] || 0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div className="pro-subtabs">
          <button onClick={() => setView('chart')} className={`pro-subtab-btn ${view === 'chart' ? 'active' : ''}`}>
            <TrendingUp size={14} /> Evolución
          </button>
          <button onClick={() => setView('progress')} className={`pro-subtab-btn ${view === 'progress' ? 'active' : ''}`}>
            <Dumbbell size={14} /> Mis Ejercicios y Peso
          </button>
          <button onClick={() => setView('workout')} className={`pro-subtab-btn ${view === 'workout' ? 'active' : ''}`}>
            <Activity size={14} /> Rendimiento
          </button>
        </div>

        <button
          onClick={() => setShowCheckInModal(true)}
          className="btn-neon"
          style={{ padding: '8px 14px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={15} /> Registrar Control / Elegir Ejercicios
        </button>
      </div>

      {view === 'chart' && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
          <div className="pro-section-header" style={{ marginBottom: '12px' }}>
            <div className="pro-section-title" style={{ fontSize: '1rem' }}>
              <TrendingUp size={18} color="var(--color-blue)" />
              <span>Curva de Evolución (Peso y Ejercicios Seleccionados)</span>
            </div>
            <span className="pro-chip pro-chip-info tabular-nums">{history.length} registros</span>
          </div>

          {loading ? (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '30px' }}>Cargando historial...</p>
          ) : chartData.length < 2 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '12px', fontSize: '0.85rem' }}>
                {history.length === 1
                  ? 'Ya tienes tu línea base inicial registrada. Registra un segundo control para graficar tu curva de progreso.'
                  : 'Aún no hay controles de peso y fuerza registrados.'}
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => setShowCheckInModal(true)} className="btn-neon" style={{ padding: '7px 14px', fontSize: '0.76rem' }}>
                  + Registrar Control Ahora
                </button>
                {!showDemo && (
                  <button onClick={() => setShowDemo(true)} className="btn-outline" style={{ padding: '7px 14px', fontSize: '0.76rem' }}>
                    Ver preview del gráfico
                  </button>
                )}
              </div>
              {showDemo && (
                <div style={{ position: 'relative', marginTop: '14px' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-gold)', marginBottom: '8px', fontStyle: 'italic' }}>
                    Vista previa de ejemplo — tus controles reales aparecerán aquí
                  </div>
                  <div style={{ opacity: 0.75 }}>
                    <ChartContent data={DEMO_DATA} activeExercises={activeExercises} visibleLines={visibleLines} onToggleLine={toggleLine} />
                  </div>
                  <button onClick={() => setShowDemo(false)} className="btn-outline" style={{ marginTop: '8px', padding: '4px 10px', fontSize: '0.7rem' }}>
                    Ocultar preview
                  </button>
                </div>
              )}
            </div>
          ) : (
            <ChartContent data={chartData} activeExercises={activeExercises} visibleLines={visibleLines} onToggleLine={toggleLine} />
          )}
        </div>
      )}

      {view === 'progress' && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
          <div className="pro-section-header" style={{ marginBottom: '14px' }}>
            <div className="pro-section-title" style={{ fontSize: '1rem' }}>
              <Scale size={18} color="var(--color-gold)" />
              <span>Historial de Antropometría y Marcas Personales</span>
            </div>
          </div>

          <div className="pro-kpi-grid" style={{ marginBottom: '16px' }}>
            <div className="pro-kpi-card">
              <div className="pro-kpi-label">Peso Actual</div>
              <div className="pro-kpi-value" style={{ color: '#26c6da' }}>
                {formatWeightKg(latest.weight || player?.weight)}
              </div>
              {first.weight && latest.weight && history.length > 1 && (
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }} className="tabular-nums">
                  Inicio: {first.weight} kg ({latest.weight - first.weight >= 0 ? '+' : ''}{(latest.weight - first.weight).toFixed(1)} kg)
                </div>
              )}
            </div>
            <div className="pro-kpi-card">
              <div className="pro-kpi-label">Altura</div>
              <div className="pro-kpi-value">
                {formatHeightM(latest.height || player?.height)}
              </div>
            </div>
            <div className="pro-kpi-card">
              <div className="pro-kpi-label">Ejercicios Activos</div>
              <div className="pro-kpi-value" style={{ color: 'var(--color-primary)' }}>{activeExercises.length}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Personalizados por ti</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '12px' }}>
            {activeExercises.map(ex => {
              const currVal = getMetricValue(latest, ex.key) || Number(liftForm[ex.key] || 0);
              const firstVal = getMetricValue(first, ex.key);
              const diffPct = firstVal > 0 ? Math.round(((currVal - firstVal) / firstVal) * 100) : 0;
              return (
                <div key={ex.key} style={{ textAlign: 'center', padding: '14px', background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' }} className="tabular-nums">
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: ex.color }}>
                    {currVal}<span style={{ fontSize: '0.72rem', fontWeight: 500 }}> kg</span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>{ex.label}</div>
                  {history.length > 1 && firstVal > 0 && (
                    <div style={{ fontSize: '0.7rem', color: diffPct >= 0 ? '#2EE57A' : '#FF5C4D', marginTop: '4px', fontWeight: 700 }}>
                      {diffPct >= 0 ? '↑' : '↓'} {Math.abs(diffPct)}% (desde {firstVal}kg)
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {history.length > 0 && (
            <div className="pro-table-wrap" style={{ marginTop: '16px', maxHeight: '240px', overflowY: 'auto' }}>
              <table className="pro-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th className="num">Peso (kg)</th>
                    {activeExercises.map(ex => (
                      <th key={ex.key} className="num">{ex.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.slice().reverse().map((row, idx) => (
                    <tr key={idx}>
                      <td className="tabular-nums" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{row.recorded_date}</td>
                      <td className="num" style={{ color: '#26c6da', fontWeight: 700 }}>{row.weight ? `${row.weight} kg` : '—'}</td>
                      {activeExercises.map(ex => (
                        <td key={ex.key} className="num">{getMetricValue(row, ex.key) || '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {view === 'workout' && (
        <WorkoutStats playerId={playerId} />
      )}

      {showCheckInModal && (
        <div className="modal-overlay" onClick={() => setShowCheckInModal(false)}>
          <div className="modal-content glass-panel animated-slide" style={{ maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                Registrar Control de Peso y Ejercicios
              </h3>
              <button onClick={() => setShowCheckInModal(false)} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
            </div>

            <form onSubmit={handleSaveCheckIn} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Peso Corporal Actual (KG)</label>
                  <WeightInput
                    value={liftForm.weight}
                    onChange={e => setLiftForm(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="84,5"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Altura (Ej. 1,85M)</label>
                  <HeightInput
                    value={liftForm.height}
                    onChange={e => setLiftForm(prev => ({ ...prev, height: e.target.value }))}
                    placeholder="1,85"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-main)', display: 'block', marginBottom: '6px' }}>
                  Selecciona los ejercicios que SÍ realizas e ingresa cuánto levantas (KG):
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {TRACKABLE_EXERCISES.map(ex => {
                    const isSelected = selectedExercises.includes(ex.key);
                    return (
                      <div
                        key={ex.key}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                          padding: '8px 12px', borderRadius: '8px',
                          background: isSelected ? 'rgba(46, 229, 122, 0.06)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${isSelected ? 'rgba(46, 229, 122, 0.25)' : 'var(--border-glass)'}`
                        }}
                      >
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, margin: 0, fontSize: '0.82rem', fontWeight: isSelected ? 700 : 500 }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleExerciseSelection(ex.key)}
                            style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }}
                          />
                          <span>{ex.label}</span>
                        </label>
                        {isSelected ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <WeightInput
                              value={liftForm[ex.key] ?? ''}
                              onChange={e => setLiftForm(prev => ({ ...prev, [ex.key]: e.target.value }))}
                              placeholder="0"
                              style={{ width: '105px', padding: '5px 8px', fontSize: '0.82rem', textAlign: 'right' }}
                            />
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>No lo realizo</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowCheckInModal(false)} className="btn-outline">Cancelar</button>
                <button type="submit" disabled={savingCheckIn} className="btn-neon" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={15} /> {savingCheckIn ? 'Guardando...' : 'Guardar en Historial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkoutStats({ playerId }) {
  const [stats, setStats] = useState({ workouts: 0, streak: 0, lastWeight: null, planCount: 0 });

  useEffect(() => {
    if (!playerId) return;
    supabase.from('workout_logs')
      .select('workout_date, exercise_logs')
      .eq('player_id', playerId)
      .order('workout_date', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (!data || !data.length) return;
        const dates = [...new Set(data.map(d => d.workout_date))].sort().reverse();
        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        for (let i = 0; i < dates.length; i++) {
          const d = new Date(); d.setDate(d.getDate() - i);
          if (dates[i] === d.toISOString().split('T')[0] || (i === 0 && dates[0] === today)) streak++;
          else break;
        }
        const lastLog = data[0].exercise_logs || [];
        const lastW = lastLog.find(e => e.weight)?.weight || null;
        setStats({ workouts: data.length, streak, lastWeight: lastW, planCount: 0 });
      });
    supabase.from('training_plans').select('id', { count: 'exact' }).eq('player_id', playerId)
      .then(({ count }) => { if (count != null) setStats(s => ({ ...s, planCount: count })); });
  }, [playerId]);

  return (
    <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ color: 'var(--color-text)', fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>
        Rendimiento de Entreno
      </h3>
      <div className="pro-kpi-grid">
        <div className="pro-kpi-card">
          <div className="pro-kpi-label">Sesiones (30d)</div>
          <div className="pro-kpi-value" style={{ color: 'var(--color-primary)' }}>{stats.workouts}</div>
        </div>
        <div className="pro-kpi-card">
          <div className="pro-kpi-label">Días seguidos</div>
          <div className="pro-kpi-value" style={{ color: '#2EE57A' }}>{stats.streak}</div>
        </div>
        <div className="pro-kpi-card">
          <div className="pro-kpi-label">Planes creados</div>
          <div className="pro-kpi-value" style={{ color: 'var(--color-gold)' }}>{stats.planCount}</div>
        </div>
      </div>
      {stats.lastWeight && (
        <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }} className="tabular-nums">
          Última carga registrada en entreno: <strong style={{ color: 'var(--color-blue)' }}>{stats.lastWeight}kg</strong>
        </div>
      )}
    </div>
  );
}

export default PlayerProgressTab;
