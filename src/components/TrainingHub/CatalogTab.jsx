import { useState, useEffect, useContext } from 'react';
import { ClubContext } from '../../context/ClubContext';
import { supabase } from '../../supabaseClient';
import { WORKOUTS, CATEGORY_LABELS as PLAN_LABELS, CATEGORY_ICONS, CATEGORY_COLORS } from './constants';
import ExerciseIcon, { CATEGORY_LABELS, SUBCATEGORY_LABELS } from './ExerciseIcon';
import ExercisePicker from './ExercisePicker';

const DIFFICULTY_LABELS = { 1: 'Muy Fácil', 2: 'Fácil', 3: 'Media', 4: 'Difícil', 5: 'Extrema' };
const CATEGORY_COLORS_MAP = {
  campo: 'var(--color-primary)', gym: '#ff3d00',
  recuperacion: '#00b0ff', prevencion: '#9c27b0',
};

const SUBCATEGORIES_LIST = ['all', 'tackle', 'pase', 'scrum', 'patada', 'evasion', 'defensa',
  'resistencia', 'liderazgo', 'fuerza_inferior', 'fuerza_superior', 'potencia', 'core',
  'velocidad', 'movilidad', 'hombros', 'cuello', 'rodillas', 'tobillos'];

function CatalogTab({ activeCategory, onCategoryChange }) {
  const { userTier } = useContext(ClubContext);
  const [view, setView] = useState('plans');
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [subFilter, setSubFilter] = useState('all');
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase.from('exercise_catalog').select('*').order('name_technical').then(({ data, error }) => {
      if (!error && data) setExercises(data);
      setLoading(false);
    });
  }, []);

  const filtered = exercises.filter(e => {
    if (catFilter !== 'all' && e.category !== catFilter) return false;
    if (subFilter !== 'all' && e.subcategory !== subFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return e.name_technical.toLowerCase().includes(q) || e.name_local.toLowerCase().includes(q);
  });

  const grouped = filtered.reduce((acc, e) => {
    const key = `${e.category}_${e.subcategory}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  const isStaff = userTier <= 3;

  const plansCategories = ['forwards', 'backs', 'captain', 'coach', 'general'];
  const borderColor = CATEGORY_COLORS[activeCategory] || 'var(--color-primary)';

  return (
    <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setView('plans')}
            className={`tab-btn ${view === 'plans' ? 'active' : ''}`}>
            Planes de Entrenamiento
          </button>
          <button onClick={() => setView('catalog')}
            className={`tab-btn ${view === 'catalog' ? 'active' : ''}`}>
            Catálogo de Ejercicios
          </button>
        </div>
        {view === 'catalog' && isStaff && (
          <button onClick={() => setShowPicker(true)}
            className="btn-outline" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
            ✏️ Nuevo Ejercicio
          </button>
        )}
      </div>

      {view === 'plans' && (
        <>
          <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', flexWrap: 'wrap' }}>
            {plansCategories.map(cat => (
              <button key={cat} onClick={() => onCategoryChange(cat)}
                className={`tab-btn ${activeCategory === cat ? 'active' : ''}`}>
                {CATEGORY_ICONS[cat]} {PLAN_LABELS[cat]}
              </button>
            ))}
          </div>

          <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
            {WORKOUTS[activeCategory]?.map((w, index) => (
              <div key={index} className="glass-panel animated-slide"
                style={{ padding: '25px', borderLeft: `4px solid ${borderColor}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '15px' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit' }}>{w.title}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      Posiciones: <strong>{w.focus}</strong>
                    </p>
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.5', marginBottom: '15px', background: 'var(--bg-dark)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                  {w.description}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase' }}>Rutina de Campo:</span>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '15px', fontSize: '0.8rem', color: 'var(--color-text)' }}>
                    {w.drills.map((drill, dIndex) => (
                      <li key={dIndex} style={{ lineHeight: '1.4' }}>{drill}</li>
                    ))}
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
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Buscar ejercicio..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="form-input" style={{ flex: 1, minWidth: '180px', fontSize: '0.8rem' }} />
            <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setSubFilter('all'); }}
              className="form-select" style={{ fontSize: '0.8rem' }}>
              <option value="all">Todas las categorías</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select value={subFilter} onChange={e => setSubFilter(e.target.value)}
              className="form-select" style={{ fontSize: '0.8rem' }}>
              <option value="all">Todas las subcategorías</option>
              {SUBCATEGORIES_LIST.filter(s => s !== 'all').map(s => (
                <option key={s} value={s}>{SUBCATEGORY_LABELS[s] || s}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {loading ? (
              <p style={{ color: 'var(--color-text-muted)', padding: '20px', textAlign: 'center' }}>Cargando ejercicios...</p>
            ) : filtered.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', padding: '20px', textAlign: 'center' }}>No se encontraron ejercicios.</p>
            ) : (
              Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([groupKey, groupExercises]) => {
                const [cat, sub] = groupKey.split('_');
                const color = CATEGORY_COLORS_MAP[cat] || 'var(--color-primary)';
                return (
                  <div key={groupKey}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                      {CATEGORY_LABELS[cat] || cat} &gt; {SUBCATEGORY_LABELS[sub] || sub}
                    </h4>
                    <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                      {groupExercises.map(ex => (
                        <div key={ex.id} className="glass-panel animated-slide"
                          style={{ padding: '14px', borderLeft: `3px solid ${color}`, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', fontFamily: 'Outfit' }}>
                            <ExerciseIcon category={ex.category} subcategory={ex.subcategory} size={14} /> {ex.name_local}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                            {ex.name_technical}
                          </div>
                          {ex.description && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-text)', background: 'var(--bg-dark)', padding: '8px', borderRadius: '4px', lineHeight: '1.4' }}>
                              {ex.description}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '8px', fontSize: '0.65rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                            {ex.difficulty && <span>{'⭐'.repeat(ex.difficulty)}</span>}
                            <span>🎯 {ex.target_positions}</span>
                            {ex.equipment && <span>🔧 {ex.equipment}</span>}
                            <span style={{ fontSize: '0.6rem', color: ex.is_system ? 'var(--color-text-muted)' : 'var(--color-gold)' }}>
                              {ex.is_system ? 'Sistema' : 'Personalizado'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {showPicker && (
        <ExercisePicker
          onSelect={() => {}}
          onClose={() => setShowPicker(false)}
          allowCreate
        />
      )}
    </div>
  );
}

export default CatalogTab;
