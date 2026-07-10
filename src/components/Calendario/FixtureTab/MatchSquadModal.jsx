import { useState, useMemo } from 'react';

function MatchSquadModal({ fixture, players, onSave, onClose, showToast }) {
  const squad = fixture.squad || { startingXV: [], substitutes: [] };
  const [startingXV, setStartingXV] = useState(squad.startingXV || []);
  const [substitutes, setSubstitutes] = useState(squad.substitutes || []);
  const [searchTerm, setSearchTerm] = useState('');

  const availablePlayers = useMemo(() => {
    const selected = new Set([...startingXV, ...substitutes]);
    return players.filter(p => {
      if (!p.estado || p.estado === 'inactivo') return false;
      if (searchTerm && !p.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    }).sort((a, b) => {
      const aSel = selected.has(a.id) ? 1 : 0;
      const bSel = selected.has(b.id) ? 1 : 0;
      if (aSel !== bSel) return aSel ? -1 : 1;
      const posA = a.position || '';
      const posB = b.position || '';
      const order = ['Pilar', 'Hooker', 'Segunda', 'Ala', 'N8', 'Medio', 'Apertura', 'Centro', 'Wing', 'Fullback'];
      const idxA = order.findIndex(p => posA.includes(p));
      const idxB = order.findIndex(p => posB.includes(p));
      return (idxA >= 0 ? idxA : 99) - (idxB >= 0 ? idxB : 99);
    });
  }, [players, startingXV, substitutes, searchTerm]);

  const toggleStarting = (playerId) => {
    if (startingXV.includes(playerId)) {
      setStartingXV(prev => prev.filter(id => id !== playerId));
    } else if (startingXV.length < 15) {
      setStartingXV(prev => [...prev, playerId]);
      setSubstitutes(prev => prev.filter(id => id !== playerId));
    } else {
      showToast?.('Maximo 15 titulares.', 'warning');
    }
  };

  const toggleSubstitute = (playerId) => {
    if (substitutes.includes(playerId)) {
      setSubstitutes(prev => prev.filter(id => id !== playerId));
    } else if (substitutes.length < 8) {
      setSubstitutes(prev => [...prev, playerId]);
      setStartingXV(prev => prev.filter(id => id !== playerId));
    } else {
      showToast?.('Maximo 8 suplentes.', 'warning');
    }
  };

  const removeFromSquad = (playerId) => {
    setStartingXV(prev => prev.filter(id => id !== playerId));
    setSubstitutes(prev => prev.filter(id => id !== playerId));
  };

  const getPlayerName = (id) => players.find(p => p.id === id)?.name || id;

  const Scroller = ({ children, height = '280px' }) => (
    <div style={{ overflowY: 'auto', maxHeight: height, display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '4px' }}>
      {children}
    </div>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)'
    }}>
      <div className="glass-panel" style={{
        width: '90%', maxWidth: '700px', maxHeight: '90vh',
        padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-primary)' }}>
            XV Titular vs {fixture.opponent}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-red)', cursor: 'pointer', fontSize: '1.2rem' }}>X</button>
        </div>

        <input
          type="text" placeholder="Buscar jugador..."
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="form-input" style={{ fontSize: '0.8rem' }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', flex: 1, minHeight: 0 }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px', textAlign: 'center' }}>
              XV Titular ({startingXV.length}/15)
            </div>
            <Scroller height="320px">
              {startingXV.map(id => (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'rgba(0,230,118,0.06)', borderRadius: '6px', border: '1px solid rgba(0,230,118,0.15)', fontSize: '0.75rem' }}>
                  <span style={{ fontWeight: 600 }}>{getPlayerName(id)}</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => toggleSubstitute(id)} style={{ background: 'rgba(255,234,0,0.1)', border: '1px solid rgba(255,234,0,0.2)', color: 'var(--color-gold)', borderRadius: '4px', padding: '2px 5px', cursor: 'pointer', fontSize: '0.6rem', fontWeight: 700 }}>Supl</button>
                    <button onClick={() => removeFromSquad(id)} style={{ background: 'rgba(255,61,0,0.1)', border: '1px solid rgba(255,61,0,0.2)', color: 'var(--color-red)', borderRadius: '4px', padding: '2px 5px', cursor: 'pointer', fontSize: '0.6rem', fontWeight: 700 }}>X</button>
                  </div>
                </div>
              ))}
              {startingXV.length === 0 && <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>Selecciona jugadores abajo</p>}
            </Scroller>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-gold)', marginBottom: '8px', textAlign: 'center' }}>
              Suplentes ({substitutes.length}/8)
            </div>
            <Scroller height="320px">
              {substitutes.map(id => (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'rgba(255,234,0,0.06)', borderRadius: '6px', border: '1px solid rgba(255,234,0,0.15)', fontSize: '0.75rem' }}>
                  <span style={{ fontWeight: 600 }}>{getPlayerName(id)}</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => toggleStarting(id)} style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)', color: 'var(--color-primary)', borderRadius: '4px', padding: '2px 5px', cursor: 'pointer', fontSize: '0.6rem', fontWeight: 700 }}>Tit</button>
                    <button onClick={() => removeFromSquad(id)} style={{ background: 'rgba(255,61,0,0.1)', border: '1px solid rgba(255,61,0,0.2)', color: 'var(--color-red)', borderRadius: '4px', padding: '2px 5px', cursor: 'pointer', fontSize: '0.6rem', fontWeight: 700 }}>X</button>
                  </div>
                </div>
              ))}
              {substitutes.length === 0 && <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>Sin suplentes</p>}
            </Scroller>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '180px', overflowY: 'auto', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
          {availablePlayers.map(p => {
            const inStarting = startingXV.includes(p.id);
            const inSubs = substitutes.includes(p.id);
            return (
              <div key={p.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '5px 8px', borderRadius: '4px', fontSize: '0.75rem',
                background: inStarting ? 'rgba(0,230,118,0.08)' : inSubs ? 'rgba(255,234,0,0.08)' : 'transparent',
                border: `1px solid ${inStarting ? 'rgba(0,230,118,0.2)' : inSubs ? 'rgba(255,234,0,0.2)' : 'transparent'}`
              }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  {p.position && <span style={{ color: 'var(--color-text-muted)', marginLeft: '6px', fontSize: '0.65rem' }}>({p.position})</span>}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => toggleStarting(p.id)} style={{
                    padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 700, cursor: 'pointer',
                    background: inStarting ? 'rgba(0,230,118,0.2)' : 'transparent',
                    border: `1px solid ${inStarting ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)'}`,
                    color: inStarting ? 'var(--color-primary)' : 'var(--color-text-muted)'
                  }}>Titular</button>
                  <button onClick={() => toggleSubstitute(p.id)} style={{
                    padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 700, cursor: 'pointer',
                    background: inSubs ? 'rgba(255,234,0,0.2)' : 'transparent',
                    border: `1px solid ${inSubs ? 'var(--color-gold)' : 'rgba(255,255,255,0.1)'}`,
                    color: inSubs ? 'var(--color-gold)' : 'var(--color-text-muted)'
                  }}>Suplente</button>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-outline" style={{ padding: '8px 20px', fontSize: '0.8rem' }}>
            Cancelar
          </button>
          <button onClick={() => {
            if (startingXV.length < 15) {
              showToast?.('Selecciona 15 titulares antes de guardar.', 'warning');
              return;
            }
            onSave(fixture.id, { startingXV, substitutes });
          }} className="btn-neon" style={{ padding: '8px 20px', fontSize: '0.8rem' }}>
            Guardar Squad ({startingXV.length + substitutes.length}/23)
          </button>
        </div>
      </div>
    </div>
  );
}

export default MatchSquadModal;
