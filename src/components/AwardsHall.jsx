import React, { useContext, useState } from 'react';
import { ClubContext } from '../context/ClubContext.jsx';

const HONOR_AWARDS = [
  { id: 'mvp', name: 'MVP Legendario', icon: '🏆', desc: 'Mas MVPs', calc: p => (p.matchStats || []).filter(m => m.mvp).length, higher: true },
  { id: 'tries', name: 'Try del Año', icon: '💥', desc: 'Mas tries anotados', calc: p => (p.matchStats || []).reduce((s, m) => s + (m.tries || 0), 0), higher: true },
  { id: 'conversions', name: 'Pateador de Elite', icon: '🎯', desc: 'Mas conversiones', calc: p => (p.matchStats || []).reduce((s, m) => s + (m.conversions || 0), 0), higher: true },
  { id: 'tackles', name: 'Muralla Impenetrable', icon: '🧱', desc: 'Mas tackles', calc: p => (p.matchStats || []).reduce((s, m) => s + (m.tackles || 0), 0), higher: true },
  { id: 'turnovers', name: 'Ladron de Balones', icon: '🔄', desc: 'Mas turnovers', calc: p => (p.matchStats || []).reduce((s, m) => s + (m.turnovers || 0), 0), higher: true },
  { id: 'attendance', name: 'Asistencia Perfecta', icon: '🌟', desc: 'Mayor % asistencias', calc: p => { const a = p.attendance || {}; return a.total > 0 ? a.present / a.total : 0; }, higher: true },
  { id: 'progression', name: 'Progresion Epica', icon: '📈', desc: 'Mejora de atributos', calc: p => { const h = p.history || []; if (h.length < 2) return 0; const f = h[0], l = h[h.length - 1]; return (l.force - f.force) + (l.speed - f.speed) + (l.stamina - f.stamina) + (l.technique - f.technique); }, higher: true },
  { id: 'warrior', name: 'Guerrero del Año', icon: '👑', desc: 'Puntaje combinado', calc: p => { const s = p.matchStats || []; const t = s.reduce((a,b) => a + (b.tries||0), 0); const ta = s.reduce((a,b) => a + (b.tackles||0), 0); const m = s.filter(x => x.mvp).length; return t * 3 + ta * 0.5 + m * 5 - s.reduce((a,b) => a + (b.yellowCards||0) * 2 + (b.redCards||0) * 5, 0); }, higher: true },
  { id: 'rookie', name: 'Novato del Año', icon: '🌱', desc: 'Mejor entre nuevos', calc: p => { const s = p.matchStats || []; const m = s.filter(x => x.mvp).length; return (s.reduce((a,b) => a + (b.tries||0), 0)) * 3 + m * 5; }, higher: true, filter: p => (p._meta?.startYear || 2025) >= 2026 },
  { id: 'gym', name: 'Bestia del Gimnasio', icon: '💪', desc: 'Mayor fuerza relativa', calc: p => { const g = p.gymStats || {}; const w = p.weight || 85; return w > 0 ? (g.squat + g.bench + g.deadlift) / w : 0; }, higher: true },
  { id: 'ironman', name: 'Hombre de Hierro', icon: '🔩', desc: '0 lesiones', calc: p => (p.injuryLog || []).length === 0 ? 1 : 0, higher: true },
  { id: 'spirit', name: 'Espiritu de Equipo', icon: '🤝', desc: 'Mas wellness check-ins', calc: p => (p.wellnessLogs || []).length, higher: true },
  { id: 'workout', name: 'Maquina de Pulir', icon: '⚙️', desc: 'Mas rutinas completadas', calc: p => (p.workoutLog || []).filter(w => w.completed).length, higher: true },
  { id: 'giant', name: 'Gigante del Reino', icon: '🦍', desc: 'Mayor estatura', calc: p => p.height || 0, higher: true },
  { id: 'duelist', name: 'Duelista', icon: '🤼', desc: 'Tackles + tarjetas', calc: p => { const s = p.matchStats || []; return s.reduce((a,b) => a + (b.tackles||0) + (b.yellowCards||0) * 3 + (b.redCards||0) * 5, 0); }, higher: true },
];

const TAVERN_AWARDS = [
  { id: 'cards', name: 'Rey de las Tarjetas', icon: '🟨', desc: 'Mas tarjetas', calc: p => (p.matchStats || []).reduce((s, m) => s + (m.yellowCards || 0) + (m.redCards || 0) * 2, 0), higher: true },
  { id: 'reds', name: 'Coleccionista de Arbitros', icon: '🟥', desc: 'Mas rojas', calc: p => (p.matchStats || []).reduce((s, m) => s + (m.redCards || 0), 0), higher: true },
  { id: 'invisible', name: 'El Invisible', icon: '👻', desc: 'Menos asistencias', calc: p => { const a = p.attendance || {}; return a.total > 0 ? a.present / a.total : 1; }, higher: false },
  { id: 'burpees', name: 'Burpee Master', icon: '🦵', desc: 'Mas burpees', calc: p => p.penalties?.burpees || 0, higher: true },
  { id: 'cones', name: 'Cono de Oro', icon: '🟠', desc: 'Conos sin recoger', calc: p => p.penalties?.cones ? 1 : 0, higher: true },
  { id: 'fridge', name: 'Nevera del Año', icon: '🧊', desc: 'Mas semanas lesionado', calc: p => (p.injuryLog || []).reduce((s, i) => s + (i.weeks || 0), 0), higher: true },
  { id: 'slip', name: 'Resbalon de Oro', icon: '🍌', desc: 'Turnovers perdidos', calc: p => -(p.matchStats || []).reduce((s, m) => s + (m.turnovers || 0), 0), higher: false },
  { id: 'ghost', name: 'El Fantasma', icon: '💨', desc: '0 tackles', calc: p => (p.matchStats || []).reduce((s, m) => s + (m.tackles || 0), 0) === 0 && (p.matchStats || []).length > 0 ? 1 : 0, higher: true },
  { id: 'debt', name: 'Moroso del Año', icon: '💸', desc: 'Mayor deuda membresia', calc: p => { const m = p.memberships || {}; return Math.max(0, (m.due || 10000) - (m.paid || 0)); }, higher: true },
  { id: 'sleepy', name: 'Dormilon', icon: '😴', desc: 'Promedio mas bajo sueño', calc: p => { const w = p.wellnessLogs || []; if (!w.length) return 5; return w.reduce((s, x) => s + (x.sleep || 0), 0) / w.length; }, higher: false },
  { id: 'stressed', name: 'Estresado Cronico', icon: '😰', desc: 'Promedio mas alto estres', calc: p => { const w = p.wellnessLogs || []; if (!w.length) return 1; return w.reduce((s, x) => s + (x.stress || 0), 0) / w.length; }, higher: true },
  { id: 'latelate', name: 'Golpeador de Puertas', icon: '🚪', desc: 'Mas llegadas tarde', calc: p => (p.attendance || {}).late || 0, higher: true },
  { id: 'noexcuse', name: 'Sin Justificacion', icon: '🤷', desc: 'Faltas injustificadas', calc: p => (p.attendance || {}).absentUnjustified || 0, higher: true },
  { id: 'bench', name: 'El del Banco', icon: '🪑', desc: 'Mas partidos suplente', calc: () => 0, higher: true },
  { id: 'cameo', name: 'Cameo del Año', icon: '🎬', desc: '1 partido = MVP', calc: p => { const s = p.matchStats || []; return s.length === 1 && s[0].mvp ? 1 : 0; }, higher: true },
  { id: 'fashion', name: 'Fashion Victim', icon: '👗', desc: 'Tallas inconsistentes', calc: p => { const c = p.clothingSizes || {}; const sizes = new Set([c.jersey, c.shorts, c.socks]); return sizes.size >= 3 ? 1 : 0; }, higher: true },
  { id: 'heavy', name: 'Dieta de Hierro', icon: '🍖', desc: 'Mayor peso', calc: p => p.weight || 0, higher: true },
  { id: 'light', name: 'Pluma de Hierro', icon: '🪶', desc: 'Menor peso', calc: p => p.weight || 0, higher: false },
  { id: 'hobbit', name: 'Hobbit del Reino', icon: '🧙', desc: 'Menor estatura', calc: p => p.height || 0, higher: false },
  { id: 'forget', name: 'El Olvidadizo', icon: '📝', desc: 'Sin wellness registrado', calc: p => (p.wellnessLogs || []).length === 0 ? 1 : 0, higher: true },
  { id: 'hia', name: 'HIA Repetido', icon: '🧠', desc: 'Mas protocolos HIA', calc: p => (p.hiaAssessments || []).length, higher: true },
  { id: 'excuses', name: 'Siempre Tiene Excusa', icon: '📞', desc: 'Faltas justificadas', calc: p => (p.attendance || {}).absentJustified || 0, higher: true },
  { id: 'effort', name: 'Trofeo al Esfuerzo', icon: '❤️', desc: 'Corazon > Musculo', calc: p => { const a = p.attendance || {}; const g = p.gymStats || {}; const w = p.weight || 85; const ratio = w > 0 ? (g.squat + g.bench + g.deadlift) / w : 5; return ratio < 3 && a.total > 0 ? (a.present / a.total) * 100 : 0; }, higher: true },
];

function getTop3(players, award) {
  let filtered = players.filter(p => p.rol !== 'Entrenador');
  if (award.filter) filtered = filtered.filter(award.filter);

  const scored = filtered.map(p => ({ ...p, _score: award.calc(p) })).filter(p => p._score > 0);
  scored.sort((a, b) => award.higher ? b._score - a._score : a._score - b._score);
  return scored.slice(0, 3);
}

function AwardsHall() {
  const { players } = useContext(ClubContext);
  const [tab, setTab] = useState('honor');

  const awards = tab === 'honor' ? HONOR_AWARDS : TAVERN_AWARDS;

  const allAwards = awards.map(a => {
    const top = getTop3(players, a);
    return { ...a, top };
  }).filter(a => a.top.length > 0);

  const openPrint = (player, award) => {
    renderPrintCert(player, award);
  };

  return (
    <div style={{ padding: '15px' }}>
      <div className="glass-panel" style={{ padding: '25px', borderRadius: 'var(--radius-lg)', marginBottom: '20px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-gold)', fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Outfit' }}>
          Salon de la Fama del Reino
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '5px' }}>
          Reconocimientos de la temporada basados en estadisticas de combate
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setTab('honor')} className={tab === 'honor' ? 'btn-neon' : 'btn-outline'}
          style={{ padding: '10px 24px', fontSize: '0.9rem', fontWeight: 700 }}>
          Premios de Honor
        </button>
        <button onClick={() => setTab('tavern')} className={tab === 'tavern' ? 'btn-neon' : 'btn-outline'}
          style={{ padding: '10px 24px', fontSize: '0.9rem', fontWeight: 700, borderColor: tab === 'tavern' ? 'var(--color-gold)' : undefined }}>
          Premios de la Taberna
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '15px' }}>
        {allAwards.map(award => (
          <div key={award.id} className="glass-panel" style={{ padding: '18px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '1.5rem' }}>{award.icon}</span>
              <div>
                <h4 style={{ color: 'var(--color-gold)', fontSize: '0.9rem', fontWeight: 700, fontFamily: 'Outfit' }}>{award.name}</h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>{award.desc}</p>
              </div>
            </div>

            {award.top.map((player, idx) => {
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
              const colors = ['#ffb300', '#b0bec5', '#cd7f32'];
              const score = typeof player._score === 'number' && player._score % 1 !== 0 && !award.higher && award.id !== 'sleepy'
                ? (player._score * 100).toFixed(0) + '%'
                : typeof player._score === 'number'
                  ? player._score.toFixed(1)
                  : player._score;

              return (
                <div key={player.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', marginBottom: '6px',
                  background: `rgba(255,255,255,${0.03 - idx * 0.01})`,
                  borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${colors[idx]}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{medal}</span>
                    <span style={{ color: 'var(--color-text)', fontSize: '0.85rem' }}>{player.name}</span>
                    {player.apodo && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>"{player.apodo}"</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: colors[idx], fontWeight: 700, fontSize: '0.85rem' }}>{score}</span>
                    <button onClick={() => openPrint(player, award)}
                      style={{ background: 'none', border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.7rem', padding: '2px 6px' }}
                      title="Generar certificado">📜</button>
                  </div>
                </div>
              );
            })}

            {award.top.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '10px' }}>
                Sin datos suficientes
              </p>
            )}
          </div>
        ))}
      </div>

      {allAwards.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px' }}>
          Registra partidos y estadisticas para que el Salon de la Fama cobre vida.
        </p>
      )}
    </div>
  );
}

function renderPrintCert(player, award) {
  const w = window.open('', '_blank', 'width=800,height=600');
  const date = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  w.document.write(`
    <html><head><title>Certificado - ${award.name}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Outfit', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #0a0c10; }
      .cert { width: 750px; padding: 60px 40px; background: linear-gradient(135deg, #0f1624, #1a1f2e); border: 4px solid #00e676; border-radius: 16px; text-align: center; box-shadow: 0 0 40px rgba(0,230,118,0.15); }
      .logo { font-size: 3rem; filter: drop-shadow(0 0 10px #00e676); margin-bottom: 10px; }
      .title { font-size: 2.2rem; font-weight: 800; color: #00e676; text-shadow: 0 0 15px rgba(0,230,118,0.4); margin-bottom: 10px; letter-spacing: 2px; }
      .subtitle { font-size: 1rem; color: #ffb300; font-weight: 600; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 3px; }
      .award-name { font-size: 1.8rem; font-weight: 800; color: #ffb300; margin-bottom: 8px; }
      .award-icon { font-size: 3rem; margin-bottom: 10px; }
      .player-name { font-size: 2.5rem; font-weight: 800; color: #ffffff; margin: 20px 0; text-shadow: 0 0 20px rgba(255,255,255,0.2); }
      .line { width: 200px; height: 2px; background: linear-gradient(90deg, transparent, #00e676, transparent); margin: 20px auto; }
      .footer { margin-top: 40px; font-size: 0.8rem; color: #6b7280; }
      .footer span { display: block; margin-top: 5px; color: #00e676; font-weight: 600; }
      @media print { body { background: #0a0c10; } }
    </style></head><body>
    <div class="cert">
      <div class="logo">🛡️</div>
      <div class="title">RUGBY ORCOS NEGROS</div>
      <div class="subtitle">Reino Manager v4.0</div>
      <div class="line"></div>
      <div class="award-icon">${award.icon}</div>
      <div class="award-name">${award.name}</div>
      <p style="color:#6b7280;font-size:0.9rem">${award.desc}</p>
      <div class="player-name">${player.name}</div>
      ${player.apodo ? `<p style="color:#6b7280;font-size:1rem;font-style:italic">"${player.apodo}"</p>` : ''}
      <p style="color:#6b7280;font-size:0.9rem;margin-top:10px">${player.posicion || ''} · #${player.camiseta || '—'}</p>
      <div class="line"></div>
      <div class="footer">
        Otorgado el ${date}
        <span>Fuerza, Honor y Tercer Tiempo.</span>
      </div>
    </div>
    <script>setTimeout(() => window.print(), 500);</script>
    </body></html>
  `);
  w.document.close();
}

export default AwardsHall;
