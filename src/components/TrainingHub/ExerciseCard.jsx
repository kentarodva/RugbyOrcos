import React from 'react';

function ExerciseCard({ exercise, isDone, onToggle, borderColor, showCheckbox = true }) {
  return (
    <div className="glass-panel" style={{
      padding: '15px',
      borderLeft: `3px solid ${borderColor}`,
      opacity: isDone ? 0.6 : 1
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 800 }}>{exercise.name}</h4>
        {showCheckbox && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.7rem' }}>
            <input
              type="checkbox"
              checked={isDone || false}
              onChange={() => onToggle(exercise.id)}
              style={{ transform: 'scale(1.2)', accentColor: borderColor }}
            />
            {isDone ? '✅' : 'Completar'}
          </label>
        )}
      </div>

      {exercise.aiReason && (
        <p style={{ fontSize: '0.68rem', color: 'var(--color-gold)', marginBottom: '8px', fontStyle: 'italic' }}>
          💡 {exercise.aiReason}
        </p>
      )}

      {exercise.oneRMWeight && (
        <div style={{ background: 'var(--bg-dark)', padding: '6px 10px', borderRadius: '4px', marginBottom: '8px', fontSize: '0.72rem', color: 'var(--color-blue)', fontWeight: 700 }}>
          🎯 Carga: {exercise.oneRMWeight} kg ({exercise.loadPercentage})
        </div>
      )}

      <ul style={{ paddingLeft: '16px', fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {(exercise.drills || []).map((d, di) => <li key={di}>{d}</li>)}
      </ul>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
        <span>⏱️ {exercise.durationMin} min</span>
        <span>⭐ {'⭐'.repeat(exercise.difficulty || 1)}</span>
      </div>
    </div>
  );
}

export default ExerciseCard;
