import React, { useState, useEffect, useRef } from 'react';

function getHalf(elapsedSeconds) {
  if (elapsedSeconds >= 80 * 60) return { label: 'FT', color: 'var(--color-red)' };
  if (elapsedSeconds >= 40 * 60) return { label: '2T', color: 'var(--color-primary)' };
  return { label: '1T', color: 'var(--color-gold)' };
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function MatchTimer({ liveMatch, status }) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      if (!liveMatch) return;
      const acc = liveMatch.elapsed_seconds || 0;
      if (status === 'paused' || status === 'finished') {
        setElapsed(acc);
        return;
      }
      const start = new Date(liveMatch.started_at).getTime();
      const delta = Math.max(0, Math.floor((Date.now() - start) / 1000));
      setElapsed(acc + delta);
    };

    tick();
    if (status === 'live') {
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [liveMatch, status]);

  const half = getHalf(elapsed);

  return (
    <div style={{ textAlign: 'center', padding: '10px 0' }}>
      <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-display)', letterSpacing: '2px' }}>
        {formatTime(elapsed)}
      </div>
      <div style={{
        fontSize: '0.8rem', fontWeight: 700, color: half.color,
        background: half.color + '15', display: 'inline-block',
        padding: '2px 12px', borderRadius: '20px', marginTop: '4px'
      }}>
        {half.label}
      </div>
    </div>
  );
}

export default MatchTimer;
