import React, { useState, useEffect, useRef, useCallback } from 'react';

function SinBinConsole({ teamPlayers, showToast }) {
  const [sinBinLads, setSinBinLads] = useState([]);
  const [selectedPlayerForSinBin, setSelectedPlayerForSinBin] = useState('');
  const [demoMode, setDemoMode] = useState(false);
  const audioCtxRef = useRef(null);

  const playBeep = useCallback(async () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();
      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtxRef.current.currentTime);
      gain.gain.setValueAtTime(0.05, audioCtxRef.current.currentTime);
      osc.start();
      osc.stop(audioCtxRef.current.currentTime + 0.35);
    } catch (e) {
      // AudioContext silenciado preventivamente por el navegador
    }
  }, []);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (sinBinLads.length === 0) return;
    const interval = setInterval(() => {
      setSinBinLads(prev => prev.map(lad => {
        if (lad.timeRemaining <= 1) {
          if (lad.timeRemaining === 1) {
            playBeep();
          }
          return { ...lad, timeRemaining: 0, finished: true };
        }
        return { ...lad, timeRemaining: lad.timeRemaining - 1 };
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [sinBinLads.length, playBeep]);

  const handleSendToSinBin = () => {
    if (!selectedPlayerForSinBin) return;
    const playerObj = teamPlayers.find(p => p.id === selectedPlayerForSinBin);
    if (!playerObj) return;

    if (sinBinLads.some(l => l.id === playerObj.id)) {
      showToast('Este jugador ya se encuentra pagando sancion en el Sin-Bin.', 'warning');
      return;
    }

    const duration = demoMode ? 10 : 600;
    setSinBinLads(prev => [...prev, {
      id: playerObj.id,
      name: playerObj.name,
      apodo: playerObj.apodo,
      camiseta: playerObj.camiseta,
      timeRemaining: duration,
      duration: duration,
      finished: false
    }]);
    setSelectedPlayerForSinBin('');
  };

  const handleReleasePlayer = (id) => {
    setSinBinLads(prev => prev.filter(l => l.id !== id));
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px', borderLeft: '4px solid var(--color-yellow)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-yellow)' }}>
            Consola de Sin-Bin en Vivo (Sanciones del Staff)
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Expulsa temporalmente a un jugador (10 minutos de castigo) y sigue el conteo regresivo de reingreso en tiempo real.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '5px 10px', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
          <input
            type="checkbox"
            id="demoMode"
            checked={demoMode}
            onChange={(e) => setDemoMode(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor="demoMode" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer' }}>
            Modo Demo (10 segundos)
          </label>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label>Seleccionar Infractor</label>
            <select
              value={selectedPlayerForSinBin}
              onChange={(e) => setSelectedPlayerForSinBin(e.target.value)}
              className="form-select"
            >
              <option value="">-- Seleccionar Guerrero --</option>
              {teamPlayers.filter(p => p.rol !== 'Entrenador').map(p => (
                <option key={p.id} value={p.id}>#{p.camiseta ?? '—'} {p.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSendToSinBin}
            className="btn-neon"
            style={{
              background: 'linear-gradient(135deg, var(--color-yellow), #fdd835)',
              color: '#000',
              fontWeight: 800,
              justifyContent: 'center'
            }}
            disabled={!selectedPlayerForSinBin}
          >
            Mandar al Sin-Bin (Expulsion)
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '5px' }}>
            Relojes en Vivo ({sinBinLads.length} Activos)
          </h4>

          {sinBinLads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '15px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              Ningun orco en el Sin-Bin. Disciplina intachable en cancha!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '160px', overflowY: 'auto' }}>
              {sinBinLads.map(l => {
                const pct = Math.round((l.timeRemaining / l.duration) * 100);
                return (
                  <div
                    key={l.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: l.finished ? 'rgba(0, 230, 118, 0.05)' : 'rgba(255, 234, 0, 0.03)',
                      border: '1px solid ' + (l.finished ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 234, 0, 0.2)'),
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)'
                    }}
                    className={l.finished ? 'animated-pulse' : ''}
                  >
                    <div>
                      <strong style={{ fontSize: '0.8rem' }}>{l.name}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-yellow)', marginLeft: '5px' }}>#{l.camiseta ?? '—'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {l.finished ? (
                        <>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 800 }}>REINGRESO!</span>
                          <button
                            onClick={() => handleReleasePlayer(l.id)}
                            className="btn-neon"
                            style={{ padding: '3px 8px', fontSize: '0.65rem' }}
                          >
                            Habilitar
                          </button>
                        </>
                      ) : (
                        <>
                          <span style={{ fontSize: '0.9rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--color-yellow)' }}>
                            {formatTime(l.timeRemaining)}
                          </span>
                          <div style={{ width: '40px', height: '6px', background: 'var(--bg-dark)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-yellow)' }}></div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SinBinConsole;
