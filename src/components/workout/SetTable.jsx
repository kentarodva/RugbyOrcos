import { Check, Plus, Minus } from 'lucide-react';
import { SET_TYPES, nextSetType, ghostFor, isPR } from './setLogs';

const cell = {
  height: '44px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.06)', color: '#fff', textAlign: 'center',
  fontWeight: 800, fontSize: '0.95rem', width: '100%', minWidth: 0, padding: 0,
};
const GRID = '42px minmax(0,1fr) 64px 52px 44px';

/**
 * Hevy-style set table: SERIE · ANTERIOR · KG · REPS · ✓
 * Empty KG/REPS show last session's values as placeholders; ticking ✓ on an empty row adopts them.
 */
export default function SetTable({ sets, previous = [], onChange, onSetDone, suggestedWeight }) {
  const update = (i, patch) => onChange(sets.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  let effectiveNo = 0;
  return (
    <div role="table" aria-label="Series" style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      <div role="row" style={{ display: 'grid', gridTemplateColumns: GRID, gap: '6px', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.5px', color: 'var(--color-text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>
        <span role="columnheader">Serie</span><span role="columnheader">Anterior</span><span role="columnheader">Kg</span><span role="columnheader">Reps</span><span role="columnheader" aria-label="Hecha">✓</span>
      </div>

      {sets.map((s, i) => {
        const meta = SET_TYPES[s.type] || SET_TYPES.normal;
        const label = meta.short || String(++effectiveNo);
        const ghost = ghostFor(previous, sets, i);
        const pr = isPR(s, ghost);
        const weightHint = ghost ? String(ghost.weight) : (suggestedWeight ? String(suggestedWeight) : '0');
        const repsHint = ghost ? String(ghost.reps) : '0';

        const toggleDone = () => {
          if (s.done) { update(i, { done: false }); return; }
          const weight = s.weight !== '' ? s.weight : (ghost ? String(ghost.weight) : s.weight);
          const reps = s.reps !== '' ? s.reps : (ghost ? String(ghost.reps) : s.reps);
          update(i, { done: true, weight, reps });
          onSetDone?.(s.type);
        };

        return (
          <div role="row" key={i} style={{
            display: 'grid', gridTemplateColumns: GRID, gap: '6px', alignItems: 'center',
            padding: '2px 0', borderRadius: '10px', background: s.done ? 'rgba(46, 229, 122,0.08)' : 'transparent',
          }}>
            <button type="button" onClick={() => update(i, { type: nextSetType(s.type) })}
              aria-label={`Serie ${label}: ${meta.label}. Tocar para cambiar tipo`}
              style={{ ...cell, color: meta.color, borderColor: `${meta.color}55`, background: `${meta.color}14`, cursor: 'pointer' }}>
              {label}
            </button>
            <span role="cell" style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', textAlign: 'center', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {pr ? <span style={{ color: '#E8B931' }}>🔥 Récord</span> : ghost ? `${ghost.weight}×${ghost.reps}` : '—'}
            </span>
            <input type="text" inputMode="decimal" aria-label={`Kg serie ${label}`} value={s.weight} placeholder={weightHint}
              onFocus={e => e.target.select()}
              onChange={e => update(i, { weight: e.target.value.replace(',', '.').replace(/[^\d.]/g, '') })}
              style={{ ...cell, color: '#E8B931' }} />
            <input type="text" inputMode="numeric" aria-label={`Reps serie ${label}`} value={s.reps} placeholder={repsHint}
              onFocus={e => e.target.select()}
              onChange={e => update(i, { reps: e.target.value.replace(/\D/g, '').slice(0, 3) })}
              style={cell} />
            <button type="button" onClick={toggleDone} aria-pressed={s.done} aria-label={`Marcar serie ${label} como hecha`}
              style={{ ...cell, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: s.done ? '#2EE57A' : 'rgba(255,255,255,0.06)', color: s.done ? '#000' : 'var(--color-text-muted)', border: s.done ? 'none' : cell.border }}>
              <Check size={20} strokeWidth={3} />
            </button>
          </div>
        );
      })}

      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <button type="button" onClick={() => {
          const last = sets[sets.length - 1] || { weight: '', reps: '' };
          onChange([...sets, { type: 'normal', weight: last.weight, reps: last.reps, done: false }]);
        }} style={{ flex: 1, height: '44px', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.03)', color: '#e6edf5', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Plus size={16} /> Añadir serie
        </button>
        {sets.length > 1 && (
          <button type="button" aria-label="Quitar última serie" onClick={() => onChange(sets.slice(0, -1))}
            style={{ width: '44px', height: '44px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Minus size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
