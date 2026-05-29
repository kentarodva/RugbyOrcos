import React, { useState, useContext } from 'react';
import { ClubContext, getRpgRole } from '../context/ClubContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

function PlayerDashboard() {
  const { players, recordWellness } = useContext(ClubContext);
  const { profile, user } = useAuth();
  const { showToast } = useToast();

  const [wellness, setWellness] = useState({ sleep: 3, soreness: 3, stress: 3 });

  const player = players.find(p => {
    if (profile?.display_name && p.name.toLowerCase() === profile.display_name.toLowerCase()) return true;
    if (user?.email && p.contacto?.email === user.email) return true;
    return false;
  });

  if (!player) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-gold)' }}>Guerrero no encontrado</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>Contacta a tu Comandante de Horda para vincular tu cuenta.</p>
      </div>
    );
  }

  const attrs = player.attributes || { force: 50, speed: 50, stamina: 50, technique: 50 };
  const rpgRole = getRpgRole(player.systemRole || 'jugador');

  const badges = [];
  if (player.attendance && player.attendance.total >= 5 && (player.attendance.present / player.attendance.total) >= 0.9)
    badges.push({ name: 'Orco de Hierro', icon: '🛡️', desc: 'Asistencia perfecta' });
  const totalTackles = (player.matchStats || []).reduce((s, m) => s + (m.tackles || 0), 0);
  if (totalTackles >= 12) badges.push({ name: 'Muralla Verde', icon: '🧱', desc: `${totalTackles} tackles` });
  const totalTries = (player.matchStats || []).reduce((s, m) => s + (m.tries || 0), 0);
  if (totalTries >= 3) badges.push({ name: 'Demoledor', icon: '💥', desc: `${totalTries} tries` });
  const totalMvp = (player.matchStats || []).filter(m => m.mvp).length;
  if (totalMvp >= 1) badges.push({ name: 'Gladiador MVP', icon: '🏆', desc: `${totalMvp} MVP` });

  const attrColors = { force: '#ff3d00', speed: '#00b0ff', stamina: '#00e676', technique: '#9c27b0' };

  const handleWellnessSubmit = () => {
    recordWellness(player.id, { date: new Date().toISOString().split('T')[0], ...wellness });
    showToast('Wellness registrado, Guerrero.', 'success');
  };

  const lastWellness = (player.wellnessLogs || []).slice(-1)[0];

  return (
    <div style={{ padding: '15px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '25px', borderRadius: 'var(--radius-lg)', marginBottom: '20px', textAlign: 'center' }}>
        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>{rpgRole.icon}</span>
        <h2 style={{ color: 'var(--color-primary)', fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit' }}>
          {player.name}
        </h2>
        <p style={{ color: rpgRole.color, fontWeight: 700, fontSize: '0.9rem' }}>
          {rpgRole.rpg} · #{player.camiseta || '—'} · {player.posicion || '—'}
        </p>
        {player.apodo && <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>"{player.apodo}"</p>}
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '10px' }}>
          {player.teamCategory || ''}
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--color-gold)', fontSize: '1rem', fontWeight: 700, marginBottom: '15px', fontFamily: 'Outfit' }}>
          Atributos de Batalla
        </h3>
        {Object.entries(attrs).map(([key, val]) => (
          <div key={key} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{key === 'force' ? 'Fuerza' : key === 'speed' ? 'Velocidad' : key === 'stamina' ? 'Resistencia' : 'Técnica'}</span>
              <span style={{ fontSize: '0.8rem', color: attrColors[key], fontWeight: 700 }}>{val}/100</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${val}%`, background: attrColors[key], borderRadius: '4px',
                boxShadow: `0 0 10px ${attrColors[key]}` }} />
            </div>
          </div>
        ))}
        {player.weight && (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '15px', textAlign: 'center' }}>
            Fuerza Relativa: {player.gymStats ? ((player.gymStats.squat + player.gymStats.bench + player.gymStats.deadlift) / player.weight).toFixed(1) : '—'} · Peso: {player.weight}kg · Altura: {player.height || '—'}m
          </p>
        )}
      </div>

      {badges.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--color-gold)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
            Insignias de Batalla
          </h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {badges.map((b, i) => (
              <div key={i} style={{ padding: '8px 14px', background: 'rgba(255,179,0,0.08)', border: '1px solid rgba(255,179,0,0.2)',
                borderRadius: '20px', fontSize: '0.8rem', color: 'var(--color-gold)' }}>
                {b.icon} {b.name} <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{b.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--color-gold)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
          Estadisticas de Combate
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Tries', val: totalTries, color: '#ff3d00' },
            { label: 'Conversiones', val: (player.matchStats || []).reduce((s,m) => s + (m.conversions||0), 0), color: '#ffb300' },
            { label: 'Tackles', val: totalTackles, color: '#00b0ff' },
            { label: 'Recuperaciones', val: (player.matchStats || []).reduce((s,m) => s + (m.turnovers||0), 0), color: '#00e676' },
            { label: 'MVP', val: totalMvp, color: '#e040fb' },
            { label: 'Partidos', val: (player.matchStats || []).length, color: '#9e9e9e' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {(player.memberships) && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--color-gold)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
            Membresia del Clan
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ flex: 1, height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${player.memberships.due > 0 ? Math.min(100, (player.memberships.paid / player.memberships.due) * 100) : 100}%`,
                background: '#00e676', borderRadius: '5px', boxShadow: '0 0 8px rgba(0,230,118,0.4)' }} />
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
              ${(player.memberships.paid || 0).toLocaleString()} / ${player.memberships.due > 0 ? (player.memberships.due || 10000).toLocaleString() : 'Completo'} COP
            </span>
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--color-gold)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
          Wellness Check-in
        </h3>
        {lastWellness && (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '15px' }}>
            Ultimo registro: {lastWellness.date} — Sueño: {'⭐'.repeat(lastWellness.sleep || 0)} Dolor: {'⭐'.repeat(lastWellness.soreness || 0)} Estres: {'⭐'.repeat(lastWellness.stress || 0)}
          </p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '15px' }}>
          {[
            { key: 'sleep', label: 'Sueño' },
            { key: 'soreness', label: 'Dolor Muscular' },
            { key: 'stress', label: 'Estrés' },
          ].map(w => (
            <div key={w.key} style={{ textAlign: 'center' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>{w.label}</label>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setWellness({...wellness, [w.key]: n})}
                    style={{
                      width: '28px', height: '28px', borderRadius: '50%', border: '1px solid',
                      borderColor: wellness[w.key] >= n ? 'var(--color-gold)' : 'var(--border-glass)',
                      background: wellness[w.key] >= n ? 'rgba(255,179,0,0.15)' : 'transparent',
                      color: wellness[w.key] >= n ? 'var(--color-gold)' : 'var(--color-text-muted)',
                      cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700
                    }}>{n}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button onClick={handleWellnessSubmit} className="btn-neon"
          style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.85rem' }}>
          Registrar Wellness
        </button>
      </div>

      {(player.workoutLog || []).slice(-3).length > 0 && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--color-gold)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
            Ultimas Rutinas
          </h3>
          {(player.workoutLog || []).slice(-3).reverse().map((w, i) => (
            <div key={i} style={{ padding: '10px', marginBottom: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>{w.routine || 'Rutina'} — {w.date}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{w.category || ''} · {w.completed ? 'Completada' : 'Pendiente'}</p>
            </div>
          ))}
        </div>
      )}

      <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--color-text-muted)', padding: '20px' }}>
        {rpgRole.icon} Fuerza, Honor y Tercer Tiempo. {rpgRole.icon}
      </p>
    </div>
  );
}

export default PlayerDashboard;
