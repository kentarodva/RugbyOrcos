import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { uploadCrest } from '../../utils/crests';

/** Staff-only: pick an image, upload it to the crests bucket and hand back the public URL. */
export default function CrestUploadButton({ kind, id, currentUrl, onUploaded, compact = false }) {
  const { showToast } = useToast();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !id) return;
    setBusy(true);
    try {
      const url = await uploadCrest(file, { kind, id, previousUrl: currentUrl });
      await onUploaded(url);
      showToast('Escudo actualizado.', 'success');
    } catch (err) {
      const msg = String(err?.message || '');
      const notReady = /bucket|not found|row-level|policy/i.test(msg);
      showToast(notReady ? 'El almacenamiento de escudos aún no está activado (falta aplicar la migración 73).' : (msg || 'No se pudo subir el escudo.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept="image/png,image/webp,image/jpeg,image/svg+xml" hidden onChange={handleFile} />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="btn-outline"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: compact ? '32px' : '40px', padding: compact ? '4px 10px' : '8px 12px', fontSize: compact ? '0.68rem' : '0.75rem', fontWeight: 700, opacity: busy ? 0.6 : 1 }}>
        <Upload size={compact ? 12 : 14} aria-hidden="true" />
        {busy ? 'Subiendo…' : currentUrl ? 'Cambiar escudo' : 'Subir escudo'}
      </button>
    </>
  );
}
