import { useEffect, useState } from 'react';
import ExercisePreviewModal from '../TrainingHub/ExercisePreviewModal';
import { loadCatalogOnce, resolveCatalogExercise } from './exerciseLookup';

/**
 * "Ver técnica": opens the catalog preview (GIF, muscles, instructions in Spanish) when the
 * exercise exists in the catalog; otherwise shows the drill's key points as numbered steps.
 */
export default function TechniqueSheet({ exercise, onClose }) {
  const [state, setState] = useState({ loading: true, match: null });

  useEffect(() => {
    let alive = true;
    loadCatalogOnce()
      .then(catalog => { if (alive) setState({ loading: false, match: resolveCatalogExercise(exercise, catalog) }); })
      .catch(() => { if (alive) setState({ loading: false, match: null }); });
    return () => { alive = false; };
  }, [exercise]);

  if (!state.loading && state.match) {
    return <ExercisePreviewModal exercise={state.match} onClose={onClose} />;
  }

  const drills = exercise.drills || [];
  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div role="dialog" aria-modal="true" aria-label={`Técnica: ${exercise.name}`} className="modal-content glass-panel"
        onClick={e => e.stopPropagation()} style={{ maxWidth: '520px', maxHeight: '85vh', overflowY: 'auto', padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>{exercise.name}</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="btn-outline" style={{ minWidth: '44px', minHeight: '44px', justifyContent: 'center' }}>✕</button>
        </div>
        {state.loading ? (
          <p role="status" style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Buscando técnica…</p>
        ) : drills.length > 0 ? (
          <>
            <h4 style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--color-text-muted)', margin: '0 0 10px' }}>Ejecución paso a paso</h4>
            <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {drills.map((d, i) => (
                <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '0.88rem', lineHeight: 1.5, color: '#e6edf5' }}>
                  <span aria-hidden="true" style={{ flexShrink: 0, width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(46, 229, 122,0.15)', border: '1px solid rgba(46, 229, 122,0.4)', color: '#2EE57A', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>{i + 1}</span>
                  <span>{d}</span>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Este ejercicio aún no tiene video ni pasos de técnica. Pide al staff que lo vincule al catálogo.</p>
        )}
      </div>
    </div>
  );
}
