import React, { useState } from 'react';

function SaveTacticModal({
  formationType,
  onSave,
  onClose,
  teamCategories = [],
  makgoraTeams = [],
  upcomingMatches = [],
  defaultScope = 'all',
}) {
  const [name, setName] = useState('');
  const [scope, setScope] = useState(defaultScope || 'all');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), scope, formationType);
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animated-slide" style={{ maxWidth: '420px' }}>
        <h3 className="neon-text-primary" style={{ marginBottom: '15px', fontFamily: 'var(--font-display)' }}>
          Guardar Táctica
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '6px', display: 'block' }}>
              Nombre de la táctica
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Ataque vs Cuervos"
              className="form-input"
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-glass)',
                color: 'var(--color-text)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '6px', display: 'block' }}>
              Alcance
            </label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="form-select"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-glass)',
                color: 'var(--color-text)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
              }}
            >
              <option value="all">Todos los equipos (Global)</option>
              {teamCategories.length > 0 && (
                <optgroup label="Divisiones del Club">
                  {teamCategories.map(tc => (
                    <option key={tc} value={tc}>{tc}</option>
                  ))}
                </optgroup>
              )}
              {makgoraTeams.length > 0 && (
                <optgroup label="Clanes Mak'Gora">
                  {makgoraTeams.map(mt => (
                    <option key={mt.id} value={`makgora_${mt.id}`}>
                      Mak'Gora: {mt.rpg_name || mt.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {upcomingMatches.length > 0 && (
                <optgroup label="Partidos Programados">
                  {upcomingMatches.map(m => (
                    <option key={m.id} value={`match_${m.id}`}>
                      Partido ({m.date}) vs {m.opponent}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
          <button onClick={onClose} className="btn-outline" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="btn-neon"
            style={{
              padding: '8px 18px',
              fontSize: '0.85rem',
              opacity: !name.trim() || saving ? 0.5 : 1,
              cursor: !name.trim() || saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SaveTacticModal;
