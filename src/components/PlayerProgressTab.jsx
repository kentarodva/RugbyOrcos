import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CHART_COLORS = { squat: '#ff3d00', bench: '#00b0ff', deadlift: '#9c27b0' };
const METRIC_LABELS = { squat: 'Sentadilla', bench: 'Banca', deadlift: 'Peso Muerto' };

const DEMO_DATA = [
  { date: 'Sem 1', squat: 60, bench: 45, deadlift: 80 },
  { date: 'Sem 2', squat: 65, bench: 47, deadlift: 85 },
  { date: 'Sem 3', squat: 68, bench: 50, deadlift: 90 },
  { date: 'Sem 4', squat: 70, bench: 52, deadlift: 95 },
  { date: 'Sem 5', squat: 75, bench: 55, deadlift: 100 },
  { date: 'Sem 6', squat: 80, bench: 57, deadlift: 105 },
];

function ChartContent({ data, visibleLines, onToggleLine }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
        {Object.entries(CHART_COLORS).map(([key, color]) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
            <input type="checkbox" checked={visibleLines[key]}
              onChange={() => onToggleLine(key)} style={{ accentColor: color }} />
            <span style={{ color }}>{METRIC_LABELS[key]}</span>
          </label>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
          <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '0.75rem' }} />
          <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
          {visibleLines.squat && <Line type="monotone" dataKey="squat" stroke={CHART_COLORS.squat} strokeWidth={2} dot={{ r: 3 }} name="Sentadilla" />}
          {visibleLines.bench && <Line type="monotone" dataKey="bench" stroke={CHART_COLORS.bench} strokeWidth={2} dot={{ r: 3 }} name="Banca" />}
          {visibleLines.deadlift && <Line type="monotone" dataKey="deadlift" stroke={CHART_COLORS.deadlift} strokeWidth={2} dot={{ r: 3 }} name="Peso Muerto" />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function PlayerProgressTab({ playerId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleLines, setVisibleLines] = useState({ squat: true, bench: true, deadlift: true });
  const [view, setView] = useState('chart');
  const [showDemo, setShowDemo] = useState(false);

  const toggleLine = (key) => {
    setVisibleLines(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (!playerId) return;
    setLoading(true);
    supabase.from('gym_history')
      .select('recorded_date, squat, bench, deadlift, weight')
      .eq('player_id', playerId)
      .order('recorded_date', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setHistory(data);
        setLoading(false);
      });
  }, [playerId]);

  const hasData = history.length >= 2;
  const chartData = hasData
    ? history.map(h => ({
        date: h.recorded_date ? new Date(h.recorded_date).toLocaleDateString('es', { month: 'short', day: 'numeric' }) : '—',
        squat: Number(h.squat) || 0,
        bench: Number(h.bench) || 0,
        deadlift: Number(h.deadlift) || 0,
      }))
    : showDemo ? DEMO_DATA : [];

  const latest = history[history.length - 1] || {};
  const first = history[0] || {};
  const squatProg = first.squat ? ((latest.squat - first.squat) / first.squat * 100).toFixed(0) : 0;
  const benchProg = first.bench ? ((latest.bench - first.bench) / first.bench * 100).toFixed(0) : 0;
  const deadliftProg = first.deadlift ? ((latest.deadlift - first.deadlift) / first.deadlift * 100).toFixed(0) : 0;

  const total = (latest.squat || 0) + (latest.bench || 0) + (latest.deadlift || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <button onClick={() => setView('chart')}
          className={`tab-btn ${view === 'chart' ? 'active' : ''}`}>Evolución Gym</button>
        <button onClick={() => setView('progress')}
          className={`tab-btn ${view === 'progress' ? 'active' : ''}`}>Progreso</button>
        <button onClick={() => setView('workout')}
          className={`tab-btn ${view === 'workout' ? 'active' : ''}`}>Rendimiento</button>
      </div>

      {view === 'chart' && (
        <>
          <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ color: 'var(--color-blue)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
              Evolución de Fuerza
            </h3>
            {loading ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '30px' }}>Cargando historial...</p>
            ) : chartData.length < 2 ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                  {history.length === 1 ? 'Solo tienes 1 registro. Registra más entrenos para ver la evolución.' : 'Aún no hay registros de gimnasio.'}
                </p>
                {!showDemo && (
                  <button onClick={() => setShowDemo(true)} className="btn-outline" style={{ padding: '6px 14px', fontSize: '0.75rem' }}>
                    👁️ Ver preview del gráfico
                  </button>
                )}
                {showDemo && (
                  <div style={{ position: 'relative' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-gold)', marginBottom: '8px', fontStyle: 'italic' }}>
                      🎯 Preview — registra tu primer entreno para ver datos reales
                    </div>
                    <div style={{ filter: 'blur(1px)', pointerEvents: 'none', opacity: 0.6 }}>
                      <ChartContent data={DEMO_DATA} visibleLines={visibleLines} onToggleLine={toggleLine} />
                    </div>
                    <button onClick={() => setShowDemo(false)} className="btn-outline" style={{ marginTop: '8px', padding: '4px 10px', fontSize: '0.7rem' }}>
                      Ocultar preview
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <ChartContent data={chartData} visibleLines={visibleLines} onToggleLine={toggleLine} />
            )}
          </div>
        </>
      )}

      {view === 'progress' && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ color: 'var(--color-gold)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
            Resumen de Progreso
          </h3>
          {history.length === 0 && !showDemo ? (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>Sin datos aún.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { label: 'Sentadilla', key: 'squat', val: (latest.squat || (showDemo ? 80 : 0)), prog: squatProg, color: '#ff3d00' },
                { label: 'Banca', key: 'bench', val: (latest.bench || (showDemo ? 57 : 0)), prog: benchProg, color: '#00b0ff' },
                { label: 'Peso Muerto', key: 'deadlift', val: (latest.deadlift || (showDemo ? 105 : 0)), prog: deadliftProg, color: '#9c27b0' },
              ].map(s => (
                <div key={s.key} style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.val}<span style={{ fontSize: '0.7rem', fontWeight: 400 }}>kg</span></div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
                  {history.length > 1 && (
                    <div style={{ fontSize: '0.7rem', color: s.prog > 0 ? '#00e676' : s.prog < 0 ? '#ff3d00' : 'var(--color-text-muted)', marginTop: '4px' }}>
                      {s.prog > 0 ? '↑' : s.prog < 0 ? '↓' : '→'} {Math.abs(s.prog)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {showDemo && (
            <div style={{ marginTop: '8px', fontSize: '0.65rem', color: 'var(--color-gold)', textAlign: 'center', fontStyle: 'italic' }}>
              🎯 Preview — registra tu primer entreno para ver datos reales
            </div>
          )}
          {(history.length > 1 || showDemo) && (
            <div style={{ marginTop: '12px', padding: '10px', background: 'var(--bg-dark)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              Total SBD: <strong style={{ color: 'var(--color-gold)' }}>{showDemo ? 242 : total} kg</strong> · Registros: <strong>{showDemo ? 6 : history.length}</strong>
              {latest.weight && <span> · Peso: <strong>{latest.weight} kg</strong></span>}
            </div>
          )}
        </div>
      )}

      {view === 'workout' && (
        <WorkoutStats playerId={playerId} />
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
      <h3 style={{ color: 'var(--color-gold)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
        Rendimiento de Entreno
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)' }}>{stats.workouts}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Sesiones (30d)</div>
        </div>
        <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#00e676' }}>{stats.streak}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Días seguidos</div>
        </div>
        <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-gold)' }}>{stats.planCount}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Planes creados</div>
        </div>
      </div>
      {stats.lastWeight && (
        <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
          Último peso registrado: <strong style={{ color: 'var(--color-blue)' }}>{stats.lastWeight}kg</strong>
        </div>
      )}
    </div>
  );
}

export default PlayerProgressTab;
