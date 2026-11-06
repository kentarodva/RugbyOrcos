import { useState, useEffect, useMemo } from 'react';
import { getExerciseCatalog, getExerciseByCode } from '../../services/trainingService';

const MUSCLE_LABELS = {
  abductors: 'Abductores', abs: 'Abdominales', adductors: 'Aductores',
  biceps: 'Bíceps', calves: 'Pantorrillas', 'cardiovascular system': 'Cardio',
  delts: 'Hombros', forearms: 'Antebrazos', glutes: 'Glúteos',
  hamstrings: 'Isquiotibiales', lats: 'Dorsales', 'levator scapulae': 'Elev. Escápula',
  pectorals: 'Pectorales', quads: 'Cuádriceps', 'serratus anterior': 'Serrato',
  spine: 'Espinales', traps: 'Trapecios', triceps: 'Tríceps', 'upper back': 'Espalda Alta',
};

const EQUIP_LABELS = {
  assisted: 'Asistido', band: 'Banda', barbell: 'Barra', 'body weight': 'Peso Corp.',
  'bosu ball': 'Bosu', cable: 'Polea', dumbbell: 'Mancuerna',
  'elliptical machine': 'Elíptica', 'ez barbell': 'Barra EZ', hammer: 'Martillo',
  kettlebell: 'Pesa Rusa', 'leverage machine': 'Máquina', 'medicine ball': 'Balón Med',
  'olympic barbell': 'Barra Olímpica', 'resistance band': 'Banda Resist.', roller: 'Rodillo',
  rope: 'Cuerda', 'skierg machine': 'Esquiador', 'sled machine': 'Trineo',
  'smith machine': 'Smith', 'stability ball': 'Balón Estab.',
  'stationary bike': 'Bici Fija', 'stepmill machine': 'Escaladora', tire: 'Llanta',
  'trap bar': 'Barra Hex', 'upper body ergometer': 'Ergómetro', weighted: 'Lastrado',
  'wheel roller': 'Rueda Abd.',
};

function ExercisePicker({ onSelect, onClose }) {
  const [exercises, setExercises] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [equipFilter, setEquipFilter] = useState('all');
  const [muscleFilter, setMuscleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [fullPreview, setFullPreview] = useState(null);

  useEffect(() => {
    setLoading(true);
    getExerciseCatalog().then(data => {
      setExercises(data.filter(e => e.source === 'dataset'));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const categoryOptions = useMemo(() => {
    const cats = [...new Set(exercises.map(e => e.category).filter(Boolean))].sort();
    return ['all', ...cats];
  }, [exercises]);

  const equipmentOptions = useMemo(() => {
    const set = new Set(exercises.filter(e => e.equipment).map(e => e.equipment));
    return ['all', ...[...set].sort()];
  }, [exercises]);

  const muscleOptions = useMemo(() => {
    const targets = [...new Set(exercises.map(e => e.target_muscle).filter(Boolean))].sort();
    return ['all', ...targets];
  }, [exercises]);

  const filtered = useMemo(() => {
    return exercises.filter(e => {
      if (catFilter !== 'all' && e.category !== catFilter) return false;
      if (equipFilter !== 'all' && e.equipment !== equipFilter) return false;
      if (muscleFilter !== 'all' && e.target_muscle !== muscleFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return e.name_local.toLowerCase().includes(q) || e.name_technical.toLowerCase().includes(q) || (e.equipment || '').toLowerCase().includes(q) || (e.target_muscle || '').toLowerCase().includes(q);
    });
  }, [exercises, catFilter, equipFilter, muscleFilter, search]);

  const openPreview = async (ex) => {
    if (ex.instructions && ex.gif_url) { setFullPreview(ex); return; }
    try {
      const full = await getExerciseByCode(ex.code);
      setFullPreview(full || ex);
    } catch { setFullPreview(ex); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel"
        style={{ maxWidth: '780px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
            Catálogo de Ejercicios <span style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem', fontWeight: 400 }}>({filtered.length})</span>
          </h3>
          <button onClick={onClose} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Buscar por nombre..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="form-input" style={{ flex: 1, minWidth: '150px', fontSize: '0.73rem', padding: '6px 8px' }} />
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="form-select" style={{ fontSize: '0.68rem', padding: '5px 6px' }}>
            <option value="all">📂 Tipo</option>
            {categoryOptions.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={equipFilter} onChange={e => setEquipFilter(e.target.value)} className="form-select" style={{ fontSize: '0.68rem', padding: '5px 6px', minWidth: '100px' }}>
            <option value="all">🔧 Equipo</option>
            {equipmentOptions.filter(e => e !== 'all').map(eq => (
              <option key={eq} value={eq}>{EQUIP_LABELS[eq] || eq}</option>
            ))}
          </select>
          <select value={muscleFilter} onChange={e => setMuscleFilter(e.target.value)} className="form-select" style={{ fontSize: '0.68rem', padding: '5px 6px', minWidth: '110px' }}>
            <option value="all">💪 Músculo</option>
            {muscleOptions.filter(m => m !== 'all').map(m => (
              <option key={m} value={m}>{MUSCLE_LABELS[m] || m}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <p style={{ color: 'var(--color-text-muted)', padding: '20px', textAlign: 'center' }}>Cargando ejercicios...</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', padding: '20px', textAlign: 'center' }}>No se encontraron ejercicios.</p>
          ) : (
            <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: '7px' }}>
              {filtered.slice(0, 200).map(ex => (
                <div key={ex.code} className="glass-panel"
                  style={{ padding: '10px', cursor: 'pointer', border: '1px solid transparent', transition: 'border-color 0.15s', display: 'flex', flexDirection: 'column', gap: '4px' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                  onClick={() => openPreview(ex)}>
                  <div style={{ fontWeight: 700, fontSize: '0.78rem', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>
                    {ex.name_local}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: '0.6rem' }}>
                    {ex.target_muscle && <span style={{ color: '#ef4444', fontWeight: 600 }}>{MUSCLE_LABELS[ex.target_muscle] || ex.target_muscle}</span>}
                    {ex.equipment && <span style={{ color: 'var(--color-text-muted)' }}>· {EQUIP_LABELS[ex.equipment] || ex.equipment}</span>}
                    {ex.source === 'dataset' && <span style={{ color: '#a855f7', marginLeft: 'auto', fontSize: '0.55rem' }}>DS</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '4px', marginTop: 'auto', paddingTop: '4px' }}>
                    <button onClick={e => { e.stopPropagation(); onSelect(ex); }} className="btn-neon" style={{ padding: '2px 8px', fontSize: '0.65rem', flex: 1 }}>
                      Seleccionar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {fullPreview && (
          <div className="modal-overlay" onClick={() => setFullPreview(null)} style={{ zIndex: 1200 }}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}
              style={{ maxWidth: '450px', maxHeight: '80vh', overflowY: 'auto', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>{fullPreview.name_local}</h3>
                <button onClick={() => setFullPreview(null)} className="btn-outline" style={{ padding: '3px 8px', fontSize: '0.7rem' }}>✕</button>
              </div>
              {fullPreview.gif_url && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                  <img src={fullPreview.gif_url} alt={fullPreview.name_local} style={{ width: '140px', height: '140px', borderRadius: '10px', objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '10px' }}>
                {fullPreview.target_muscle && <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 600 }}>{MUSCLE_LABELS[fullPreview.target_muscle] || fullPreview.target_muscle}</span>}
                {fullPreview.equipment && <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: '8px', background: 'rgba(234,179,8,0.1)', color: '#eab308', fontWeight: 600 }}>{EQUIP_LABELS[fullPreview.equipment] || fullPreview.equipment}</span>}
              </div>
              {fullPreview.instructions && typeof fullPreview.instructions === 'object' && (fullPreview.instructions.es || fullPreview.instructions.en) && (
                <p style={{ fontSize: '0.68rem', color: 'var(--color-text)', lineHeight: '1.5', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', maxHeight: '100px', overflowY: 'auto' }}>
                  {fullPreview.instructions.es || fullPreview.instructions.en}
                </p>
              )}
              <div style={{ marginTop: '10px', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button onClick={() => { onSelect(fullPreview); setFullPreview(null); }}
                  className="btn-neon" style={{ padding: '6px 14px', fontSize: '0.72rem' }}>
                  ➕ Seleccionar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExercisePicker;
