import React, { useContext, useState } from 'react';
import { Users, CheckCircle2, HelpCircle, XCircle, ChevronDown, ChevronUp, Share2, Trash2, MessageCircle } from 'lucide-react';
import { ClubContext } from '../../../context/ClubContext';
import { useToast } from '../../../context/ToastContext';
import { formatLocalDate } from '../../../utils/dates.js';
import { buildMatchAvailabilitySummaryText } from '../../../utils/whatsappUtils';

function FutureCard({ future, onDelete }) {
  const { createInvitation, matchInvitations, players, setMatchAvailability, fixtures } = useContext(ClubContext);
  const { showToast } = useToast();
  const [showConvocatoria, setShowConvocatoria] = useState(false);

  const headToHead = React.useMemo(() => {
    const oppLower = (future.opponent || '').toLowerCase().trim();
    if (!oppLower) return null;
    const history = (fixtures || []).filter(f => {
      const name = (f.opponent || '').toLowerCase().trim();
      return name && (name.includes(oppLower) || oppLower.includes(name));
    });
    if (history.length === 0) return null;
    let won = 0, lost = 0, drawn = 0;
    history.forEach(m => {
      const o = Number(m.orcosScore ?? m.orcos_score ?? 0);
      const r = Number(m.opponentScore ?? m.opponent_score ?? 0);
      if (o > r) won++;
      else if (o < r) lost++;
      else drawn++;
    });
    return { total: history.length, won, lost, drawn };
  }, [fixtures, future.opponent]);

  const daysUntil = Math.ceil((new Date(future.date + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24));
  const isSoon = daysUntil <= 7 && daysUntil >= 0;

  const existingInv = matchInvitations.find(inv => inv.futureFixtureId === future.id && inv.status === 'active');

  const availMap = future.availabilities || {};
  const teamPlayers = (players || []).filter(p => !future.teamCategory || p.teamCategory === future.teamCategory);
  const goingPlayers = teamPlayers.filter(p => availMap[p.id] === 'going');
  const maybePlayers = teamPlayers.filter(p => availMap[p.id] === 'maybe');
  const notGoingPlayers = teamPlayers.filter(p => availMap[p.id] === 'not_going');

  const handleInvite = async () => {
    if (!window.confirm(`Crear invitacion para el partido vs ${future.opponent} (${future.date})?`)) return;
    const result = await createInvitation({
      futureFixtureId: future.id,
      rivalName: future.opponent,
      rivalId: future.rivalId || null,
    });
    if (result?.success) {
      const link = `${window.location.origin}/invitacion/${result.token}`;
      await navigator.clipboard.writeText(link);
      alert(`Invitacion creada. Link copiado:\n${link}`);
    } else {
      alert('Error al crear invitacion: ' + (result?.error || 'desconocido'));
    }
  };

  return (
    <div
      className="glass-panel animated-slide"
      style={{
        padding: '20px',
        borderLeft: isSoon ? '4px solid var(--color-gold)' : '4px solid rgba(255,255,255,0.1)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <span className={`pro-chip ${isSoon ? 'pro-chip-warning' : 'pro-chip-muted'} tabular-nums`}>
          {daysUntil <= 0 ? 'HOY' : daysUntil === 1 ? 'MAÑANA' : `EN ${daysUntil} DÍAS`}
        </span>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setShowConvocatoria(!showConvocatoria)}
            className="btn-outline"
            style={{ padding: '4px 10px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--color-primary)', borderColor: 'rgba(0,230,118,0.3)' }}
          >
            <Users size={13} />
            <span className="tabular-nums">Convocatoria ({goingPlayers.length})</span>
            {showConvocatoria ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          <button
            type="button"
            onClick={() => {
              const text = buildMatchAvailabilitySummaryText({ future, teamPlayers });
              navigator.clipboard.writeText(text).then(() => {
                showToast('Lista de convocatoria copiada para WhatsApp.', 'success');
              });
            }}
            className="btn-outline"
            style={{ padding: '4px 10px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#25D366', borderColor: 'rgba(37, 211, 102, 0.35)' }}
            title="Copiar lista de convocados para pegar en el grupo de WhatsApp"
          >
            <MessageCircle size={13} />
            <span>Copiar Lista WA</span>
          </button>

          {existingInv ? (
            <span className="pro-chip pro-chip-warning">
              Invitación activa
            </span>
          ) : (
            <button
              onClick={handleInvite}
              className="btn-outline"
              style={{ padding: '4px 10px', fontSize: '0.72rem', borderColor: 'var(--color-gold)', color: 'var(--color-gold)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <Share2 size={12} /> Invitar Rival
            </button>
          )}
          <button
            onClick={() => onDelete(future.id)}
            className="btn-outline"
            style={{ padding: '4px 8px', color: 'var(--color-red)', borderColor: 'rgba(255,61,0,0.3)' }}
            title="Eliminar fixture"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '6px 0' }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>Orcos</h4>
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>VS</div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)', margin: 0 }}>{future.opponent}</h4>
        </div>
      </div>

      {headToHead && (
        <div style={{ textAlign: 'center', marginTop: '-4px', marginBottom: '4px' }}>
          <span
            className="pro-chip pro-chip-muted tabular-nums"
            style={{ fontSize: '0.68rem', borderColor: 'rgba(255, 215, 64, 0.4)', color: 'var(--color-gold)', display: 'inline-block' }}
            title={`Historial oficial vs ${future.opponent}: ${headToHead.won} Victorias, ${headToHead.lost} Derrotas, ${headToHead.drawn} Empates`}
          >
            ⚔️ Cara a Cara: {headToHead.won}V - {headToHead.lost}D ({headToHead.total} partidos previos)
          </span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
        <div>
          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.65rem' }}>LUGAR</span>
          <strong>{future.location || 'Por definir'}</strong>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.65rem' }}>HORA</span>
          <strong className="tabular-nums">{future.time || 'Por definir'}</strong>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '0.72rem' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <span className="pro-chip pro-chip-success tabular-nums"><CheckCircle2 size={11} /> {goingPlayers.length} Disponibles</span>
          <span className="pro-chip pro-chip-warning tabular-nums"><HelpCircle size={11} /> {maybePlayers.length} Duda</span>
          <span className="pro-chip pro-chip-danger tabular-nums"><XCircle size={11} /> {notGoingPlayers.length} Bajas</span>
        </div>
        <span style={{ color: 'var(--color-text-muted)' }}>
          {formatLocalDate(new Date(future.date + 'T00:00:00'), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {showConvocatoria && (
        <div style={{ marginTop: '6px', paddingTop: '10px', borderTop: '1px solid var(--border-glass)' }}>
          <div className="pro-table-wrap" style={{ maxHeight: '260px', overflowY: 'auto' }}>
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Guerrero</th>
                  <th>Posición</th>
                  <th>Estado</th>
                  <th className="num">Marcar Disponibilidad</th>
                </tr>
              </thead>
              <tbody>
                {teamPlayers.map(p => {
                  const st = availMap[p.id] || 'pending';
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700 }}>{p.name}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{p.posicion || '—'}</td>
                      <td>
                        {st === 'going' && <span className="pro-chip pro-chip-success">Disponible</span>}
                        {st === 'maybe' && <span className="pro-chip pro-chip-warning">Duda</span>}
                        {st === 'not_going' && <span className="pro-chip pro-chip-danger">Baja</span>}
                        {st === 'pending' && <span className="pro-chip pro-chip-muted">Sin confirmar</span>}
                      </td>
                      <td className="num">
                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => setMatchAvailability?.(future.id, p.id, 'going')}
                            className="btn-outline"
                            style={{ padding: '3px 7px', fontSize: '0.68rem', color: st === 'going' ? 'var(--color-primary)' : undefined, borderColor: st === 'going' ? 'var(--color-primary)' : undefined }}
                          >
                            Sí
                          </button>
                          <button
                            type="button"
                            onClick={() => setMatchAvailability?.(future.id, p.id, 'maybe')}
                            className="btn-outline"
                            style={{ padding: '3px 7px', fontSize: '0.68rem', color: st === 'maybe' ? 'var(--color-gold)' : undefined, borderColor: st === 'maybe' ? 'var(--color-gold)' : undefined }}
                          >
                            Duda
                          </button>
                          <button
                            type="button"
                            onClick={() => setMatchAvailability?.(future.id, p.id, 'not_going')}
                            className="btn-outline"
                            style={{ padding: '3px 7px', fontSize: '0.68rem', color: st === 'not_going' ? 'var(--color-red)' : undefined, borderColor: st === 'not_going' ? 'var(--color-red)' : undefined }}
                          >
                            Baja
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default FutureCard;
