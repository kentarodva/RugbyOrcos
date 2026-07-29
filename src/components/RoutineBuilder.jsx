import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../context/ToastContext';
import { persistPlan } from '../engine/trainingPlanService';
import { getExerciseCatalog, getExerciseByCode } from '../services/trainingService';
import { CATEGORY_LABELS } from './TrainingHub/ExerciseIcon';

const CAT_COLORS = { calentamiento: '#f59e0b', campo: 'var(--color-primary)', gym: '#ef4444', crossfit: '#eab308', casa: '#22c55e', recuperacion: '#3b82f6', prevencion: '#a855f7' };

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

const CATS = ['calentamiento', 'campo', 'gym', 'crossfit', 'casa', 'recuperacion', 'prevencion'];

export default function RoutineBuilder({ player, existingPlan, onSaved, onClose }) {
  const { showToast } = useToast();
  const [exercises, setExercises] = useState([]);
  const [search, setSearch] = useState('');
  const [equipFilter, setEquipFilter] = useState('all');
  const [muscleFilter, setMuscleFilter] = useState('all');
  const [targetCat, setTargetCat] = useState('gym');
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [fullPreview, setFullPreview] = useState(null);

  const [plan, setPlan] = useState(() => {
    const fromExisting = {};
    CATS.forEach(c => { fromExisting[c] = (existingPlan?.plan?.[c] || []).map(e => ({ ...e, sets: e.sets || 3, reps: e.reps || 10 })); });
    return fromExisting;
  });

  useEffect(() => {
    getExerciseCatalog().then(data => { if (data) setExercises(data.filter(e => e.source === 'dataset')); }).catch(() => {});
  }, []);

  useEffect(() => { setPage(1); }, [equipFilter, muscleFilter, search]);

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
      if (equipFilter !== 'all' && e.equipment !== equipFilter) return false;
      if (muscleFilter !== 'all' && e.target_muscle !== muscleFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return e.name_local.toLowerCase().includes(q) || e.name_technical.toLowerCase().includes(q) || (e.equipment || '').toLowerCase().includes(q) || (e.target_muscle || '').toLowerCase().includes(q);
    });
  }, [exercises, equipFilter, muscleFilter, search]);

  const totalPages = Math.ceil(filtered.length / 50) || 1;
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * 50, safePage * 50);

  const totalExercises = Object.values(plan).reduce((s, arr) => s + arr.length, 0);

  const addExercise = (ex) => {
    const exists = plan[targetCat]?.some(p => p.code === ex.code);
    if (exists) return;
    const entry = { code: ex.code, name: ex.name_local || ex.name_technical, category: ex.category, equipment: ex.equipment, target_muscle: ex.target_muscle, sets: 3, reps: 10, fromCustom: true };
    setPlan(prev => ({ ...prev, [targetCat]: [...prev[targetCat], entry] }));
  };

  const removeExercise = (cat, idx) => {
    setPlan(prev => ({ ...prev, [cat]: prev[cat].filter((_, i) => i !== idx) }));
  };

  const moveExercise = (cat, idx, dir) => {
    setPlan(prev => {
      const list = [...prev[cat]];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= list.length) return prev;
      [list[idx], list[newIdx]] = [list[newIdx], list[idx]];
      return { ...prev, [cat]: list };
    });
  };

  const updateEntry = (cat, idx, field, value) => {
    setPlan(prev => ({ ...prev, [cat]: prev[cat].map((e, i) => i === idx ? { ...e, [field]: value } : e) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await persistPlan(player.id, { plan }, 'custom');
      showToast('¡Rutina guardada!', 'success');
      onSaved?.();
    } catch { showToast('Error al guardar.', 'error'); }
    finally { setSaving(false); }
  };

  const openPreview = async (ex) => {
    if (ex.instructions && ex.gif_url) { setFullPreview(ex); return; }
    try {
      const full = await getExerciseByCode(ex.code);
      setFullPreview(full || ex);
    } catch { setFullPreview(ex); }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}
        style={{ maxWidth: '920px', width: '95vw', height: '92vh', maxHeight: '92vh', display: 'flex', flexDirection: 'column', padding: '18px', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-primary)', margin: 0 }}>
              {existingPlan ? 'Modificar Plan' : 'Crear Plan'}
            </h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{player.name}</span>
          </div>
          <button onClick={onClose} className="btn-outline" style={{ padding: '5px 12px', fontSize: '0.8rem' }}>✕ Cerrar</button>
        </div>

        {/* Toolbar: target category + save */}
        <div className="glass-panel" style={{ padding: '8px 12px', marginBottom: '10px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Agregar a:</span>
          {CATS.map(c => (
            <button key={c} onClick={() => setTargetCat(c)}
              className="tab-btn" style={{
                padding: '3px 10px', fontSize: '0.68rem', fontWeight: targetCat === c ? 700 : 400,
                background: targetCat === c ? `${CAT_COLORS[c]}22` : 'transparent',
                borderColor: targetCat === c ? CAT_COLORS[c] : 'transparent',
              }}>
              {c[0].toUpperCase() + c.slice(1)}
            </button>
          ))}
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={handleSave} disabled={saving || totalExercises === 0}
              className="btn-neon" style={{ padding: '5px 16px', fontSize: '0.75rem', opacity: totalExercises === 0 ? 0.4 : 1 }}>
              {saving ? 'Guardando...' : '💾 Guardar'}
            </button>
          </div>
        </div>

        {/* Two-column body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* LEFT - Catalog */}
          <div className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Outfit', color: 'var(--color-text)' }}>
              📋 Catálogo <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>{filtered.length} ejercicios</span>
            </div>

            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Buscar..."
                className="form-input" style={{ flex: 1, minWidth: '80px', fontSize: '0.7rem', padding: '5px 8px' }} />
              <select value={equipFilter} onChange={e => setEquipFilter(e.target.value)}
                className="form-select" style={{ fontSize: '0.65rem', padding: '4px 5px', minWidth: '85px' }}>
                <option value="all">🔧 Equipo</option>
                {equipmentOptions.filter(e => e !== 'all').map(eq => (
                  <option key={eq} value={eq}>{EQUIP_LABELS[eq] || eq}</option>
                ))}
              </select>
              <select value={muscleFilter} onChange={e => setMuscleFilter(e.target.value)}
                className="form-select" style={{ fontSize: '0.65rem', padding: '4px 5px', minWidth: '95px' }}>
                <option value="all">💪 Músculo</option>
                {muscleOptions.filter(m => m !== 'all').map(m => (
                  <option key={m} value={m}>{MUSCLE_LABELS[m] || m}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px', minHeight: 0 }}>
              {pageItems.length === 0 ? (
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>Sin ejercicios.</p>
              ) : (
                pageItems.map(ex => {
                  const added = plan[targetCat]?.some(p => p.code === ex.code);
                  const addedAny = CATS.some(c => plan[c]?.some(p => p.code === ex.code));
                  return (
                    <div key={ex.code}
                      onClick={() => openPreview(ex)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '5px 8px', borderRadius: '6px', fontSize: '0.7rem',
                        background: addedAny ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)',
                        opacity: added ? 0.35 : 1, cursor: added ? 'default' : 'pointer',
                        border: '1px solid transparent', transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={e => { if (!added) e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ex.name_local}
                        </div>
                        <div style={{ display: 'flex', gap: '4px', fontSize: '0.6rem', color: 'var(--color-text-muted)', marginTop: '1px' }}>
                          {ex.target_muscle && <span style={{ color: '#ef4444', fontWeight: 600 }}>{MUSCLE_LABELS[ex.target_muscle] || ex.target_muscle}</span>}
                          {ex.equipment && <span>· {EQUIP_LABELS[ex.equipment] || ex.equipment}</span>}
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); addExercise(ex); }}
                        disabled={added}
                        style={{
                          padding: '3px 8px', fontSize: '0.65rem', borderRadius: '4px', flexShrink: 0,
                          background: added ? 'transparent' : 'var(--color-primary)',
                          color: added ? 'var(--color-text-muted)' : '#000', border: 'none',
                          cursor: added ? 'default' : 'pointer', fontWeight: 700, marginLeft: '8px',
                        }}>
                        {added ? '✓' : '+'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                <button onClick={() => setPage(1)} disabled={safePage <= 1} className="tab-btn" style={{ padding: '2px 5px', fontSize: '0.6rem', opacity: safePage <= 1 ? 0.3 : 1 }}>««</button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1} className="tab-btn" style={{ padding: '2px 5px', fontSize: '0.6rem', opacity: safePage <= 1 ? 0.3 : 1 }}>«</button>
                <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--color-text)', minWidth: '50px', textAlign: 'center' }}>{safePage}/{totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="tab-btn" style={{ padding: '2px 5px', fontSize: '0.6rem', opacity: safePage >= totalPages ? 0.3 : 1 }}>»</button>
                <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages} className="tab-btn" style={{ padding: '2px 5px', fontSize: '0.6rem', opacity: safePage >= totalPages ? 0.3 : 1 }}>»»</button>
              </div>
            )}
          </div>

          {/* RIGHT - Routine */}
          <div className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Outfit', color: 'var(--color-text)' }}>
              🏗️ Mi Rutina <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>{totalExercises} ejercicios</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0 }}>
              {CATS.map(cat => {
                const entries = plan[cat] || [];
                if (entries.length === 0) return null;
                return (
                  <div key={cat}>
                    <div style={{
                      fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase',
                      color: CAT_COLORS[cat] || 'var(--color-text-muted)',
                      borderBottom: `2px solid ${CAT_COLORS[cat]}33`, paddingBottom: '2px', marginBottom: '3px',
                      display: 'flex', justifyContent: 'space-between',
                    }}>
                      <span>{CATEGORY_LABELS[cat] || cat}</span>
                      <span style={{ fontWeight: 400, opacity: 0.6 }}>{entries.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {entries.map((ex, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '4px 7px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '0.68rem',
                        }}>
                          <div style={{ flexDirection: 'column', flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <button onClick={() => moveExercise(cat, i, -1)} disabled={i === 0}
                                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: i === 0 ? 'default' : 'pointer', fontSize: '0.5rem', padding: 0, opacity: i === 0 ? 0.2 : 0.7 }}>▲</button>
                              <button onClick={() => moveExercise(cat, i, 1)} disabled={i === entries.length - 1}
                                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: i === entries.length - 1 ? 'default' : 'pointer', fontSize: '0.5rem', padding: 0, opacity: i === entries.length - 1 ? 0.2 : 0.7 }}>▼</button>
                              <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{ex.name}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <input type="number" value={ex.sets || 3} onChange={e => updateEntry(cat, i, 'sets', Math.max(1, Number(e.target.value)))}
                              style={{ width: '24px', padding: '1px', fontSize: '0.6rem', textAlign: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-glass)', borderRadius: '3px', color: 'var(--color-text)' }} />
                            <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)' }}>×</span>
                            <input type="number" value={ex.reps || 10} onChange={e => updateEntry(cat, i, 'reps', Math.max(1, Number(e.target.value)))}
                              style={{ width: '24px', padding: '1px', fontSize: '0.6rem', textAlign: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-glass)', borderRadius: '3px', color: 'var(--color-text)' }} />
                            <button onClick={() => removeExercise(cat, i)}
                              style={{ marginLeft: '3px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.7rem', padding: 0, lineHeight: 1 }}>✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {totalExercises === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--color-text-muted)', textAlign: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '1.5rem', opacity: 0.3 }}>🏗️</span>
                  <p style={{ fontSize: '0.7rem' }}>Elegí ejercicios del catálogo. Cambiá de categoría para armar cada sección.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview modal */}
        {fullPreview && (
          <div className="modal-overlay" onClick={() => setFullPreview(null)} style={{ zIndex: 1200 }}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}
              style={{ maxWidth: '480px', maxHeight: '80vh', overflowY: 'auto', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-primary)', margin: 0 }}>{fullPreview.name_local}</h3>
                <button onClick={() => setFullPreview(null)} className="btn-outline" style={{ padding: '3px 8px', fontSize: '0.7rem' }}>✕</button>
              </div>
              {fullPreview.gif_url && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                  <img src={fullPreview.gif_url} alt={fullPreview.name_local} style={{ width: '150px', height: '150px', borderRadius: '10px', objectFit: 'cover', background: 'rgba(255,255,255,0.03)' }} />
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '10px' }}>
                {fullPreview.target_muscle && <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 600 }}>{MUSCLE_LABELS[fullPreview.target_muscle] || fullPreview.target_muscle}</span>}
                {fullPreview.equipment && <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: '8px', background: 'rgba(234,179,8,0.1)', color: '#eab308', fontWeight: 600 }}>{EQUIP_LABELS[fullPreview.equipment] || fullPreview.equipment}</span>}
              </div>
              {fullPreview.instructions && typeof fullPreview.instructions === 'object' && (fullPreview.instructions.es || fullPreview.instructions.en) && (
                <p style={{ fontSize: '0.68rem', color: 'var(--color-text)', lineHeight: '1.5', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                  {fullPreview.instructions.es || fullPreview.instructions.en}
                </p>
              )}
              <div style={{ marginTop: '12px', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button onClick={() => { addExercise(fullPreview); setFullPreview(null); }}
                  className="btn-neon" style={{ padding: '6px 14px', fontSize: '0.72rem' }}>
                  ➕ Agregar a {CATEGORY_LABELS[targetCat] || targetCat}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
