import { useState, useEffect, useMemo } from 'react';
import { WORKOUTS, CATEGORY_LABELS as PLAN_LABELS, CATEGORY_ICONS, CATEGORY_COLORS } from './constants';
import ExercisePreviewModal from './ExercisePreviewModal';
import { getExerciseCatalog } from '../../services/trainingService';

const MUSCLE_LABELS = {
  abductors: 'Abductores', abs: 'Abdominales', adductors: 'Aductores',
  biceps: 'Bíceps', calves: 'Pantorrillas', 'cardiovascular system': 'Cardio',
  delts: 'Hombros', forearms: 'Antebrazos', glutes: 'Glúteos',
  hamstrings: 'Isquiotibiales', lats: 'Dorsales', 'levator scapulae': 'Elevador Escápula',
  pectorals: 'Pectorales', quads: 'Cuádriceps', 'serratus anterior': 'Serrato',
  spine: 'Espinales', traps: 'Trapecios', triceps: 'Tríceps', 'upper back': 'Espalda Alta',
};

const EQUIP_LABELS = {
  assisted: 'Asistido', band: 'Banda', barbell: 'Barra', 'body weight': 'Peso Corporal',
  'bosu ball': 'Bosu', cable: 'Polea', dumbbell: 'Mancuerna',
  'elliptical machine': 'Elíptica', 'ez barbell': 'Barra EZ', hammer: 'Martillo',
  kettlebell: 'Pesa Rusa', 'leverage machine': 'Máquina', 'medicine ball': 'Balón Med',
  'olympic barbell': 'Barra Olímpica', 'resistance band': 'Banda Resistencia', roller: 'Rodillo',
  rope: 'Cuerda', 'skierg machine': 'Esquiador', 'sled machine': 'Trineo',
  'smith machine': 'Smith', 'stability ball': 'Balón Estabilidad',
  'stationary bike': 'Bici Fija', 'stepmill machine': 'Escaladora', tire: 'Llanta',
  'trap bar': 'Barra Hex', 'upper body ergometer': 'Ergómetro', weighted: 'Lastrado',
  'wheel roller': 'Rueda Abdominal',
};

const CATEGORY_COLORS_MAP = {
  gym: '#ef4444', crossfit: '#eab308',
};

function CatalogTab({ activeCategory, onCategoryChange }) {
  const [view, setView] = useState('plans');
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [equipFilter, setEquipFilter] = useState('all');
  const [muscleFilter, setMuscleFilter] = useState('all');
  const [previewEx, setPreviewEx] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

  useEffect(() => {
    setLoading(true);
    getExerciseCatalog().then(data => {
      setExercises(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const datasetExercises = useMemo(() => exercises.filter(e => e.source === 'dataset'), [exercises]);

  const categoryOptions = useMemo(() => {
    const cats = [...new Set(datasetExercises.map(e => e.category).filter(Boolean))].sort();
    return ['all', ...cats];
  }, [datasetExercises]);

  const equipmentOptions = useMemo(() => {
    const set = new Set(datasetExercises.filter(e => e.equipment).map(e => e.equipment));
    return ['all', ...[...set].sort()];
  }, [datasetExercises]);

  const muscleOptions = useMemo(() => {
    const targets = [...new Set(datasetExercises.map(e => e.target_muscle).filter(Boolean))].sort();
    return ['all', ...targets];
  }, [datasetExercises]);

  const filtered = useMemo(() => {
    return datasetExercises.filter(e => {
      if (catFilter !== 'all' && e.category !== catFilter) return false;
      if (equipFilter !== 'all' && e.equipment !== equipFilter) return false;
      if (muscleFilter !== 'all' && e.target_muscle !== muscleFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const m = (e.target_muscle || '').toLowerCase();
        const g = (e.muscle_group || '').toLowerCase();
        const s = Array.isArray(e.secondary_muscles) ? e.secondary_muscles.join(' ').toLowerCase() : '';
        const eq = EQUIP_LABELS[e.equipment] || (e.equipment || '');
        return e.name_technical.toLowerCase().includes(q) || e.name_local.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q) || eq.toLowerCase().includes(q) || m.includes(q) || g.includes(q) || s.includes(q);
      }
      return true;
    });
  }, [datasetExercises, catFilter, equipFilter, muscleFilter, search]);

  useEffect(() => { setPage(1); setPerPage(50); }, [catFilter, equipFilter, muscleFilter, search]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  if (page > totalPages && totalPages > 0) setPage(totalPages);
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  const plansCategories = ['forwards', 'backs', 'captain', 'coach', 'general'];
  const borderColor = CATEGORY_COLORS[activeCategory] || 'var(--color-primary)';

  return (
    <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setView('plans')} className={`tab-btn ${view === 'plans' ? 'active' : ''}`}>
            Planes de Entrenamiento
          </button>
          <button onClick={() => setView('catalog')} className={`tab-btn ${view === 'catalog' ? 'active' : ''}`}>
            Catálogo de Ejercicios
          </button>
        </div>
      </div>

      {view === 'plans' && (
        <>
          <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', flexWrap: 'wrap' }}>
            {plansCategories.map(cat => (
              <button key={cat} onClick={() => onCategoryChange(cat)} className={`tab-btn ${activeCategory === cat ? 'active' : ''}`}>
                {CATEGORY_ICONS[cat]} {PLAN_LABELS[cat]}
              </button>
            ))}
          </div>
          <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
            {WORKOUTS[activeCategory]?.map((w, index) => (
              <div key={index} className="glass-panel animated-slide" style={{ padding: '25px', borderLeft: `4px solid ${borderColor}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '15px' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit' }}>{w.title}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      Posiciones: <strong>{w.focus}</strong>
                    </p>
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.5', marginBottom: '15px', background: 'var(--bg-dark)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>{w.description}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase' }}>Rutina de Campo:</span>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '15px', fontSize: '0.8rem', color: 'var(--color-text)' }}>
                    {w.drills.map((drill, dIndex) => (<li key={dIndex} style={{ lineHeight: '1.4' }}>{drill}</li>))}
                  </ul>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <span>⏱️ Duración: <strong>{w.duration}</strong></span>
                  <span>Dificultad: <strong style={{ color: 'var(--color-gold)' }}>{w.difficulty}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {view === 'catalog' && (
        <>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="text" placeholder="Buscar por nombre o músculo..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="form-input" style={{ flex: 1, minWidth: '160px', fontSize: '0.78rem', padding: '6px 10px' }} />
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="form-select" style={{ fontSize: '0.72rem', padding: '5px 8px', minWidth: '90px' }}>
              <option value="all">📂 Tipo</option>
              {categoryOptions.filter(c => c !== 'all').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select value={equipFilter} onChange={e => setEquipFilter(e.target.value)} className="form-select" style={{ fontSize: '0.72rem', padding: '5px 8px', minWidth: '110px' }}>
              <option value="all">🔧 Equipo</option>
              {equipmentOptions.filter(e => e !== 'all').map(eq => (
                <option key={eq} value={eq}>{EQUIP_LABELS[eq] || eq}</option>
              ))}
            </select>
            <select value={muscleFilter} onChange={e => setMuscleFilter(e.target.value)} className="form-select" style={{ fontSize: '0.72rem', padding: '5px 8px', minWidth: '110px' }}>
              <option value="all">💪 Músculo</option>
              {muscleOptions.filter(m => m !== 'all').map(m => (
                <option key={m} value={m}>{MUSCLE_LABELS[m] || m}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
              {filtered.length} de {datasetExercises.length} ejercicios
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem' }}>
                <label style={{ color: 'var(--color-text-muted)' }}>Por página:</label>
                <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
                  className="form-select" style={{ fontSize: '0.68rem', padding: '3px 6px' }}>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            )}
          </div>

          <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
            {loading ? (
              <p style={{ color: 'var(--color-text-muted)', padding: '20px', textAlign: 'center', gridColumn: '1/-1' }}>Cargando ejercicios...</p>
            ) : filtered.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', padding: '20px', textAlign: 'center', gridColumn: '1/-1' }}>No se encontraron ejercicios con esos filtros.</p>
            ) : (
              pageItems.map(ex => (
                <div key={ex.id} className="glass-panel"
                  onClick={() => setPreviewEx(ex)}
                  style={{ padding: '12px', borderLeft: `3px solid ${CATEGORY_COLORS_MAP[ex.category] || 'var(--color-primary)'}`, cursor: 'pointer', transition: 'transform 0.15s, border-color 0.2s', display: 'flex', flexDirection: 'column', gap: '4px' }}
                  onMouseEnter={e => { e.currentTarget.style.borderLeftColor = 'var(--color-gold)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderLeftColor = CATEGORY_COLORS_MAP[ex.category] || 'var(--color-primary)'; e.currentTarget.style.transform = ''; }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', fontFamily: 'Outfit', flex: 1, lineHeight: 1.2 }}>
                      {ex.name_local}
                    </div>
                    {ex.source === 'dataset' && (
                      <span style={{ fontSize: '0.55rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>DS</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: '0.6rem' }}>
                    {ex.target_muscle && <span style={{ color: '#ef4444', fontWeight: 600 }}>{ex.target_muscle}</span>}
                    {ex.equipment && <span style={{ color: 'var(--color-text-muted)' }}>· {ex.equipment}</span>}
                    {ex.body_weight && <span style={{ color: '#22c55e' }}>· cuerpo</span>}
                  </div>
                </div>
              ))
            )}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '14px', padding: '10px 0' }}>
                <button onClick={() => setPage(1)} disabled={page <= 1}
                  className="tab-btn" style={{ padding: '4px 8px', fontSize: '0.65rem', opacity: page <= 1 ? 0.3 : 1 }}>
                  ««
                </button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="tab-btn" style={{ padding: '4px 10px', fontSize: '0.65rem', opacity: page <= 1 ? 0.3 : 1 }}>
                  «
                </button>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text)', fontFamily: 'Outfit', minWidth: '100px', textAlign: 'center' }}>
                  Pág {page} de {totalPages}
                </span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="tab-btn" style={{ padding: '4px 10px', fontSize: '0.65rem', opacity: page >= totalPages ? 0.3 : 1 }}>
                  »
                </button>
                <button onClick={() => setPage(totalPages)} disabled={page >= totalPages}
                  className="tab-btn" style={{ padding: '4px 8px', fontSize: '0.65rem', opacity: page >= totalPages ? 0.3 : 1 }}>
                  »»
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {previewEx && (
        <ExercisePreviewModal
          exercise={previewEx}
          onClose={() => setPreviewEx(null)}
        />
      )}
    </div>
  );
}

export default CatalogTab;
