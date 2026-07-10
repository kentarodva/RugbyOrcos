import React from 'react';
import { FixtureMatch } from './FixtureMatch';

const ROUND_NAMES = {
  1: 'Jornada 1',
  2: 'Jornada 2',
  3: 'Jornada 3',
  4: 'Jornada 4',
  5: 'Jornada 5',
  6: 'Jornada 6',
  7: 'Jornada 7',
  8: 'Jornada 8',
  9: 'Jornada 9',
  10: 'Jornada 10',
};

export function FixtureList({ matches, activeTournament, onGenerate, onUpdateMatch, onStats, onEdit }) {
  const regularMatches = matches.filter(m => m.phase !== 'playoff');
  const hasMatches = regularMatches.length > 0;

  if (!hasMatches) {
    return (
      <div className="glass-panel" style={{
        padding: '40px 20px',
        borderRadius: 'var(--radius-md)',
        textAlign: 'center',
      }}>
        <div style={{
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'rgba(255,179,0,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px auto',
          border: '1px dashed rgba(255,179,0,0.3)',
        }}>
          <span style={{ fontSize: '1.5rem', color: 'var(--color-gold)' }}>🏟</span>
        </div>
        <h3 style={{
          color: 'var(--color-text)',
          fontSize: '1rem',
          fontWeight: 700,
          fontFamily: 'Outfit',
          marginBottom: '6px',
        }}>
          No hay fixture generado
        </h3>
        <p style={{
          color: 'var(--color-text-muted)',
          fontSize: '0.8rem',
          marginBottom: '20px',
          maxWidth: '360px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          Genera el fixture para definir los emparejamientos de la fase regular del torneo.
        </p>
        <button onClick={onGenerate}
          style={{
            padding: '12px 28px',
            background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))',
            color: '#05070a',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '0.85rem',
            fontFamily: 'Outfit',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            boxShadow: '0 4px 15px rgba(0, 230, 118, 0.3)',
            transition: 'var(--transition-smooth)',
          }}>
          ⚔ Generar Fixture
        </button>
      </div>
    );
  }

  const rounds = regularMatches.reduce((acc, m) => {
    if (!acc[m.round]) acc[m.round] = [];
    acc[m.round].push(m);
    return acc;
  }, {});

  const roundKeys = Object.keys(rounds).sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <div>
      <div className="glass-panel" style={{
        padding: '16px 20px',
        borderRadius: 'var(--radius-md)',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
        borderLeft: '3px solid var(--color-gold)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-gold-dark, #b8860b), var(--color-gold))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem',
          }}>
            ⚔
          </div>
          <div>
            <h3 style={{
              color: 'var(--color-gold)',
              fontSize: '0.95rem',
              fontWeight: 800,
              fontFamily: 'Outfit',
              margin: 0,
            }}>
              Fixture
            </h3>
            <p style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.7rem',
              margin: '2px 0 0 0',
            }}>
              {regularMatches.length} partidos · {roundKeys.length} rondas
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onGenerate} style={{
            padding: '6px 14px',
            background: 'rgba(0, 230, 118, 0.1)',
            border: '1px solid rgba(0, 230, 118, 0.25)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-primary)',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.7rem',
            fontFamily: 'Outfit',
            transition: 'var(--transition-smooth)',
          }}>
            + Generar
          </button>
          {onEdit && (
            <button onClick={onEdit} style={{
              padding: '6px 14px',
              background: 'transparent',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.7rem',
              fontFamily: 'Outfit',
              transition: 'var(--transition-smooth)',
            }}>
              ✎ Editar
            </button>
          )}
        </div>
      </div>

      {roundKeys.map((round) => {
        const rMatches = rounds[round];
        const jugados = rMatches.filter(m => m.status === 'jugado').length;

        return (
          <div key={round} className="fixture-round">
            <div className="fixture-round-title-row">
              <div className="fixture-round-line" />
              <span className="fixture-round-label">
                {ROUND_NAMES[parseInt(round)] || `Ronda ${round}`}
              </span>
              <span className="fixture-round-count">
                {jugados}/{rMatches.length}
              </span>
              <span className="fixture-round-label-sub" style={{ fontSize: '0.55rem', fontWeight: 600, color: 'var(--color-text-muted)', fontFamily: 'Outfit' }}>
                {jugados === rMatches.length ? 'Completa' : (rMatches.length - jugados) + ' pendiente' + (rMatches.length - jugados !== 1 ? 's' : '')}
              </span>
              <div className="fixture-round-line" />
            </div>

            <div className="fixture-round-grid">
              {rMatches.map(m => (
                <FixtureMatch key={m.id} match={m} onUpdate={onUpdateMatch} onStats={onStats} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
