import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, ZoomIn } from 'lucide-react';

const CROP_SIZE = 300;
const OUTPUT_SIZE = 512;
const QUALITY = 0.85;

function centerOffset(naturalW, naturalH, z) {
  const w = naturalW * z;
  const h = naturalH * z;
  return { x: (CROP_SIZE - w) / 2, y: (CROP_SIZE - h) / 2 };
}

export function PhotoEditor({ file, photoUrl, onSave, onClose }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [tacticalMode, setTacticalMode] = useState(true);
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
      const cleanup = loadImage(file, file);
      return cleanup;
    }
  }, [file, loadImage]);

  useEffect(() => {
    if (!file && photoUrl) {
      let cancelled = false;
      let objectUrl = null;
      originalBlobRef.current = null;
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
  }, [rerender]);

  const handleTouchStart = useCallback((e) => {
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
  }, [rerender]);

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

      ctx.fillStyle = '#090e17';
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      if (tacticalMode) {
        ctx.filter = 'contrast(1.12) saturate(1.08) brightness(1.03)';
      }
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.filter = 'none';

      if (tacticalMode) {
        const vig = ctx.createRadialGradient(
          OUTPUT_SIZE / 2, OUTPUT_SIZE * 0.45, OUTPUT_SIZE * 0.25,
          OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2
        );
        vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vig.addColorStop(0.75, 'rgba(4, 9, 16, 0.16)');
        vig.addColorStop(1, 'rgba(4, 9, 16, 0.62)');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      }

      canvas.toBlob(blob => {
        if (blob) { onSave(blob); return; }
        canvas.toBlob(blob2 => {
          if (blob2) onSave(blob2);
        }, 'image/png');
      }, 'image/webp', QUALITY);
    };
    img.src = imgSrc;
  }, [imgSrc, imgNatural, tacticalMode, onSave]);

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
          Arrastra para centrar tu rostro y usa el control de zoom
        </p>

        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{
            width: CROP_SIZE, height: CROP_SIZE, position: 'relative',
            overflow: 'hidden', borderRadius: '50%', cursor: 'grab',
            border: `3px solid ${tacticalMode ? 'var(--color-primary)' : 'var(--border-glass)'}`,
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
              filter: tacticalMode ? 'contrast(1.12) saturate(1.08) brightness(1.03)' : 'none',
              pointerEvents: 'none',
            }}
          />
          {tacticalMode && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'radial-gradient(circle at 50% 45%, transparent 45%, rgba(4,9,16,0.58) 100%)',
              pointerEvents: 'none'
            }} />
          )}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            boxShadow: 'inset 0 0 0 1px var(--color-primary)',
            pointerEvents: 'none'
          }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', maxWidth: `${CROP_SIZE}px` }}>
          <ZoomIn size={14} style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="range"
            min={Math.max(CROP_SIZE / imgNatural.w, CROP_SIZE / imgNatural.h)}
            max={3}
            step={0.01}
            value={z}
            onChange={(e) => handleZoom(e.target.value)}
            style={{ flex: 1 }}
          />
          <span className="tabular-nums" style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{Math.round(z * 100)}%</span>
        </div>

        <button
          type="button"
          onClick={() => setTacticalMode(v => !v)}
          className={tacticalMode ? 'btn-neon' : 'btn-outline'}
          style={{
            width: '100%', maxWidth: `${CROP_SIZE}px`, padding: '9px 12px', fontSize: '0.8rem',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}
        >
          <Sparkles size={15} />
          <span>{tacticalMode ? 'Modo Retrato Táctico: Activo (Alto Contraste)' : 'Activar Modo Retrato Táctico'}</span>
        </button>

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
