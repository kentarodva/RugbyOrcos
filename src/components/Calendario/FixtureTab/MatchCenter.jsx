import React, { useState } from 'react';
import GuestRoster from '../GuestRoster';
import { formatLocalDate } from '../../../utils/dates.js';

function PlayerStatsForm({ activeTeamPlayers, fixture, onSave, onClose }) {
  const [form, setForm] = useState({
    playerId: '', tries: 0, conversions: 0, tackles: 0,
    turnovers: 0, yellow: 0, red: 0, mvp: false
  });

  const set = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : Number(e.target.value);
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.playerId) return;

    onSave({
      playerId: form.playerId,
      date: fixture.date,
      opponent: fixture.opponent,
      tries: form.tries,
      conversions: form.conversions,
      tackles: form.tackles,
      turnovers: form.turnovers,
      yellowCards: form.yellow,
      redCards: form.red,
      mvp: form.mvp
    });

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel animated-slide" style={{ padding: '20px', marginBottom: '20px', border: '1px dashed var(--color-primary)' }}>
      <h5 style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 800, marginBottom: '15px' }}>
        CARGAR RENDIMIENTO INDIVIDUAL
      </h5>

      <div className="form-group" style={{ marginBottom: '12px' }}>
        <label>Seleccionar Jugador</label>
        <select
          value={form.playerId}
          onChange={set('playerId')}
          className="form-select"
          required
        >
          <option value="">-- Elige un Guerrero --</option>
          {activeTeamPlayers.map(p => (
            <option key={p.id} value={p.id}>
              #{p.camiseta ?? '—'} {p.name} "{p.apodo || ''}" ({p.posicion || '—'})
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
        <div className="form-group">
          <label style={{ fontSize: '0.65rem' }}>Tries</label>
          <input type="number" min="0" value={form.tries} onChange={set('tries')} className="form-input" />
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.65rem' }}>Conv.</label>
          <input type="number" min="0" value={form.conversions} onChange={set('conversions')} className="form-input" />
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.65rem' }}>Placajes</label>
          <input type="number" min="0" value={form.tackles} onChange={set('tackles')} className="form-input" />
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.65rem' }}>Recup.</label>
          <input type="number" min="0" value={form.turnovers} onChange={set('turnovers')} className="form-input" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label style={{ fontSize: '0.65rem', color: 'var(--color-gold)' }}>Amarillas</label>
            <input type="number" min="0" max="2" value={form.yellow} onChange={set('yellow')} className="form-input" />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label style={{ fontSize: '0.65rem', color: 'var(--color-red)' }}>Rojas</label>
            <input type="number" min="0" max="1" value={form.red} onChange={set('red')} className="form-input" />
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', cursor: 'pointer', height: '100%', paddingTop: '15px' }}>
          <input
            type="checkbox"
            checked={form.mvp}
            onChange={set('mvp')}
            style={{ transform: 'scale(1.2)' }}
          />
          <span style={{ color: 'var(--color-gold)', fontWeight: 700 }}>MVP del Partido?</span>
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button type="button" onClick={onClose} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
          Cancelar
        </button>
        <button type="submit" className="btn-neon" style={{ padding: '6px 14px', fontSize: '0.75rem' }}>
          Guardar Rendimiento
        </button>
      </div>
    </form>
  );
}

function MatchCenter({ fixture, activeTeamPlayers, onClose, onSaveStats, getMatchStats }) {
  const [showStatsForm, setShowStatsForm] = useState(false);
  const loggedStats = getMatchStats(fixture);

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content glass-panel animated-slide" style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '15px', marginBottom: '20px' }}>
          <div>
            <span className="badge badge-gold" style={{ marginBottom: '8px' }}>
              CAMPAÑA Y MATCH CENTER
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Outfit' }}>
              Ficha de Partido: Orcos vs {fixture.opponent}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {formatLocalDate(new Date(fixture.date + 'T00:00:00'), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-outline"
            style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--color-red)', borderColor: 'rgba(255,61,0,0.1)' }}
          >
            Cerrar →
          </button>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-primary)' }}>Orcos</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, textShadow: '0 0 10px rgba(0, 230, 118, 0.4)', fontFamily: 'Outfit' }}>
              {fixture.orcosScore}
            </div>
          </div>

          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>VS</div>

          <div style={{ textAlign: 'center', flex: 1 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-text-muted)' }}>
              {fixture.opponent}
            </h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Outfit' }}>
              {fixture.opponentScore}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px', fontSize: '0.8rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.65rem' }}>MVP DEL PARTIDO</span>
            <strong style={{ fontSize: '1rem', color: 'var(--color-gold)' }}>
              {fixture.mvp || 'Sin asignar'}
            </strong>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px', borderRadius: 'var(--radius-sm)', textAlign: 'right' }}>
            <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.65rem' }}>ENSAYOS DEL CLAN</span>
            <strong style={{ fontSize: '1rem', color: 'var(--color-primary)' }}>
              {fixture.tries || 0} Tries Anotados
            </strong>
          </div>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              Rendimiento de Guerreros en Cancha
            </h4>
            <button
              onClick={() => setShowStatsForm(!showStatsForm)}
              className="btn-neon"
              style={{ padding: '6px 12px', fontSize: '0.75rem', background: showStatsForm ? 'transparent' : 'var(--color-primary)', color: showStatsForm ? '#fff' : '#000', borderColor: showStatsForm ? 'var(--border-glass)' : 'transparent' }}
            >
              {showStatsForm ? 'Cancelar Registro' : '+ Registrar Jugador'}
            </button>
          </div>

          {showStatsForm && (
            <PlayerStatsForm
              activeTeamPlayers={activeTeamPlayers}
              fixture={fixture}
              onSave={onSaveStats}
              onClose={() => setShowStatsForm(false)}
            />
          )}

          {loggedStats.length === 0 ? (
            <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              Aun no hay rendimiento de jugadores registrado para este partido. Comienza haciendo clic en + Registrar Jugador!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(5, 1fr)', gap: '5px', padding: '10px', fontSize: '0.7rem', color: 'var(--color-text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 800 }}>
                <div>GUERRERO</div>
                <div style={{ textAlign: 'center' }}>TRIES</div>
                <div style={{ textAlign: 'center' }}>CONV.</div>
                <div style={{ textAlign: 'center' }}>TACKLES</div>
                <div style={{ textAlign: 'center' }}>RECUP.</div>
                <div style={{ textAlign: 'center' }}>TARJETAS</div>
              </div>

              {loggedStats.map(({ player, stats: st }) => (
                <div
                  key={st.id}
                  className="glass-panel"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr repeat(5, 1fr)',
                    gap: '5px',
                    padding: '12px 10px',
                    fontSize: '0.75rem',
                    alignItems: 'center',
                    borderLeft: st.mvp ? '3px solid var(--color-gold)' : '1px solid var(--border-glass)'
                  }}
                >
                  <div style={{ fontWeight: st.mvp ? 800 : 600 }}>
                    #{player.camiseta ?? '—'} {player.name} {st.mvp && <span style={{ color: 'var(--color-gold)' }} title="MVP del Partido">⭐</span>}
                  </div>
                  <div style={{ textAlign: 'center', fontWeight: st.tries > 0 ? 800 : 400, color: st.tries > 0 ? 'var(--color-primary)' : 'inherit' }}>
                    {st.tries}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    {st.conversions}
                  </div>
                  <div style={{ textAlign: 'center', fontWeight: st.tackles >= 10 ? 800 : 400, color: st.tackles >= 10 ? 'var(--color-gold)' : 'inherit' }}>
                    {st.tackles}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    {st.turnovers}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    {st.yellowCards > 0 && <span className="badge" style={{ background: 'rgba(255, 234, 0, 0.1)', color: 'var(--color-gold)', border: '1px solid var(--color-gold)', padding: '2px 4px', fontSize: '0.6rem', marginRight: '2px' }}>{st.yellowCards}</span>}
                    {st.redCards > 0 && <span className="badge" style={{ background: 'rgba(255, 61, 0, 0.1)', color: 'var(--color-red)', border: '1px solid var(--color-red)', padding: '2px 4px', fontSize: '0.6rem' }}>{st.redCards}</span>}
                    {st.yellowCards === 0 && st.redCards === 0 && <span style={{ color: 'var(--color-text-muted)' }}>-</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <GuestRoster fixture={fixture} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '15px' }}>
          <button
            onClick={onClose}
            className="btn-neon"
          >
            Cerrar Match Center
          </button>
        </div>
      </div>
    </div>
  );
}

export default MatchCenter;
