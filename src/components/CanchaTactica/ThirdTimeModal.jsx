import React, { useState } from 'react';
import { Trophy, Download, Share2, X, Beer, Camera } from 'lucide-react';
import { copyOrDownloadThirdTimeBanner, generateThirdTimeWhatsAppText } from '../../utils/exportThirdTimeBanner';
import { useToast } from '../../context/ToastContext';
import { vibrateSuccess } from '../../utils/haptics';

export function ThirdTimeModal({ match, squad = [], onSaveThirdTime, onClose }) {
  const { showToast } = useToast();
  const existingThirdTime = match?.third_time || {};

  const [orcosMvpId, setOrcosMvpId] = useState(existingThirdTime.orcos_mvp_id || squad[0]?.id || '');
  const [orcosNote, setOrcosNote] = useState(existingThirdTime.orcos_mvp_note || 'Liderazgo en el contacto y garra en defensa.');

  const [rivalMvpName, setRivalMvpName] = useState(existingThirdTime.rival_mvp_name || '');
  const [rivalMvpNumber, setRivalMvpNumber] = useState(existingThirdTime.rival_mvp_number || '');
  const [rivalNote, setRivalNote] = useState(existingThirdTime.rival_mvp_note || 'Caballerosidad, entrega total y respeto en cancha.');
  const [rivalPhoto, setRivalPhoto] = useState(existingThirdTime.rival_mvp_photo || null);

  const [generating, setGenerating] = useState(false);

  const selectedOrcosPlayer = squad.find(p => String(p.id) === String(orcosMvpId)) || squad[0] || {};
  const rivalName = match?.rival || match?.opponent || 'Equipo Rival';

  const handleRivalPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRivalPhoto(ev.target.result);
      showToast('Foto del MVP rival cargada para la placa.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const getThirdTimeData = () => ({
    orcos_mvp_id: selectedOrcosPlayer.id,
    orcos_mvp_name: `${selectedOrcosPlayer.name || ''} ${selectedOrcosPlayer.last_name || ''}`.trim() || 'Guerrero Orco',
    orcos_mvp_number: selectedOrcosPlayer.camiseta || '—',
    orcos_mvp_pos: selectedOrcosPlayer.posicion || 'Titular',
    orcos_mvp_photo: selectedOrcosPlayer.photo_url || null,
    orcos_mvp_note: orcosNote,
    rival_name: rivalName,
    rival_mvp_name: rivalMvpName || 'Guerrero Rival',
    rival_mvp_number: rivalMvpNumber || '—',
    rival_mvp_photo: rivalPhoto,
    rival_mvp_note: rivalNote,
    awarded_xp: 150,
    created_at: new Date().toISOString()
  });

  const handleSave = () => {
    const data = getThirdTimeData();
    if (onSaveThirdTime) {
      onSaveThirdTime(match.id, data);
    }
    vibrateSuccess();
    showToast('¡Tercer Tiempo y MVPs guardados en el historial!', 'success');
  };

  const handleExportBanner = async () => {
    setGenerating(true);
    try {
      const data = getThirdTimeData();
      const res = await copyOrDownloadThirdTimeBanner(match, data);
      vibrateSuccess();
      if (res?.copied) {
        showToast('Placa de Tercer Tiempo copiada y descargada.', 'success');
      } else {
        showToast('Placa de Tercer Tiempo descargada con éxito.', 'success');
      }
    } catch {
      showToast('Error al generar la placa de Tercer Tiempo.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleShareWhatsApp = () => {
    const data = getThirdTimeData();
    const text = generateThirdTimeWhatsAppText(match, data);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    vibrateSuccess();
    showToast('Abriendo WhatsApp para compartir al rival...', 'info');
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div
        className="modal-content glass-panel animated-slide"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '680px', width: '95%', maxHeight: '92vh', overflowY: 'auto', padding: '24px' }}
      >
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid rgba(255,215,64,0.2)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(255,215,64,0.15)', padding: '8px', borderRadius: '10px', color: '#E8B931' }}>
              <Beer size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: '#E8B931' }}>
                Tercer Tiempo & MVP de la Batalla
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Orcos Negros vs {rivalName} · Tradición Sagrada del Rugby
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Formulario de 2 Columnas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px', marginBottom: '20px' }}>
          {/* Tarjeta Orcos */}
          <div style={{ background: 'rgba(46, 229, 122, 0.05)', border: '1px solid rgba(46, 229, 122, 0.3)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#2EE57A', fontWeight: 800, fontSize: '0.9rem' }}>
              <Trophy size={16} />
              <span>MVP ORCOS NEGROS</span>
            </div>

            <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
              Guerrero Destacado:
            </label>
            <select
              value={orcosMvpId}
              onChange={e => setOrcosMvpId(e.target.value)}
              className="form-select"
              style={{ width: '100%', marginBottom: '10px', fontSize: '0.85rem' }}
            >
              {squad.map(p => (
                <option key={p.id} value={p.id}>
                  #{p.camiseta || '—'} {p.name} {p.last_name || ''} ({p.posicion || 'Titular'})
                </option>
              ))}
            </select>

            <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
              Mérito de Combate:
            </label>
            <input
              type="text"
              value={orcosNote}
              onChange={e => setOrcosNote(e.target.value)}
              className="form-input"
              placeholder="Razón de su distinción..."
              style={{ width: '100%', fontSize: '0.82rem', marginBottom: '10px' }}
            />

            <div style={{ fontSize: '0.75rem', color: '#E8B931', background: 'rgba(255,215,64,0.1)', padding: '6px 10px', borderRadius: '6px', fontWeight: 700 }}>
              ⭐ Otorga +150 XP de Honor Makgora automático
            </div>
          </div>

          {/* Tarjeta Rival */}
          <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#38bdf8', fontWeight: 800, fontSize: '0.9rem' }}>
              <Trophy size={16} />
              <span>MVP {rivalName.toUpperCase()}</span>
            </div>

            <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
              Nombre del Jugador Rival:
            </label>
            <input
              type="text"
              value={rivalMvpName}
              onChange={e => setRivalMvpName(e.target.value)}
              className="form-input"
              placeholder="Ej: Santiago Pardo"
              style={{ width: '100%', fontSize: '0.85rem', marginBottom: '10px' }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '8px', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                  N° Camiseta:
                </label>
                <input
                  type="text"
                  value={rivalMvpNumber}
                  onChange={e => setRivalMvpNumber(e.target.value)}
                  className="form-input"
                  placeholder="Ej: 10"
                  style={{ width: '100%', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                  Foto del Rival:
                </label>
                <label className="btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer', padding: '7px' }}>
                  <Camera size={14} />
                  <span>{rivalPhoto ? 'Cambiar' : 'Subir Foto'}</span>
                  <input type="file" accept="image/*" onChange={handleRivalPhotoUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
              Nota de Caballerosidad:
            </label>
            <input
              type="text"
              value={rivalNote}
              onChange={e => setRivalNote(e.target.value)}
              className="form-input"
              placeholder="Ej: Gran destreza y deportividad..."
              style={{ width: '100%', fontSize: '0.82rem' }}
            />
          </div>
        </div>

        {/* Botonera de Acción */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            onClick={handleSave}
            className="btn-outline"
            style={{ padding: '8px 16px', fontSize: '0.82rem', borderColor: 'var(--color-gold)', color: '#E8B931' }}
          >
            💾 Guardar Registro
          </button>

          <button
            onClick={handleExportBanner}
            disabled={generating}
            className="btn-outline"
            style={{ padding: '8px 16px', fontSize: '0.82rem', borderColor: '#2EE57A', color: '#2EE57A', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={14} />
            <span>{generating ? 'Generando Placa...' : 'Placa Oficial PNG'}</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="btn-neon"
            style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Share2 size={14} />
            <span>Enviar al Capitán Rival (WhatsApp)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
