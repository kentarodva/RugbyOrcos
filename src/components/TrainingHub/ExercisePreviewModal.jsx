import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getExerciseByCode } from '../../services/trainingService';
import { muscleLabel } from '../workout/catalogFilters';

export default function ExercisePreviewModal({ exercise, onClose, onAddToRoutine }) {
  const [full, setFull] = useState(null);

  useEffect(() => {
    if (!exercise) return;
    if (exercise.instructions) { setFull(exercise); return; }
    getExerciseByCode(exercise.code).then(setFull).catch(() => {});
  }, [exercise?.code]);

  const ex = full || exercise;
  if (!exercise) return null;

  const instructions = ex.instructions || {};
  const instEs = typeof instructions === 'object' ? (instructions.es || instructions.en || '') : '';

  // Spanish labels, de-duplicated across primary and secondary lists.
  const muscles = [...new Set([ex.target_muscle, ex.muscle_group].filter(Boolean).map(muscleLabel))];
  const secondary = [...new Set((Array.isArray(ex.secondary_muscles) ? ex.secondary_muscles : []).map(muscleLabel))]
    .filter(m => !muscles.includes(m));

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <motion.div className="modal-content glass-panel" onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
        style={{ maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto', padding: '24px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-primary)' }}>
            {ex.name_local}
          </h3>
          <button onClick={onClose} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
        </div>

        {ex.gif_url && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <img src={ex.gif_url} alt={ex.name_local} style={{ width: '180px', height: '180px', borderRadius: '12px', objectFit: 'cover', background: 'rgba(255,255,255,0.03)' }} />
          </div>
        )}

        {ex.name_technical !== ex.name_local && (
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: '12px' }}>
            {ex.name_technical}
          </p>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
          <Badge label={ex.category} color="var(--color-primary)" />
          {ex.subcategory && <Badge label={ex.subcategory} color="var(--color-blue)" />}
          {ex.equipment && <Badge label={ex.equipment} color="var(--color-gold)" />}
          {ex.body_weight && <Badge label="Peso corporal" color="#22c55e" />}
          {ex.source === 'dataset' && <Badge label="Dataset" color="#a855f7" />}
        </div>

        {muscles.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              💪 Músculos trabajados
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {muscles.map((m, i) => (
                <span key={i} style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 600 }}>
                  {m}
                </span>
              ))}
              {secondary.map((m, i) => (
                <span key={'s' + i} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {instEs && (
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              📋 Instrucciones
            </h4>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text)', lineHeight: '1.6', background: 'var(--bg-dark)', padding: '12px', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {instEs}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {onAddToRoutine && (
            <button onClick={() => onAddToRoutine(exercise)} className="btn-neon" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              ➕ Agregar a rutina
            </button>
          )}
          <button onClick={onClose} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            Cerrar
          </button>
        </div>

        {ex.source === 'dataset' && (
          <p style={{ textAlign: 'center', fontSize: '0.6rem', color: 'var(--color-text-muted)', marginTop: '12px', opacity: 0.5 }}>
            © Gym visual — ejercicios del dataset
          </p>
        )}
      </motion.div>
    </div>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{
      fontSize: '0.65rem', padding: '2px 8px', borderRadius: '6px',
      background: `${color}15`, color, fontWeight: 600,
      textTransform: 'capitalize', border: `1px solid ${color}30`
    }}>
      {label}
    </span>
  );
}
