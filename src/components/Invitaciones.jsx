import React, { useContext, useState } from 'react';
import { ClubContext } from '../context/ClubContext';
import { useToast } from '../context/ToastContext';
import { formatLocalDate } from '../utils/dates.js';

function Invitaciones() {
  const { matchInvitations, createInvitation, cancelInvitation, deleteInvitation, futureFixtures } = useContext(ClubContext);
  const { showToast } = useToast();
  const [filter, setFilter] = useState('activas');
  const [expandedInvitation, setExpandedInvitation] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState('');

  const copiarLink = (token) => {
    const link = `${window.location.origin}/invitacion/${token}`;
    navigator.clipboard.writeText(link);
    showToast('Link copiado al portapapeles.', 'success');
  };

  const compartirWhatsApp = (token, rivalName, date) => {
    const link = `${window.location.origin}/invitacion/${token}`;
    const texto = encodeURIComponent(
      `Invitacion de Rugby Orcos Negros vs ${rivalName} - ${date}\n\nRegistra tus jugadores aqui:\n${link}`
    );
    window.open(`https://api.whatsapp.com/send?text=${texto}`, '_blank');
  };

  const handleCancelar = (inv) => {
    if (!window.confirm(`Cancelar la invitacion vs ${inv.rivalName}? El link dejara de funcionar.`)) return;
    cancelInvitation(inv.id);
    showToast('Invitacion cancelada.', 'info');
  };

  const handleEliminar = (inv) => {
    if (!window.confirm(`Eliminar permanentemente la invitacion vs ${inv.rivalName}?`)) return;
    deleteInvitation(inv.id);
    showToast('Invitacion eliminada.', 'info');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedFixture) {
      showToast('Selecciona un partido proximo.', 'warning');
      return;
    }
    const fixture = futureFixtures.find(f => f.id === selectedFixture);
    if (!fixture) return;

    const existing = matchInvitations.find(inv => inv.futureFixtureId === fixture.id && inv.status === 'active');
    if (existing) {
      showToast('Ya existe una invitacion activa para este partido.', 'warning');
      return;
    }

    const result = await createInvitation({
      futureFixtureId: fixture.id,
      rivalName: fixture.opponent,
      rivalId: fixture.rivalId || null,
    });
    if (result?.success) {
      showToast('Invitacion creada. Link copiado.', 'success');
      navigator.clipboard.writeText(`${window.location.origin}/invitacion/${result.token}`);
      setSelectedFixture('');
      setShowCreateForm(false);
    } else {
      showToast('Error al crear: ' + (result?.error || 'desconocido'), 'error');
    }
  };

  const upcomingFixtures = futureFixtures
    .filter(f => new Date(f.date + 'T00:00:00') >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const activas = matchInvitations.filter((inv) => inv.status === 'active');
  const expiradas = matchInvitations.filter((inv) => inv.status !== 'active');
  const displayList = filter === 'activas' ? activas : filter === 'expiradas' ? expiradas : matchInvitations;

  const statusBadge = (status) => {
    const map = {
      active: { label: 'Activa', color: 'var(--color-primary)', bg: 'rgba(0,230,118,0.08)' },
      completed: { label: 'Completada', color: 'var(--color-blue)', bg: 'rgba(0,176,255,0.08)' },
      expired: { label: 'Expirada', color: 'var(--color-red)', bg: 'rgba(255,61,0,0.08)' },
    };
    const s = map[status] || map.expired;
    return (
      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: s.color, background: s.bg, padding: '3px 10px', borderRadius: '12px', border: `1px solid ${s.color}` }}>
        {s.label}
      </span>
    );
  };

  const responseBadge = (response) => {
    const map = {
      pending: { label: 'Sin responder', icon: '⏳', color: 'var(--color-gold)' },
      accepted: { label: 'Aceptada', icon: '✅', color: 'var(--color-primary)' },
      declined: { label: 'Rechazada', icon: '❌', color: 'var(--color-red)' },
    };
    const s = map[response] || map.pending;
    return (
      <span style={{ fontSize: '0.7rem', color: s.color, fontWeight: 600 }}>
        {s.icon} {s.label}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-gold)' }}>
          📨 Invitaciones a Rivales
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setFilter('activas')}
            className={filter === 'activas' ? 'btn-neon' : 'btn-outline'}
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            Activas ({activas.length})
          </button>
          <button
            onClick={() => setFilter('expiradas')}
            className={filter === 'expiradas' ? 'btn-neon' : 'btn-outline'}
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            Historial ({expiradas.length})
          </button>
          <button
            onClick={() => setFilter('todas')}
            className={filter === 'todas' ? 'btn-neon' : 'btn-outline'}
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            Todas ({matchInvitations.length})
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-neon"
            style={{ padding: '6px 14px', fontSize: '0.8rem', marginLeft: 'auto' }}
          >
            + Nueva Invitacion
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="glass-panel animated-slide" style={{ padding: '25px' }}>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="form-group">
              <label>Seleccionar Partido Futuro</label>
              {upcomingFixtures.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  No hay partidos futuros. Agenda uno desde Calendario → Proximos Partidos.
                </p>
              ) : (
                <select
                  value={selectedFixture}
                  onChange={(e) => setSelectedFixture(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">-- Seleccionar partido --</option>
                  {upcomingFixtures.map(f => (
                    <option key={f.id} value={f.id}>
                      vs {f.opponent} — {formatLocalDate(new Date(f.date + 'T00:00:00'), { day: 'numeric', month: 'long', year: 'numeric' })}
                      {f.time ? ` · ${f.time}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowCreateForm(false)} className="btn-outline">Cancelar</button>
              <button type="submit" className="btn-neon" disabled={upcomingFixtures.length === 0}>Crear Invitacion</button>
            </div>
          </form>
        </div>
      )}

      {displayList.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            {filter === 'activas'
              ? 'No hay invitaciones activas. Crea una con el boton "+ Nueva Invitacion" o desde Calendario → Proximos Partidos.'
              : filter === 'expiradas'
                ? 'No hay invitaciones en el historial.'
                : 'No hay invitaciones todavia.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '15px' }}>
          {displayList.map((inv) => {
            const fixture = inv.futureFixture;
            const fixtureDate = fixture?.date
              ? formatLocalDate(new Date(fixture.date + 'T00:00:00'), {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                })
              : '';
            const isExpanded = expandedInvitation === inv.id;

            return (
              <div
                key={inv.id}
                className="glass-panel"
                style={{
                  padding: '20px',
                  borderLeft: `3px solid ${inv.status === 'active' ? 'var(--color-primary)' : 'var(--color-red)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'Outfit' }}>
                      vs {inv.rivalName || fixture?.opponent || 'Rival'}
                    </h4>
                    {fixtureDate && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        {fixtureDate}
                        {fixture?.time ? ` · ${fixture.time}` : ''}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {statusBadge(inv.status)}
                  </div>
                </div>

                {fixture?.location && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    📍 {fixture.location}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-gold)', fontWeight: 700 }}>
                    👥 {inv.guestCount} guerrero(s) registrado(s)
                  </span>
                  {responseBadge(inv.response)}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  <button
                    onClick={() => copiarLink(inv.token)}
                    className="btn-outline"
                    style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'var(--color-blue)', color: 'var(--color-blue)' }}
                  >
                    📋 Copiar Link
                  </button>
                  <button
                    onClick={() => compartirWhatsApp(inv.token, inv.rivalName, fixture?.date || '')}
                    className="btn-outline"
                    style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'var(--color-primary)' }}
                  >
                    📤 WhatsApp
                  </button>
                  <button
                    onClick={() => setExpandedInvitation(isExpanded ? null : inv.id)}
                    className="btn-outline"
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    {isExpanded ? '🔽 Ocultar' : '👥 Ver Jugadores'}
                  </button>
                </div>

                {inv.status === 'active' && (
                  <button
                    onClick={() => handleCancelar(inv)}
                    style={{
                      background: 'rgba(255,61,0,0.08)', border: '1px solid var(--color-red)',
                      color: 'var(--color-red)', padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, alignSelf: 'flex-start',
                    }}
                  >
                    Cancelar Invitacion
                  </button>
                )}

                {inv.status !== 'active' && (
                  <button
                    onClick={() => handleEliminar(inv)}
                    style={{
                      background: 'transparent', border: '1px solid var(--border-glass)',
                      color: 'var(--color-text-muted)', padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer', fontSize: '0.75rem', alignSelf: 'flex-start',
                    }}
                  >
                    🗑️ Eliminar
                  </button>
                )}

                {isExpanded && (
                  <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-glass)' }}>
                    {inv.guests && inv.guests.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {inv.guests.map((g) => (
                          <div
                            key={g.id}
                            style={{
                              display: 'flex', gap: '10px', alignItems: 'center',
                              padding: '7px 10px', background: 'rgba(255,179,0,0.03)',
                              border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)',
                              fontSize: '0.78rem',
                            }}
                          >
                            <span style={{ color: 'var(--color-gold)', fontWeight: 700, minWidth: '30px' }}>
                              {g.number ? `#${g.number}` : '—'}
                            </span>
                            <span style={{ color: 'var(--color-text)' }}>{g.name}</span>
                            {g.position && (
                              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.04)', padding: '1px 7px', borderRadius: '8px' }}>
                                {g.position}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                        No hay jugadores registrados aun.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Invitaciones;
