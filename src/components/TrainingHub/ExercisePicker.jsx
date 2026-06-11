import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import ExerciseIcon, { CATEGORY_LABELS, SUBCATEGORY_LABELS } from './ExerciseIcon';
import ExerciseForm from './ExerciseForm';

const DIFFICULTY_LABELS = { 1: 'Muy Fácil', 2: 'Fácil', 3: 'Media', 4: 'Difícil', 5: 'Extrema' };

function ExercisePicker({ onSelect, onClose, allowCreate }) {
  const [exercises, setExercises] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase.from('exercise_catalog').select('*').order('name_technical').then(({ data, error }) => {
      if (!error && data) setExercises(data);
      setLoading(false);
    });
  }, []);

  const categories = ['all', ...new Set(exercises.map(e => e.category))];
  const subcategories = categoryFilter === 'all'
    ? ['all', ...new Set(exercises.map(e => e.subcategory))]
    : ['all', ...new Set(exercises.filter(e => e.category === categoryFilter).map(e => e.subcategory))];

  const filtered = exercises.filter(e => {
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    if (subcategoryFilter !== 'all' && e.subcategory !== subcategoryFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return e.name_technical.toLowerCase().includes(q)
      || e.name_local.toLowerCase().includes(q)
      || (e.description || '').toLowerCase().includes(q);
  });

  const grouped = filtered.reduce((acc, e) => {
    const key = `${e.category}_${e.subcategory}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animated-slide"
        style={{ maxWidth: '900px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit' }}>
            Catálogo de Ejercicios
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {allowCreate && (
              <button onClick={() => setShowForm(true)} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                ✏️ Crear Ejercicio
              </button>
            )}
            <button onClick={onClose} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Buscar ejercicio..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="form-input" style={{ flex: 1, minWidth: '180px', fontSize: '0.8rem' }} />
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setSubcategoryFilter('all'); }}
            className="form-select" style={{ fontSize: '0.8rem' }}>
            {categories.map(c => (
              <option key={c} value={c}>{c === 'all' ? 'Todas las categorías' : CATEGORY_LABELS[c] || c}</option>
            ))}
          </select>
          <select value={subcategoryFilter} onChange={e => setSubcategoryFilter(e.target.value)}
            className="form-select" style={{ fontSize: '0.8rem' }}>
            {subcategories.map(s => (
              <option key={s} value={s}>{s === 'all' ? 'Todas las subcategorías' : SUBCATEGORY_LABELS[s] || s}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <p style={{ color: 'var(--color-text-muted)', padding: '20px', textAlign: 'center' }}>Cargando ejercicios...</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', padding: '20px', textAlign: 'center' }}>No se encontraron ejercicios.</p>
          ) : (
            sortedGroups.map(([groupKey, groupExercises]) => {
              const [cat, sub] = groupKey.split('_');
              return (
                <div key={groupKey}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                    {CATEGORY_LABELS[cat] || cat} &gt; {SUBCATEGORY_LABELS[sub] || sub}
                  </h4>
                  <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                    {groupExercises.map(ex => (
                      <button key={ex.id} onClick={() => onSelect(ex)}
                        className="glass-panel"
                        style={{ padding: '12px', textAlign: 'left', cursor: 'pointer', border: '1px solid transparent', transition: 'border-color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.83rem', fontFamily: 'Outfit' }}>
                            <ExerciseIcon category={ex.category} subcategory={ex.subcategory} size={14} /> {ex.name_local}
                          </div>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                          {ex.name_technical}
                        </div>
                        {ex.difficulty && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--color-gold)' }}>
                            {'⭐'.repeat(ex.difficulty)} {DIFFICULTY_LABELS[ex.difficulty]}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {showForm && (
          <ExerciseForm
            onCreated={(newEx) => {
              setExercises(prev => [...prev, newEx]);
              setShowForm(false);
            }}
            onClose={() => setShowForm(false)}
          />
        )}
      </div>
    </div>
  );
}

export default ExercisePicker;
