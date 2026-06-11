import React, { useState, useMemo } from 'react';
import { MembershipCard } from './MembershipCard';
import { MENSUALIDAD_BASE } from './constants';

const SORT_OPTIONS = [
  { value: 'default', label: 'Por defecto' },
  { value: 'debt-desc', label: 'Mayor deuda' },
  { value: 'debt-asc', label: 'Menor deuda' },
  { value: 'morosos-first', label: 'Morosos primero' },
  { value: 'aldia-first', label: 'Al día primero' },
];

const STATUS_CHIPS = [
  { value: 'all', label: 'Todos', color: 'var(--color-text-muted)' },
  { value: 'morosos', label: '🔴 Morosos', color: 'var(--color-red)' },
  { value: 'parcial', label: '🟡 Pago parcial', color: 'var(--color-gold)' },
  { value: 'aldia', label: '🟢 Al día', color: 'var(--color-primary)' },
];

function getPlayerMembership(player) {
  const m = player.memberships || {};
  const due = (m.due > 0 ? m.due : MENSUALIDAD_BASE);
  const paid = m.paid || 0;
  const remaining = Math.max(0, due - paid);
  return { due, paid, remaining };
}

function getStatusKey(player) {
  const { paid, due } = getPlayerMembership(player);
  if (paid >= due) return 'aldia';
  if (paid > 0) return 'parcial';
  return 'morosos';
}

export function MembershipList({ teamPlayers, getMembershipStatus, onRequestConfirm, onRequestHistory, isStaff }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('default');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredPlayers = useMemo(() => {
    let result = teamPlayers;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.apodo || '').toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(p => getStatusKey(p) === statusFilter);
    }

    switch (sortOrder) {
      case 'debt-desc':
        result = [...result].sort((a, b) => {
          return getPlayerMembership(b).remaining - getPlayerMembership(a).remaining;
        });
        break;
      case 'debt-asc':
        result = [...result].sort((a, b) => {
          return getPlayerMembership(a).remaining - getPlayerMembership(b).remaining;
        });
        break;
      case 'morosos-first':
        result = [...result].sort((a, b) => {
          const order = { morosos: 0, parcial: 1, aldia: 2 };
          return order[getStatusKey(a)] - order[getStatusKey(b)];
        });
        break;
      case 'aldia-first':
        result = [...result].sort((a, b) => {
          const order = { aldia: 0, parcial: 1, morosos: 2 };
          return order[getStatusKey(a)] - order[getStatusKey(b)];
        });
        break;
    }

    return result;
  }, [teamPlayers, searchQuery, sortOrder, statusFilter]);

  const showEmptyState = teamPlayers.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {showEmptyState ? (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '30px' }}>
          No hay jugadores en este equipo. Agrega jugadores en el Roster.
        </p>
      ) : (
        <>
          <div className="glass-panel" style={{ padding: '15px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.9rem' }}>🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o apodo..."
                className="form-input"
                style={{ flex: 1, minWidth: '200px', padding: '8px 12px', fontSize: '0.85rem' }}
              />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="form-select"
                style={{ padding: '8px 12px', fontSize: '0.85rem', width: 'auto' }}
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {STATUS_CHIPS.map(chip => (
                <button
                  key={chip.value}
                  onClick={() => setStatusFilter(chip.value)}
                  className="btn-outline"
                  style={{
                    padding: '4px 12px',
                    fontSize: '0.75rem',
                    background: statusFilter === chip.value ? chip.color : 'transparent',
                    color: statusFilter === chip.value ? '#000' : chip.color,
                    borderColor: statusFilter === chip.value ? chip.color : 'var(--border-glass)',
                    fontWeight: statusFilter === chip.value ? 700 : 500,
                  }}
                >
                  {chip.label}
                </button>
              ))}
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: 'auto', alignSelf: 'center' }}>
                {filteredPlayers.length} de {teamPlayers.length} jugadores
              </span>
            </div>
          </div>

          {filteredPlayers.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '30px' }}>
              Ningún jugador coincide con los filtros.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '15px' }}>
              {filteredPlayers.map(p => (
                <MembershipCard
                  key={p.id}
                  player={p}
                  getMembershipStatus={getMembershipStatus}
                  onRequestConfirm={onRequestConfirm}
                  onRequestHistory={onRequestHistory}
                  isStaff={isStaff}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
