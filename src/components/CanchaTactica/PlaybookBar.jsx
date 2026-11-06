import React, { useState } from 'react';

/** Sharing and printing the board (the plays themselves live in PlaysPanel). */
function PlaybookBar({ onExportImage, onCopyWhatsAppText, onPrintOfficialPdf, onOpenAcademia }) {
  const [exportStatus, setExportStatus] = useState('');
  const [copyStatus, setCopyStatus] = useState('');

  const handleImageClick = async () => {
    setExportStatus('Generando imagen…');
    try {
      const res = await onExportImage?.();
      setExportStatus(res?.copied ? 'Imagen copiada y descargada' : 'Imagen descargada');
    } catch {
      setExportStatus('No se pudo generar la imagen');
    }
    setTimeout(() => setExportStatus(''), 4000);
  };

  const handleTextClick = async () => {
    await onCopyWhatsAppText?.();
    setCopyStatus('Alineación copiada');
    setTimeout(() => setCopyStatus(''), 3000);
  };

  return (
    <section className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <button type="button" onClick={handleImageClick} className="btn-neon btn-sm"
          title="Imagen HD de la cancha con la alineación y tus dibujos, lista para WhatsApp">
          {exportStatus || 'Compartir imagen'}
        </button>
        <button type="button" onClick={handleTextClick} className="btn-outline btn-sm"
          title="Copia el XV titular y los suplentes como texto para WhatsApp">
          {copyStatus || 'Copiar alineación'}
        </button>
        <button type="button" onClick={onPrintOfficialPdf} className="btn-outline btn-sm"
          title="Planilla oficial de partido en PDF para la mesa técnica">
          Planilla PDF
        </button>
        {onOpenAcademia && (
          <button type="button" onClick={onOpenAcademia} className="btn-outline btn-sm"
            title="Leyes del juego y certificaciones">
            Academia
          </button>
        )}
      </div>
      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
        La imagen incluye la alineación, la fase que estés viendo y tus dibujos.
      </p>
    </section>
  );
}

export default PlaybookBar;
