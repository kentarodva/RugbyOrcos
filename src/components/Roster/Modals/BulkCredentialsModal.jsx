import React, { useState, useMemo } from 'react';
import { KeyRound, CheckCircle2, Copy, MessageCircle, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { buildWhatsAppUrl } from '../../../utils/whatsappUtils';

export default function BulkCredentialsModal({ players = [], onClose, createPlayerCredentials }) {
  const { showToast } = useToast();
  const activePlayers = useMemo(
    () => players.filter(p => !p.deleted_at && p.estado !== 'inactivo'),
    [players]
  );

  const pendingPlayers = useMemo(
    () => activePlayers.filter(p => !p.username && !p.userId),
    [activePlayers]
  );

  const existingAccountPlayers = useMemo(
    () => activePlayers.filter(p => p.username || p.userId),
    [activePlayers]
  );

  const [selectedIds, setSelectedIds] = useState(() => new Set(pendingPlayers.map(p => p.id)));
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [generatedList, setGeneratedList] = useState([]);

  const toggleSelect = (id) => {
    if (generating) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (generating) return;
    if (selectedIds.size === pendingPlayers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingPlayers.map(p => p.id)));
    }
  };

  const handleBulkGenerate = async () => {
    const targets = pendingPlayers.filter(p => selectedIds.has(p.id));
    if (targets.length === 0) {
      showToast('Selecciona al menos un guerrero sin cuenta.', 'warning');
      return;
    }

    setGenerating(true);
    setProgress({ current: 0, total: targets.length });
    const results = [...generatedList];

    for (let i = 0; i < targets.length; i++) {
      const p = targets[i];
      setProgress({ current: i + 1, total: targets.length });
      try {
        const res = await createPlayerCredentials(p.id);
        if (res && res.username) {
          results.push({
            playerId: p.id,
            name: p.name,
            apodo: p.apodo || '',
            phone: p.contacto?.phone || '',
            username: res.username,
            email: res.email || `${res.username}@orcos.club`,
            password: res.password,
          });
        }
      } catch {
        // continue with remaining players
      }
    }

    setGeneratedList(results);
    setGenerating(false);
    showToast(`Se generaron ${results.length} accesos para el club.`, 'success');
  };

  const buildPlayerCredentialMessage = (item) => {
    return [
      `🏉 *RUGBY ORCOS — Tus Credenciales de Acceso*`,
      `Hola *${item.name}*, ya tienes activa tu cuenta personal en la App Oficial de Rugby Orcos:`,
      ``,
      `🔗 *Ingresa aquí:* ${window.location.origin}`,
      `👤 *Usuario / Email:* ${item.email}`,
      `🔑 *Contraseña temporal:* ${item.password}`,
      ``,
      `📌 _Al ingresar por primera vez, el sistema te pedirá cambiar tu contraseña y confirmar tu peso, altura, posición, tallas de uniforme y los ejercicios de fuerza que realizas._ 💚⚔️`,
    ].join('\n');
  };

  const handleCopyAllForWhatsApp = () => {
    if (generatedList.length === 0) return;
    const lines = [
      `🏉 *ACCESOS OFICIALES — RUGBY ORCOS CLUB MANAGER*`,
      `🔗 *Link de ingreso:* ${window.location.origin}`,
      ``,
      ...generatedList.map(
        (item, idx) =>
          `${idx + 1}. *${item.name}* — Usuario: \`${item.email}\` | Clave: \`${item.password}\``
      ),
      ``,
      `📌 _Al entrar por primera vez, confirma tus datos físicos, tallas y ejercicios para activar tu gráfica de progreso._`,
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      showToast('Lista de accesos copiada para WhatsApp.', 'success');
    });
  };

  const handleExportCSV = () => {
    if (generatedList.length === 0) return;
    const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const headers = ['Guerrero', 'Apodo', 'Usuario', 'Email de Acceso', 'Contraseña Temporal', 'Teléfono'];
    const rows = generatedList.map(item =>
      [item.name, item.apodo, item.username, item.email, item.password, item.phone].map(escapeCsv).join(',')
    );
    const csv = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Accesos_Rugby_Orcos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Archivo CSV de accesos descargado.', 'success');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-panel animated-slide"
        style={{ maxWidth: '680px', width: '95%', maxHeight: '88vh', overflowY: 'auto', padding: '22px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'rgba(255, 179, 0, 0.12)', border: '1px solid rgba(255, 179, 0, 0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gold)'
            }}>
              <KeyRound size={19} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 800, fontFamily: 'Outfit', margin: 0 }}>
                Generador Masivo de Accesos del Club
              </h3>
              <p style={{ fontSize: '0.73rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Crea cuentas para todos los jugadores pendientes y comparte sus credenciales por WhatsApp en 1 clic
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
        </div>

        <div className="pro-kpi-grid" style={{ marginBottom: '16px' }}>
          <div className="pro-kpi-card">
            <div className="pro-kpi-label">Plantilla Activa</div>
            <div className="pro-kpi-value">{activePlayers.length}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>Guerreros registrados</div>
          </div>
          <div className="pro-kpi-card">
            <div className="pro-kpi-label">Con Cuenta Activa</div>
            <div className="pro-kpi-value" style={{ color: 'var(--color-primary)' }}>
              {existingAccountPlayers.length}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>Ya tienen usuario</div>
          </div>
          <div className="pro-kpi-card">
            <div className="pro-kpi-label">Sin Credenciales</div>
            <div className="pro-kpi-value" style={{ color: pendingPlayers.length > 0 ? 'var(--color-gold)' : 'var(--color-primary)' }}>
              {pendingPlayers.length}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>Pendientes por forjar</div>
          </div>
        </div>

        {generatedList.length > 0 && (
          <div style={{
            padding: '14px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(0, 230, 118, 0.05)', border: '1px solid rgba(0, 230, 118, 0.25)',
            marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontWeight: 800, fontSize: '0.82rem' }}>
                <CheckCircle2 size={16} />
                <span>¡{generatedList.length} Credenciales Generadas en esta Sesión!</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleCopyAllForWhatsApp}
                  className="btn-neon"
                  style={{ padding: '6px 10px', fontSize: '0.73rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  <Copy size={13} /> Copiar Lista WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="btn-outline"
                  style={{ padding: '6px 10px', fontSize: '0.73rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  <FileSpreadsheet size={13} /> Descargar CSV
                </button>
              </div>
            </div>

            <div className="pro-table-wrap" style={{ maxHeight: '220px', overflowY: 'auto' }}>
              <table className="pro-table">
                <thead>
                  <tr>
                    <th>Guerrero</th>
                    <th>Usuario / Email</th>
                    <th>Contraseña Temporal</th>
                    <th className="num">Enviar</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedList.map(item => (
                    <tr key={item.playerId}>
                      <td style={{ fontWeight: 700 }}>{item.name}</td>
                      <td className="tabular-nums" style={{ fontSize: '0.75rem', color: '#40c4ff' }}>{item.email}</td>
                      <td className="tabular-nums" style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--color-gold)' }}>
                        {item.password}
                      </td>
                      <td className="num">
                        <button
                          type="button"
                          onClick={() => {
                            const url = buildWhatsAppUrl(item.phone, buildPlayerCredentialMessage(item));
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }}
                          className="btn-outline"
                          style={{ padding: '4px 8px', fontSize: '0.7rem', color: '#25D366', borderColor: 'rgba(37, 211, 102, 0.35)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <MessageCircle size={12} /> WhatsApp
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {pendingPlayers.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-primary)', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={28} />
            <strong>¡Todos los guerreros activos ya cuentan con credenciales de acceso!</strong>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.size === pendingPlayers.length && pendingPlayers.length > 0}
                  onChange={toggleSelectAll}
                  disabled={generating}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <span>Seleccionar todos ({selectedIds.size}/{pendingPlayers.length})</span>
              </label>

              <button
                type="button"
                onClick={handleBulkGenerate}
                disabled={generating || selectedIds.size === 0}
                className="btn-neon"
                style={{ padding: '8px 14px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <KeyRound size={14} />
                <span>
                  {generating
                    ? `Forjando ${progress.current}/${progress.total}...`
                    : `Generar ${selectedIds.size} Accesos Faltantes`}
                </span>
              </button>
            </div>

            <div className="pro-table-wrap" style={{ maxHeight: '260px', overflowY: 'auto' }}>
              <table className="pro-table">
                <thead>
                  <tr>
                    <th style={{ width: '36px' }}></th>
                    <th>Guerrero</th>
                    <th>División</th>
                    <th>Teléfono</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPlayers.map(p => (
                    <tr key={p.id} onClick={() => toggleSelect(p.id)} style={{ cursor: 'pointer' }}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(p.id)}
                          onChange={() => {}}
                          disabled={generating}
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{p.name}</div>
                        {p.apodo && <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>"{p.apodo}"</div>}
                      </td>
                      <td style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>{p.division || p.teamCategory || '—'}</td>
                      <td className="tabular-nums" style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                        {p.contacto?.phone || 'Sin teléfono'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button onClick={onClose} className="btn-outline">Cerrar</button>
        </div>
      </div>
    </div>
  );
}
