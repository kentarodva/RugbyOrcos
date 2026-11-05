import React, { useState } from 'react';
import { PlayerPhoto } from '../PlayerPhoto';
import {
  OrcosRugbyBallIcon,
  OrcosBattleAxeHPostsIcon,
  OrcosTackleShieldIcon,
  OrcosThirdTimeHornIcon,
  OrcosWarBannerIcon,
} from '../common/OrcosIcons';

export function LeaderboardTab({ players = [], teamCategory = 'all' }) {
  const [filterCat, setFilterCat] = useState(teamCategory || 'all');

  const filtered = filterCat === 'all'
    ? players
    : players.filter(p => (p.teamCategory || '').toLowerCase() === filterCat.toLowerCase());

  // 1. Tryman de Oro (Ensayos anotados)
  const topTries = [...filtered].map(p => {
    const tries = (p.matchStats || []).reduce((acc, m) => acc + (Number(m.tries) || 0), 0)
      || Number(p.tries || p.ensayos || 0);
    return { player: p, count: tries };
  }).sort((a, b) => b.count - a.count).slice(0, 10);

  // 2. Botín de Oro (Puntos al pie: conversiones + penales + drops)
  const topKickers = [...filtered].map(p => {
    const kickPts = (p.matchStats || []).reduce((acc, m) => {
      const conv = (Number(m.conversions) || 0) * 2;
      const pen = (Number(m.penalties_scored) || 0) * 3;
      const drop = (Number(m.drops) || 0) * 3;
      return acc + conv + pen + drop;
    }, 0) || Number(p.puntos_pie || 0);
    return { player: p, count: kickPts };
  }).sort((a, b) => b.count - a.count).slice(0, 10);

  // 3. Escudo de Hierro (Partidos disputados & consistencia)
  const topCaps = [...filtered].map(p => {
    const caps = Number(p.partidos_jugados || p.caps || p.matches_played || (p.matchStats || []).length || 0);
    return { player: p, count: caps };
  }).sort((a, b) => b.count - a.count).slice(0, 10);

  // 4. Estrella de Makgora & Tercer Tiempo
  const topMvp = [...filtered].map(p => {
    const xp = Number(p.makgora_xp || p.xp || (p.makgora_rank ? parseInt(p.makgora_rank.replace(/\D/g, '')) * 500 : 0) || 0);
    return { player: p, count: xp };
  }).sort((a, b) => b.count - a.count).slice(0, 10);

  const categories = [
    { key: 'all', label: 'Todo el Club' },
    { key: 'masculina_mayor', label: 'Masculina Mayor' },
    { key: 'femenina_mayor', label: 'Femenina Mayor' },
    { key: 'juveniles_masculina', label: 'Juvenil M18 Masc' },
    { key: 'juveniles_femenin', label: 'Juvenil M18 Fem' },
  ];

  const renderPodium = (title, icon, data, unit, color) => (
    <div style={{
      background: 'rgba(10, 20, 30, 0.65)',
      border: `1px solid ${color}40`,
      borderRadius: '16px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color, fontWeight: 900, fontSize: '1.05rem', fontFamily: 'Outfit' }}>
        {icon}
        <span>{title}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.slice(0, 5).map((item, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
          const isGold = index === 0;
          return (
            <div
              key={item.player.id || index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                background: isGold ? `${color}18` : 'rgba(255, 255, 255, 0.03)',
                border: isGold ? `1px solid ${color}60` : '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: isGold ? '1.2rem' : '0.9rem', width: '24px', textAlign: 'center' }}>
                  {medal}
                </span>
                <PlayerPhoto player={item.player} size={34} />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>
                    {item.player.name} {item.player.last_name || ''}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                    #{item.player.camiseta || '—'} · {item.player.posicion || 'Guerrero'}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 900, color, fontFamily: 'Outfit' }}>
                  {item.count}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginLeft: '4px' }}>
                  {unit}
                </span>
              </div>
            </div>
          );
        })}
        {data.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Sin registros en esta categoría
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Category selector */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-muted)', marginRight: '4px' }}>
          Filtrar División:
        </span>
        {categories.map(c => (
          <button
            key={c.key}
            onClick={() => setFilterCat(c.key)}
            className={filterCat === c.key ? 'btn-neon' : 'btn-outline'}
            style={{ padding: '6px 14px', fontSize: '0.78rem' }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Grid of 4 Podiums */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {renderPodium('TRYMAN / TRYWOMAN DE ORO', <OrcosRugbyBallIcon size={20} color="#00e676" />, topTries, 'Tries', '#00e676')}
        {renderPodium('BOTÍN DE ORO (PATEADOR)', <OrcosBattleAxeHPostsIcon size={20} color="#ffd740" />, topKickers, 'Pts', '#ffd740')}
        {renderPodium('ESCUDO DE HIERRO (CAPS)', <OrcosTackleShieldIcon size={20} color="#38bdf8" />, topCaps, 'Partidos', '#38bdf8')}
        {renderPodium('CAMPEÓN MAKGORA (XP)', <OrcosThirdTimeHornIcon size={20} color="#a855f7" />, topMvp, 'XP', '#a855f7')}
      </div>

      {/* Footer Banner */}
      <div style={{
        background: 'rgba(255, 215, 64, 0.06)',
        border: '1px solid rgba(255, 215, 64, 0.25)',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px'
      }}>
        <OrcosWarBannerIcon size={32} color="#ffd740" style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffd740' }}>
            Premios Oficiales de Clausura de Temporada
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            Los líderes de cada podio recibirán el Trofeo Físico de Honor Orcos y su Tarjeta Dorada de Guerrero durante la ceremonia de fin de año.
          </div>
        </div>
      </div>
    </div>
  );
}
