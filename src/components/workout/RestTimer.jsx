import { useEffect, useRef, useState } from 'react';
import { Timer, Plus, Minus, SkipForward } from 'lucide-react';
import { vibrateWhistle } from '../../utils/haptics';
import { playRugbyWhistle } from '../../utils/rugbyAudio';

export const REST_PRESETS = [60, 90, 120, 180];

export function formatRest(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Steps a weight string by delta kg; empty field starts from the suggested load. */
export function stepWeight(value, delta, fallback = 0) {
  const base = value === '' || value == null ? Number(fallback) || 0 : Number(value) || 0;
  return String(Math.max(0, Math.round((base + delta) * 10) / 10));
}

const ctrlBtn = {
  minWidth: '44px', height: '44px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', display: 'inline-flex',
  alignItems: 'center', justifyContent: 'center', gap: '4px', fontWeight: 800, fontSize: '0.75rem',
};

/**
 * Floating rest timer. Driven by an absolute `endsAt` timestamp so it stays
 * accurate when the phone locks or the tab is backgrounded.
 */
function RestTimer({ endsAt, total, label, onAdjust, onSkip, onFinish }) {
  const [now, setNow] = useState(() => Date.now());
  const finishedRef = useRef(false);
  const remaining = Math.max(0, (endsAt - now) / 1000);

  useEffect(() => {
    finishedRef.current = false;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [endsAt]);

  useEffect(() => {
    if (remaining > 0 || finishedRef.current) return;
    finishedRef.current = true;
    vibrateWhistle();
    playRugbyWhistle('kickoff');
    onFinish?.();
  }, [remaining, onFinish]);

  const pct = total > 0 ? Math.min(100, (remaining / total) * 100) : 0;

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed', left: '50%', transform: 'translateX(-50%)', zIndex: 900,
        bottom: 'calc(84px + env(safe-area-inset-bottom, 0px))',
        width: 'min(440px, calc(100% - 24px))', padding: '12px 14px', borderRadius: '18px',
        background: 'rgba(10,15,24,0.96)', border: '1.5px solid rgba(0,230,118,0.45)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.6), 0 0 24px rgba(0,230,118,0.18)', backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Timer size={22} color="#00e676" aria-hidden="true" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--color-text-muted)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Descanso · {label}
          </div>
          <div role="timer" style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 900, color: remaining <= 10 ? '#ffd700' : '#fff', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
            {formatRest(remaining)}
          </div>
        </div>
        <button type="button" aria-label="Restar 15 segundos" onClick={() => onAdjust(-15)} style={ctrlBtn}><Minus size={14} />15</button>
        <button type="button" aria-label="Sumar 15 segundos" onClick={() => onAdjust(15)} style={ctrlBtn}><Plus size={14} />15</button>
        <button type="button" aria-label="Saltar descanso" onClick={onSkip} style={{ ...ctrlBtn, background: '#00e676', color: '#000', border: 'none' }}>
          <SkipForward size={18} />
        </button>
      </div>
      <div style={{ height: '4px', marginTop: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: remaining <= 10 ? '#ffd700' : '#00e676', transition: 'width 0.25s linear' }} />
      </div>
    </div>
  );
}

export default RestTimer;
