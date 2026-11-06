import React, { useState } from 'react';
import { groupedPlays, playTitle } from './playLibrary';

const DRAFT_ID = 'custom_play';

function Row({ active, title, meta, onClick, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: 'var(--radius-md)',
      background: active ? 'var(--bg-elevated)' : 'transparent',
      border: `1px solid ${active ? 'var(--border-strong)' : 'transparent'}`,
    }}>
      <button type="button" onClick={onClick} aria-current={active ? 'true' : undefined}
        style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', color: 'var(--color-text)', font: 'inherit', padding: 0, cursor: 'pointer', minHeight: '40px' }}>
        <span style={{ display: 'block', fontWeight: 600, fontSize: '0.9375rem' }}>{title}</span>
        {meta && <span style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '2px', lineHeight: 1.4 }}>{meta}</span>}
      </button>
      {children}
    </div>
  );
}

/**
 * Jugadas: watch an example, or build and save your own from captured phases.
 */
function PlaysPanel({
  activePlayId, phases, onSelectPreset, onLoadPlay, onExit, onCapture, onRemoveLastPhase,
  showRivals, onToggleRivals, showBall, onToggleBall, library, canEdit,
}) {
  const [tab, setTab] = useState('examples');
  const [name, setName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const isDraft = activePlayId === DRAFT_ID;
  const editingOther = phases.length > 0 && !isDraft;

  const handleSave = async () => {
    if (!name.trim() || phases.length === 0) return;
    setSaving(true);
    const saved = await library.save(name, phases);
    setSaving(false);
    if (saved) {
      setName('');
      onLoadPlay(saved);
    }
  };

  const toggles = (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {[['Rivales', showRivals, onToggleRivals, 'Mostrar los 15 rivales'], ['Balón', showBall, onToggleBall, 'Mostrar el balón (arrástralo para marcar pases)']].map(([label, on, fn, title]) => (
        <button key={label} type="button" aria-pressed={on} onClick={fn} title={title}
          className="btn-outline btn-sm"
          style={on ? { borderColor: 'var(--color-primary)', color: 'var(--color-text)' } : undefined}>
          {on ? '✓ ' : ''}{label}
        </button>
      ))}
    </div>
  );

  return (
    <section className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="segmented" role="tablist" aria-label="Tipo de jugada">
        {[['examples', 'Ejemplos'], ['mine', 'Mis jugadas']].map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id}
            className={tab === id ? 'is-on' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === 'examples' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Jugadas animadas paso a paso para explicar ideas al equipo. Toca una para verla en la cancha.
          </p>
          {groupedPlays().map(({ group, plays }) => (
            <div key={group} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <h4 className="page-eyebrow" style={{ margin: '0 0 4px 0' }}>{group}</h4>
              {plays.map(p => (
                <Row key={p.id} active={activePlayId === p.id} title={playTitle(p)}
                  meta={`${p.phases.length} fases · ${p.summary || ''}`} onClick={() => onSelectPreset(p.id)} />
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === 'mine' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {canEdit && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)' }}>
              <h4 className="section-title" style={{ fontSize: '1rem' }}>Crear jugada</h4>
              <ol style={{ margin: 0, paddingLeft: '20px', listStyle: 'decimal', fontSize: '0.8125rem', color: 'var(--color-text-soft)', lineHeight: 1.6 }}>
                <li>Ubica a los jugadores (y rivales o balón si los usas).</li>
                <li>Toca <strong>Capturar fase</strong>.</li>
                <li>Mueve a los jugadores al siguiente momento y vuelve a capturar.</li>
                <li>Ponle nombre y guárdala.</li>
              </ol>
              {toggles}
              {editingOther && (
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  Estás viendo otra jugada. <button type="button" className="btn-outline btn-sm" onClick={onExit}>Empezar desde cero</button>
                </p>
              )}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button type="button" className="btn-neon btn-sm" onClick={onCapture} disabled={editingOther}>
                  + Capturar fase {isDraft ? phases.length + 1 : 1}
                </button>
                {isDraft && phases.length > 0 && (
                  <>
                    <button type="button" className="btn-outline btn-sm" onClick={onRemoveLastPhase}>Quitar última</button>
                    <button type="button" className="btn-outline btn-sm" onClick={onExit}>Descartar</button>
                  </>
                )}
              </div>
              {isDraft && phases.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input className="form-input" value={name} onChange={e => setName(e.target.value)} maxLength={80}
                    placeholder="Nombre de la jugada" aria-label="Nombre de la jugada" style={{ flex: '1 1 180px', minWidth: 0 }} />
                  <button type="button" className="btn-neon btn-sm" onClick={handleSave} disabled={!name.trim() || saving}>
                    {saving ? 'Guardando…' : `Guardar (${phases.length} ${phases.length === 1 ? 'fase' : 'fases'})`}
                  </button>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <h4 className="page-eyebrow" style={{ margin: '0 0 4px 0' }}>Guardadas</h4>
            {library.plays.length === 0 && (
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                {library.where === 'loading' ? 'Cargando…' : 'Todavía no hay jugadas guardadas para este equipo.'}
              </p>
            )}
            {library.plays.map(p => (
              <Row key={p.id} active={activePlayId === p.id} title={p.name}
                meta={`${p.phases.length} ${p.phases.length === 1 ? 'fase' : 'fases'}${p.local ? ' · solo en este dispositivo' : ''}`}
                onClick={() => onLoadPlay(p)}>
                {canEdit && (confirmDelete === p.id ? (
                  <>
                    <button type="button" className="btn-outline btn-sm" style={{ color: 'var(--color-red)' }}
                      onClick={async () => { await library.remove(p.id); setConfirmDelete(null); if (activePlayId === p.id) onExit(); }}>
                      Borrar
                    </button>
                    <button type="button" className="btn-outline btn-sm" onClick={() => setConfirmDelete(null)}>No</button>
                  </>
                ) : (
                  <button type="button" className="btn-outline btn-sm" aria-label={`Borrar ${p.name}`} onClick={() => setConfirmDelete(p.id)}>✕</button>
                ))}
              </Row>
            ))}
            {library.where === 'device' && (
              <p style={{ margin: '6px 0 0', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                Por ahora se guardan en este dispositivo. Cuando se active el guardado del club, se suben solas.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default PlaysPanel;
