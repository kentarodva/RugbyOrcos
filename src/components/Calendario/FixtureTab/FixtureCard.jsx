import React from 'react';
import { formatLocalDate } from '../../../utils/dates.js';

function FixtureCard({ fixture, onDelete, onDetail }) {
  const isWinner = fixture.orcosScore > fixture.opponentScore;
  const isDraw = fixture.orcosScore === fixture.opponentScore;

  return (
    <div
      className="glass-panel animated-slide"
      style={{
        padding: '20px',
        borderLeft: isWinner ? '4px solid var(--color-primary)' : isDraw ? '4px solid var(--color-gold)' : '4px solid var(--color-red)',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span className="badge" style={{
          background: isWinner ? 'rgba(0, 230, 118, 0.1)' : isDraw ? 'rgba(255, 234, 0, 0.1)' : 'rgba(255, 61, 0, 0.1)',
          color: isWinner ? 'var(--color-primary)' : isDraw ? 'var(--color-gold)' : 'var(--color-red)',
          border: `1px solid ${isWinner ? 'var(--color-primary)' : isDraw ? 'var(--color-gold)' : 'var(--color-red)'}`,
          fontSize: '0.65rem',
          fontWeight: 700
        }}>
          {isWinner ? 'VICTORIA' : isDraw ? 'EMPATE' : 'DERROTA'}
        </span>

        <button
          onClick={() => onDelete(fixture.id)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-red)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            opacity: 0.6
          }}
          title="Eliminar registro"
        >
          X
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '15px 0' }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)' }}>Orcos</h4>
          <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Outfit' }}>{fixture.orcosScore}</div>
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>VS</div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>{fixture.opponent}</h4>
          <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Outfit' }}>{fixture.opponentScore}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
        <div>
          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.65rem' }}>MVP DEL PARTIDO</span>
          <strong>{fixture.mvp || 'Sin definir'}</strong>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.65rem' }}>TRIES ANOTADOS</span>
          <strong>{fixture.tries || 0} Ensayos</strong>
        </div>
      </div>

      <button
        onClick={() => onDetail(fixture)}
        className="btn-outline"
        style={{
          width: '100%',
          marginTop: '12px',
          justifyContent: 'center',
          fontSize: '0.8rem',
          borderColor: 'var(--color-primary)',
          color: 'var(--color-primary)',
          padding: '8px 0',
          fontWeight: 800,
          borderRadius: 'var(--radius-sm)'
        }}
      >
        Detalle y Rendimiento →
      </button>

      <div style={{ marginTop: '10px', fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
        Contienda librada el {formatLocalDate(new Date(fixture.date + 'T00:00:00'), { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
    </div>
  );
}

export default FixtureCard;
