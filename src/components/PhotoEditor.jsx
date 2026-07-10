import React, { useState, useRef, useEffect, useCallback } from 'react';
import { removeBackground } from '@imgly/background-removal';
import { handleError } from '../utils/errorHandler';

const CROP_SIZE = 300;
const OUTPUT_SIZE = 512;
const QUALITY = 0.8;

function centerOffset(naturalW, naturalH, z) {
  const w = naturalW * z;
  const h = naturalH * z;
  return { x: (CROP_SIZE - w) / 2, y: (CROP_SIZE - h) / 2 };
}

export function PhotoEditor({ file, photoUrl, onSave, onClose }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bgRemoved, setBgRemoved] = useState(false);
  const [bgError, setBgError] = useState(false);
  const [, forceUpdate] = useState(0);

  const zoomRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const sourceRef = useRef(null);
  const originalBlobRef = useRef(null);
  const currentUrlRef = useRef(null);
  const dragMetaRef = useRef({ startX: 0, startY: 0, startOffX: 0, startOffY: 0 });

  const rerender = useCallback(() => forceUpdate(n => n + 1), []);

  const loadImage = useCallback((src, blob) => {
    const url = typeof src === 'string' ? src : URL.createObjectURL(src);
    sourceRef.current = blob || src;
    if (!originalBlobRef.current) originalBlobRef.current = blob || src;
    if (currentUrlRef.current && currentUrlRef.current !== url) {
      URL.revokeObjectURL(currentUrlRef.current);
    }
    currentUrlRef.current = url;
    const img = new Image();
    img.onload = () => {
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      setImgNatural({ w: nw, h: nh });
      setImgSrc(url);
      const scale = Math.max(CROP_SIZE / nw, CROP_SIZE / nh);
      zoomRef.current = scale;
      offsetRef.current = centerOffset(nw, nh, scale);
      rerender();
    };
    img.src = url;
    if (typeof src !== 'string') {
      return () => URL.revokeObjectURL(url);
    }
  }, [rerender]);

  useEffect(() => {
    if (file) {
      originalBlobRef.current = null;
      setBgRemoved(false);
      const cleanup = loadImage(file, file);
      return cleanup;
    }
  }, [file, loadImage]);

  useEffect(() => {
    if (!file && photoUrl) {
      let cancelled = false;
      let objectUrl = null;
      originalBlobRef.current = null;
      setBgRemoved(false);
      const controller = new AbortController();
      fetch(photoUrl, { signal: controller.signal })
        .then(r => r.blob())
        .then(blob => {
          if (cancelled) return;
          objectUrl = URL.createObjectURL(blob);
          loadImage(objectUrl, blob);
        })
        .catch(err => {
          if (err.name !== 'AbortError') {
            console.warn('[PhotoEditor] Failed to load photo for re-edit:', err);
          }
        });
      return () => {
        cancelled = true;
        controller.abort();
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      };
    }
  }, [photoUrl, file, loadImage]);

  const handleZoom = useCallback((newZoom) => {
    const z = Number(newZoom);
    const prevZ = zoomRef.current;
    const ratio = z / prevZ;
    const cx = CROP_SIZE / 2;
    const cy = CROP_SIZE / 2;
    const prev = offsetRef.current;
    offsetRef.current = {
      x: cx + (prev.x - cx) * ratio,
      y: cy + (prev.y - cy) * ratio,
    };
    zoomRef.current = z;
    rerender();
  }, [rerender]);

  const handleMouseDown = useCallback((e) => {
    if (processing) return;
    e.preventDefault();
    const off = offsetRef.current;
    dragMetaRef.current = { startX: e.clientX, startY: e.clientY, startOffX: off.x, startOffY: off.y };
    const onMove = (ev) => {
      const dx = ev.clientX - dragMetaRef.current.startX;
      const dy = ev.clientY - dragMetaRef.current.startY;
      offsetRef.current = { x: dragMetaRef.current.startOffX + dx, y: dragMetaRef.current.startOffY + dy };
      rerender();
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [rerender, processing]);

  const handleTouchStart = useCallback((e) => {
    if (processing) return;
    if (e.touches.length !== 1) return;
    e.preventDefault();
    const off = offsetRef.current;
    dragMetaRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, startOffX: off.x, startOffY: off.y };
    const onMove = (ev) => {
      if (ev.touches.length !== 1) return;
      const dx = ev.touches[0].clientX - dragMetaRef.current.startX;
      const dy = ev.touches[0].clientY - dragMetaRef.current.startY;
      offsetRef.current = { x: dragMetaRef.current.startOffX + dx, y: dragMetaRef.current.startOffY + dy };
      rerender();
    };
    const onEnd = () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }, [rerender, processing]);

  const handleRemoveBackground = useCallback(async () => {
    const src = sourceRef.current;
    if (!src) return;
    setProcessing(true);
    setProgress(0);
    try {
      const resultBlob = await removeBackground(src, {
        model: 'medium',
        output: { format: 'image/png' },
        progress: (_key, current, total) => {
          setProgress(Math.round((current / total) * 100));
        },
      });
      setBgRemoved(true);
      loadImage(URL.createObjectURL(resultBlob), resultBlob);
    } catch (err) {
      handleError(err, 'PhotoEditor.removeBackground', { silent: true });
      setBgError(true);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  }, [loadImage]);

  const handleRestoreOriginal = useCallback(() => {
    const orig = originalBlobRef.current;
    if (!orig) return;
    setBgRemoved(false);
    loadImage(URL.createObjectURL(orig), orig);
  }, [loadImage]);

  const handleSave = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.onload = () => {
      const z = zoomRef.current;
      const off = offsetRef.current;
      const nw = imgNatural.w;
      const nh = imgNatural.h;
      const scale = z * (OUTPUT_SIZE / CROP_SIZE);
      const drawW = nw * scale;
      const drawH = nh * scale;
      const drawX = off.x * (OUTPUT_SIZE / CROP_SIZE);
      const drawY = off.y * (OUTPUT_SIZE / CROP_SIZE);

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      canvas.toBlob(blob => {
        if (blob) { onSave(blob); return; }
        canvas.toBlob(blob2 => {
          if (blob2) onSave(blob2);
        }, 'image/png');
      }, 'image/webp', QUALITY);
    };
    img.src = imgSrc;
  }, [imgSrc, imgNatural, onSave]);

  if (!imgSrc) return null;

  const z = zoomRef.current;
  const off = offsetRef.current;
  const imgW = imgNatural.w * z;
  const imgH = imgNatural.h * z;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{
        maxWidth: '520px', width: '90%', padding: '25px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit', margin: 0 }}>Recortar Foto de Perfil</h3>
          <button onClick={onClose} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✕</button>
        </div>

        <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', margin: 0, textAlign: 'center' }}>
          Arrastra para posicionar y usa el slider para hacer zoom
        </p>

        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{
            width: CROP_SIZE, height: CROP_SIZE, position: 'relative',
            overflow: 'hidden', borderRadius: '50%', cursor: 'grab',
            border: '3px solid var(--color-primary)',
            userSelect: 'none', touchAction: 'none'
          }}
        >
          <img
            src={imgSrc}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: 0, top: 0,
              width: imgW, height: imgH,
              transform: `translate(${off.x}px, ${off.y}px)`,
              transformOrigin: '0 0',
              pointerEvents: 'none',
            }}
          />
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            boxShadow: 'inset 0 0 0 1px var(--color-primary)',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute', inset: '-10px',
            background: 'radial-gradient(circle 150px, transparent 149px, rgba(0,0,0,0.65) 150px)',
            pointerEvents: 'none'
          }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', maxWidth: `${CROP_SIZE}px` }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>🔍</span>
          <input
            type="range"
            min={Math.max(CROP_SIZE / imgNatural.w, CROP_SIZE / imgNatural.h)}
            max={3}
            step={0.01}
            value={z}
            onChange={(e) => handleZoom(e.target.value)}
            disabled={processing}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{Math.round(z * 100)}%</span>
        </div>

        {processing ? (
          <div style={{ width: '100%', maxWidth: `${CROP_SIZE}px`, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              🧹 Quitando fondo... {progress}%
            </div>
            <div style={{
              width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)',
              borderRadius: '3px', overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`, height: '100%',
                background: 'var(--color-primary)',
                borderRadius: '3px', transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        ) : bgRemoved ? (
          <>
            <button onClick={handleRestoreOriginal} className="btn-outline" style={{ width: '100%', maxWidth: `${CROP_SIZE}px`, padding: '10px', fontSize: '0.85rem', marginBottom: bgError ? '8px' : 0 }}>
              ↩ Usar Original (sin recorte)
            </button>
            {bgError && (
              <button onClick={() => { setBgError(false); handleRemoveBackground(); }} className="btn-outline" style={{ width: '100%', maxWidth: `${CROP_SIZE}px`, padding: '10px', fontSize: '0.85rem', color: 'var(--color-yellow)', borderColor: 'rgba(255,234,0,0.2)' }}>
                🧹 Reintentar Quitar Fondo
              </button>
            )}
          </>
        ) : bgError ? (
          <div style={{ width: '100%', maxWidth: `${CROP_SIZE}px`, textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: '#ef4444', marginBottom: '8px' }}>Error al quitar fondo. El modelo no pudo procesar la imagen.</p>
            <button onClick={() => { setBgError(false); handleRemoveBackground(); }} className="btn-outline" style={{ padding: '10px', fontSize: '0.85rem', width: '100%' }}>
              🧹 Reintentar
            </button>
          </div>
        ) : (
          <button onClick={handleRemoveBackground} className="btn-outline" style={{ width: '100%', maxWidth: `${CROP_SIZE}px`, padding: '10px', fontSize: '0.85rem' }}>
            🧹 Quitar Fondo
          </button>
        )}

        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
          <button onClick={onClose} className="btn-outline" style={{ flex: 1, padding: '10px' }}>Cancelar</button>
          <button onClick={handleSave} className="btn-neon" style={{ flex: 1, padding: '10px', fontSize: '0.9rem' }}>
            Guardar Foto
          </button>
        </div>
      </div>
    </div>
  );
}
