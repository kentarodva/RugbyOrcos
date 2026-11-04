import { useState, useEffect, useMemo, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import { persistPlan } from '../../engine/trainingPlanService';
import { getExerciseCatalog, getExerciseByCode } from '../../services/trainingService';
import { CATEGORY_LABELS } from './ExerciseIcon';

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

const CAT_DESC = {
  calentamiento: 'Movilidad, activación y preparación física',
  campo: 'Rugby específico: tackle, pase, scrum, maul',
  gym: 'Fuerza, hipertrofia y potencia en gimnasio',
  crossfit: 'Alta intensidad, resistencia y funcional',
  casa: 'Ejercicios sin equipo para hacer en casa',
  recuperacion: 'Estiramientos, foam roller y descanso activo',
  prevencion: 'Trabajo preventivo de lesiones y estabilidad',
};

export default function BuilderTab({ teamPlayers, onBuilderPlanSaved }) {
  const { showToast } = useToast();
  const [exercises, setExercises] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [saving, setSaving] = useState(false);
  const [addingTo, setAddingTo] = useState(null);
  const [previewEx, setPreviewEx] = useState(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalSearchCat, setGlobalSearchCat] = useState('gym');
  const [playerSearch, setPlayerSearch] = useState('');
  const [showPlayerList, setShowPlayerList] = useState(false);
  const [playerDropPos, setPlayerDropPos] = useState({ top: 0, left: 0, width: 0 });
  const playerInputRef = useRef(null);

  const [plan, setPlan] = useState(() => {
    const init = {};
    CATS.forEach(c => { init[c] = []; });
    return init;
  });

  useEffect(() => {
    getExerciseCatalog().then(data => {
      if (data) setExercises(data.filter(e => e.source === 'dataset'));
    }).catch(() => {});
  }, []);

  const selectedPlayer = useMemo(() =>
    teamPlayers.find(p => p.id === selectedPlayerId) || null,
    [teamPlayers, selectedPlayerId]
  );

  const filteredPlayers = useMemo(() => {
    if (!playerSearch.trim()) return teamPlayers.slice(0, 30);
    const q = playerSearch.toLowerCase();
    return teamPlayers.filter(p => p.name.toLowerCase().includes(q)).slice(0, 30);
  }, [teamPlayers, playerSearch]);

  useEffect(() => {
    if (!showPlayerList) return;
    const handler = (e) => {
      setTimeout(() => {
        const dropdown = document.getElementById('builder-player-dropdown');
        const input = document.getElementById('builder-player-input');
        if (!dropdown?.contains(e.target) && !input?.contains(e.target)) {
          setShowPlayerList(false);
        }
      }, 0);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPlayerList]);

  const selectPlayer = (id) => {
    setSelectedPlayerId(id);
    const p = teamPlayers.find(p => p.id === id);
    setPlayerSearch(p ? p.name : '');
    setShowPlayerList(false);
  };

  const totalExercises = Object.values(plan).reduce((s, arr) => s + arr.length, 0);

  const searchResults = useMemo(() => {
    if (!globalSearch.trim()) return [];
    const q = globalSearch.toLowerCase();
    return exercises.filter(e =>
      e.name_local.toLowerCase().includes(q) ||
      e.name_technical.toLowerCase().includes(q) ||
      (e.target_muscle || '').toLowerCase().includes(q) ||
      (e.equipment || '').toLowerCase().includes(q)
    ).slice(0, 25);
  }, [exercises, globalSearch]);

  const addToCategory = (cat, ex) => {
    const exists = plan[cat]?.some(p => p.code === ex.code);
    if (exists) { showToast('Ya está agregado en esta categoría.', 'warning'); return; }
    const entry = { code: ex.code, name: ex.name_local || ex.name_technical, category: ex.category, equipment: ex.equipment, target_muscle: ex.target_muscle, sets: 3, reps: 10, fromCustom: true };
    setPlan(prev => ({ ...prev, [cat]: [...prev[cat], entry] }));
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
    if (!selectedPlayerId) { showToast('Selecciona un jugador.', 'warning'); return; }
    if (totalExercises === 0) { showToast('Agrega al menos un ejercicio.', 'warning'); return; }
    setSaving(true);
    try {
      await persistPlan(selectedPlayerId, { plan }, 'custom');
      showToast('¡Rutina guardada!', 'success');
      onBuilderPlanSaved?.(selectedPlayerId);
    } catch { showToast('Error al guardar.', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header bar */}
      <div className="glass-panel" style={{
        padding: '14px 18px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center',
        borderLeft: '4px solid var(--color-primary)',
      }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-primary)', margin: 0 }}>
            🛠️ Constructor de Rutinas
          </h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
            Construí rutinas personalizadas arrastrando ejercicios a cada categoría.
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div id="builder-player-input" ref={playerInputRef} style={{ position: 'relative', minWidth: '200px' }}>
            <input type="text"
              value={playerSearch}
              onChange={e => { setPlayerSearch(e.target.value); setShowPlayerList(true); }}
              onFocus={() => {
                if (playerInputRef.current) {
                  const r = playerInputRef.current.getBoundingClientRect();
                  setPlayerDropPos({ top: r.bottom + 2, left: r.left, width: r.width });
                }
                setShowPlayerList(true);
                setPlayerSearch('');
              }}
              placeholder={selectedPlayer ? selectedPlayer.name : '🎯 Buscar jugador...'}
              className="form-input" style={{ fontSize: '0.8rem', padding: '8px 14px', width: '100%', fontWeight: 600, fontFamily: 'Outfit' }} />
            {showPlayerList && (
              <div id="builder-player-dropdown" className="glass-panel" style={{
                position: 'fixed', top: playerDropPos.top, left: playerDropPos.left,
                width: playerDropPos.width || 280,
                maxHeight: '300px', overflowY: 'auto', zIndex: 1055,
                borderLeft: '3px solid var(--color-primary)',
              }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-glass)', position: 'sticky', top: 0, background: 'inherit', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: 'Outfit' }}>🎯 Buscar jugador</span>
                  <button onClick={() => setShowPlayerList(false)} className="btn-outline" style={{ padding: '2px 8px', fontSize: '0.65rem' }}>✕</button>
                </div>
                {filteredPlayers.length === 0 ? (
                  <p style={{ padding: '10px', fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                    Sin resultados
                  </p>
                ) : (
                  filteredPlayers.map(p => (
                    <div key={p.id}
                      onClick={() => selectPlayer(p.id)}
                      style={{
                        padding: '8px 12px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        background: p.id === selectedPlayerId ? 'rgba(34,197,94,0.08)' : 'transparent',
                        color: p.id === selectedPlayerId ? 'var(--color-primary)' : 'var(--color-text)',
                      }}
                      onMouseEnter={e => { if (p.id !== selectedPlayerId) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={e => { if (p.id !== selectedPlayerId) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {p.name}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <button onClick={handleSave} disabled={saving || totalExercises === 0 || !selectedPlayerId}
            className="btn-neon" style={{ padding: '8px 20px', fontSize: '0.82rem', opacity: (totalExercises === 0 || !selectedPlayerId) ? 0.35 : 1, fontWeight: 700, whiteSpace: 'nowrap' }}>
            {saving ? 'Guardando...' : `💾 Guardar (${totalExercises})`}
          </button>
        </div>
      </div>

      {/* Global search bar */}
      <div className="glass-panel" id="builder-search-bar" style={{ padding: '10px 14px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Outfit', color: 'var(--color-text)', whiteSpace: 'nowrap' }}>🔍 Búsqueda rápida</span>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input type="text" value={globalSearch} onChange={e => setGlobalSearch(e.target.value)}
            placeholder="Buscar por nombre, músculo o equipo..."
            className="form-input" style={{ width: '100%', fontSize: '0.75rem', padding: '7px 10px' }} />
        </div>
        <select value={globalSearchCat} onChange={e => setGlobalSearchCat(e.target.value)}
          className="form-select" style={{ fontSize: '0.7rem', padding: '6px 8px', minWidth: '110px', fontWeight: 600 }}>
          {CATS.map(c => (
            <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>
          ))}
        </select>
        {globalSearch.trim() && (
          <button onClick={() => setGlobalSearch('')} className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>✕</button>
        )}
      </div>

      {/* Fixed search results overlay */}
      {globalSearch.trim() && searchResults.length > 0 && (
        <div className="glass-panel" style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          maxWidth: '600px', width: '90vw', maxHeight: '70vh', overflowY: 'auto',
          zIndex: 1050, borderLeft: '4px solid var(--color-primary)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid var(--border-glass)', position: 'sticky', top: 0, background: 'inherit', zIndex: 1 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'Outfit' }}>
              Resultados para "{globalSearch}"
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 400, marginLeft: '6px' }}>
                → {CATEGORY_LABELS[globalSearchCat] || globalSearchCat}
              </span>
            </span>
            <button onClick={() => setGlobalSearch('')} className="btn-outline" style={{ padding: '4px 12px', fontSize: '0.7rem' }}>✕ Cerrar</button>
          </div>
          <div style={{ padding: '6px 0' }}>
            {searchResults.map(ex => {
              const inCat = plan[globalSearchCat]?.some(p => p.code === ex.code);
              const addedAny = CATS.some(c => plan[c]?.some(p => p.code === ex.code));
              const addedWhere = addedAny ? CATS.find(c => plan[c]?.some(p => p.code === ex.code)) : null;
              return (
                <div key={ex.code} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                  fontSize: '0.75rem', background: addedAny ? 'rgba(34,197,94,0.04)' : 'transparent',
                }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: '10px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                      {ex.name_local}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', fontSize: '0.62rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {ex.target_muscle && <span style={{ color: '#ef4444', fontWeight: 600 }}>{MUSCLE_LABELS[ex.target_muscle] || ex.target_muscle}</span>}
                      {ex.equipment && <span>· {EQUIP_LABELS[ex.equipment] || ex.equipment}</span>}
                      {addedAny && <span style={{ color: '#22c55e', fontWeight: 600 }}>· Agregado en {CATEGORY_LABELS[addedWhere] || addedWhere}</span>}
                    </div>
                  </div>
                  {inCat ? (
                    <span style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 600, whiteSpace: 'nowrap' }}>✓ Agregado</span>
                  ) : (
                    <button onClick={() => {
                      if (!selectedPlayerId) { showToast('Selecciona un jugador primero.', 'warning'); return; }
                      addToCategory(globalSearchCat, ex);
                    }} className="btn-neon" style={{ padding: '4px 12px', fontSize: '0.68rem', whiteSpace: 'nowrap', fontWeight: 600 }}>
                      + Agregar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {globalSearch.trim() && searchResults.length === 0 && (
        <div className="glass-panel" style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          maxWidth: '400px', width: '80vw', zIndex: 1050,
          padding: '30px', textAlign: 'center', borderLeft: '4px solid var(--color-primary)',
        }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0 0 12px' }}>
            Sin resultados para "{globalSearch}"
          </p>
          <button onClick={() => setGlobalSearch('')} className="btn-outline" style={{ padding: '6px 14px', fontSize: '0.72rem' }}>
            ✕ Cerrar
          </button>
        </div>
      )}

      {/* Category sections */}
      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textAlign: 'center', margin: '0 0 -6px' }}>
        Cada contenedor es una <strong>sección de la rutina</strong>. Agregá ejercicios donde correspondan.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '14px' }}>
        {CATS.map(cat => {
          const entries = plan[cat] || [];
          const color = CAT_COLORS[cat] || 'var(--color-primary)';
          return (
            <div key={cat} className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: `3px solid ${color}` }}>
              
              {/* Category header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 800, fontFamily: 'Outfit', color, margin: 0, textTransform: 'uppercase' }}>
                    {CATEGORY_LABELS[cat] || cat}
                  </h4>
                  <p style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', margin: '2px 0 0', lineHeight: 1.3 }}>
                    {CAT_DESC[cat]}
                  </p>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color, background: `${color}22`, padding: '2px 8px', borderRadius: '10px' }}>
                  {entries.length}
                </span>
              </div>

              {/* Exercise list */}
              {entries.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {entries.map((ex, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '7px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                      fontSize: '0.72rem', transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    >
                      {/* Reorder arrows */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', marginRight: '2px' }}>
                        <button onClick={() => moveExercise(cat, i, -1)} disabled={i === 0}
                          style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: i === 0 ? 'default' : 'pointer', fontSize: '0.55rem', padding: 0, lineHeight: 1, opacity: i === 0 ? 0.2 : 0.7 }}>▲</button>
                        <button onClick={() => moveExercise(cat, i, 1)} disabled={i === entries.length - 1}
                          style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: i === entries.length - 1 ? 'default' : 'pointer', fontSize: '0.55rem', padding: 0, lineHeight: 1, opacity: i === entries.length - 1 ? 0.2 : 0.7 }}>▼</button>
                      </div>

                      {/* Name + muscle */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ex.name}
                        </div>
                        {ex.target_muscle && (
                          <span style={{ fontSize: '0.58rem', color: '#ef4444', fontWeight: 600 }}>
                            {MUSCLE_LABELS[ex.target_muscle] || ex.target_muscle}
                          </span>
                        )}
                      </div>

                      {/* Sets × Reps */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                        <input type="number" value={ex.sets || 3}
                          onChange={e => updateEntry(cat, i, 'sets', Math.max(1, Number(e.target.value)))}
                          style={{ width: '32px', padding: '3px', fontSize: '0.65rem', textAlign: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--color-text)' }}
                          title="Series" />
                        <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>×</span>
                        <input type="number" value={ex.reps || 10}
                          onChange={e => updateEntry(cat, i, 'reps', Math.max(1, Number(e.target.value)))}
                          style={{ width: '32px', padding: '3px', fontSize: '0.65rem', textAlign: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--color-text)' }}
                          title="Reps" />
                        <button onClick={() => removeExercise(cat, i)}
                          style={{ marginLeft: '6px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem', padding: '0 2px', lineHeight: 1, opacity: 0.6 }}
                          onMouseEnter={e => e.currentTarget.style.opacity = 1}
                          onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
                        >✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '20px', border: '1px dashed var(--border-glass)', borderRadius: '8px',
                  opacity: 0.5,
                }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                    Sin ejercicios
                  </span>
                </div>
              )}

              {/* Add button */}
              <button
                onClick={() => {
                  if (!selectedPlayerId) { showToast('Selecciona un jugador primero.', 'warning'); return; }
                  setAddingTo(cat);
                }}
                className="btn-outline"
                style={{
                  padding: '8px', fontSize: '0.7rem', width: '100%', fontWeight: 600,
                  borderColor: color, color, marginTop: 'auto',
                }}>
                ➕ Añadir ejercicio{entries.length > 0 ? 's' : ''} a {CATEGORY_LABELS[cat] || cat}
              </button>
            </div>
          );
        })}
      </div>

      {/* Catalog modal (opens when clicking "Añadir" on a category) */}
      {addingTo && (
        <CatalogAdder
          exercises={exercises}
          category={addingTo}
          categoryLabel={CATEGORY_LABELS[addingTo] || addingTo}
          categoryColor={CAT_COLORS[addingTo] || 'var(--color-primary)'}
          alreadyAdded={plan[addingTo]?.map(e => e.code) || []}
          onAdd={(ex) => { addToCategory(addingTo, ex); }}
          onClose={() => setAddingTo(null)}
        />
      )}

      {/* Preview modal */}
      {previewEx && (
        <div className="modal-overlay" onClick={() => setPreviewEx(null)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}
            style={{ maxWidth: '480px', maxHeight: '85vh', overflowY: 'auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-primary)' }}>{previewEx.name_local}</h3>
              <button onClick={() => setPreviewEx(null)} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.7rem' }}>✕</button>
            </div>
            {previewEx.gif_url && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <img src={previewEx.gif_url} alt={previewEx.name_local} style={{ width: '150px', height: '150px', borderRadius: '10px', objectFit: 'cover', background: 'rgba(255,255,255,0.03)' }} />
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
              {previewEx.target_muscle && <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 600 }}>{MUSCLE_LABELS[previewEx.target_muscle] || previewEx.target_muscle}</span>}
              {previewEx.equipment && <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(234,179,8,0.1)', color: '#eab308', fontWeight: 600 }}>{EQUIP_LABELS[previewEx.equipment] || previewEx.equipment}</span>}
            </div>
            {previewEx.instructions && typeof previewEx.instructions === 'object' && (previewEx.instructions.es || previewEx.instructions.en) && (
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text)', lineHeight: '1.5', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                {previewEx.instructions.es || previewEx.instructions.en}
              </p>
            )}
            <button onClick={() => setPreviewEx(null)} className="btn-outline" style={{ marginTop: '12px', width: '100%', padding: '8px', fontSize: '0.75rem' }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── CatalogAdder sub-component (modal for adding exercises to a category) ── */
function CatalogAdder({ exercises, categoryLabel, categoryColor, alreadyAdded, onAdd, onClose }) {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [equipFilter, setEquipFilter] = useState('all');
  const [muscleFilter, setMuscleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [detailEx, setDetailEx] = useState(null);

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
      if (search.trim()) {
        const q = search.toLowerCase();
        return e.name_local.toLowerCase().includes(q) || e.name_technical.toLowerCase().includes(q) || (e.equipment || '').toLowerCase().includes(q) || (e.target_muscle || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [exercises, equipFilter, muscleFilter, search]);

  const perPage = 30;
  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const openDetail = async (ex) => {
    if (ex.instructions && ex.gif_url) { setDetailEx(ex); return; }
    try { const full = await getExerciseByCode(ex.code); setDetailEx(full || ex); } catch { setDetailEx(ex); }
  };

  const handleAdd = (ex) => {
    if (alreadyAdded.includes(ex.code)) return;
    onAdd(ex);
    showToast(`Agregado a ${categoryLabel}`, 'success');
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}
        style={{ maxWidth: '700px', width: '95vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '18px', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, fontFamily: 'Outfit', margin: 0 }}>
            Añadir ejercicios a <span style={{ color: categoryColor }}>{categoryLabel}</span>
          </h3>
          <button onClick={onClose} className="btn-outline" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>✕ Cerrar</button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Buscar ejercicio..."
            className="form-input" style={{ flex: 1, minWidth: '140px', fontSize: '0.73rem', padding: '6px 10px' }} />
          <select value={equipFilter} onChange={e => setEquipFilter(e.target.value)}
            className="form-select" style={{ fontSize: '0.68rem', padding: '4px 6px', minWidth: '100px' }}>
            <option value="all">🔧 Equipo</option>
            {equipmentOptions.filter(e => e !== 'all').map(eq => (
              <option key={eq} value={eq}>{EQUIP_LABELS[eq] || eq}</option>
            ))}
          </select>
          <select value={muscleFilter} onChange={e => setMuscleFilter(e.target.value)}
            className="form-select" style={{ fontSize: '0.68rem', padding: '4px 6px', minWidth: '110px' }}>
            <option value="all">💪 Músculo</option>
            {muscleOptions.filter(m => m !== 'all').map(m => (
              <option key={m} value={m}>{MUSCLE_LABELS[m] || m}</option>
            ))}
          </select>
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {pageItems.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '30px', fontSize: '0.78rem' }}>No se encontraron ejercicios.</p>
          ) : (
            <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '7px' }}>
              {pageItems.map(ex => {
                const added = alreadyAdded.includes(ex.code);
                return (
                  <div key={ex.code} className="glass-panel"
                    onClick={() => { if (!added) openDetail(ex); }}
                    style={{
                      padding: '10px', cursor: added ? 'default' : 'pointer',
                      border: `1px solid ${added ? 'rgba(255,255,255,0.03)' : 'transparent'}`,
                      opacity: added ? 0.4 : 1,
                      display: 'flex', flexDirection: 'column', gap: '6px',
                      transition: 'border-color 0.15s, transform 0.15s',
                    }}
                    onMouseEnter={e => { if (!added) { e.currentTarget.style.borderColor = categoryColor; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = added ? 'rgba(255,255,255,0.03)' : 'transparent'; e.currentTarget.style.transform = ''; }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.76rem', fontFamily: 'Outfit', lineHeight: 1.2, color: 'var(--color-text)' }}>
                      {ex.name_local}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: '0.6rem' }}>
                      {ex.target_muscle && <span style={{ color: '#ef4444', fontWeight: 600 }}>{MUSCLE_LABELS[ex.target_muscle] || ex.target_muscle}</span>}
                      {ex.equipment && <span style={{ color: 'var(--color-text-muted)' }}>· {EQUIP_LABELS[ex.equipment] || ex.equipment}</span>}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); if (!added) handleAdd(ex); }}
                      disabled={added}
                      style={{
                        padding: '5px', fontSize: '0.68rem', borderRadius: '5px', width: '100%',
                        background: added ? 'transparent' : categoryColor,
                        color: added ? 'var(--color-text-muted)' : '#000', border: 'none',
                        cursor: added ? 'default' : 'pointer', fontWeight: 700,
                        marginTop: '4px',
                      }}>
                      {added ? '✓ Agregado' : '+ Agregar'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: '8px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
              className="tab-btn" style={{ padding: '4px 10px', fontSize: '0.68rem', opacity: safePage <= 1 ? 0.3 : 1 }}>«</button>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text)', minWidth: '70px', textAlign: 'center' }}>
              {safePage} / {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
              className="tab-btn" style={{ padding: '4px 10px', fontSize: '0.68rem', opacity: safePage >= totalPages ? 0.3 : 1 }}>»</button>
          </div>
        )}

        {/* Detail modal (nested) */}
        {detailEx && (
          <div className="modal-overlay" onClick={() => setDetailEx(null)} style={{ zIndex: 1200 }}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}
              style={{ maxWidth: '460px', maxHeight: '80vh', overflowY: 'auto', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '0.88rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-primary)', margin: 0 }}>{detailEx.name_local}</h3>
                <button onClick={() => setDetailEx(null)} className="btn-outline" style={{ padding: '3px 8px', fontSize: '0.7rem' }}>✕</button>
              </div>
              {detailEx.gif_url && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                  <img src={detailEx.gif_url} alt={detailEx.name_local} style={{ width: '140px', height: '140px', borderRadius: '10px', objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '10px' }}>
                {detailEx.target_muscle && <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 600 }}>{MUSCLE_LABELS[detailEx.target_muscle] || detailEx.target_muscle}</span>}
                {detailEx.equipment && <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '8px', background: 'rgba(234,179,8,0.1)', color: '#eab308', fontWeight: 600 }}>{EQUIP_LABELS[detailEx.equipment] || detailEx.equipment}</span>}
              </div>
              {detailEx.instructions && typeof detailEx.instructions === 'object' && (detailEx.instructions.es || detailEx.instructions.en) && (
                <p style={{ fontSize: '0.68rem', color: 'var(--color-text)', lineHeight: '1.5', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', maxHeight: '100px', overflowY: 'auto' }}>
                  {detailEx.instructions.es || detailEx.instructions.en}
                </p>
              )}
              <div style={{ marginTop: '10px', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                {!alreadyAdded.includes(detailEx.code) ? (
                  <button onClick={() => { handleAdd(detailEx); setDetailEx(null); }}
                    className="btn-neon" style={{ padding: '6px 14px', fontSize: '0.72rem' }}>
                    ➕ Agregar
                  </button>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', padding: '6px 14px' }}>✓ Ya agregado</span>
                )}
                <button onClick={() => setDetailEx(null)} className="btn-outline" style={{ padding: '6px 14px', fontSize: '0.72rem' }}>Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
