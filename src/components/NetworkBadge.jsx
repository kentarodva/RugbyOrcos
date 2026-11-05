import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export function NetworkBadge() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div
      role="status"
      aria-label={isOnline ? 'Conexión a internet activa' : 'Modo Cancha sin conexión'}
      title={
        isOnline
          ? 'En Línea: Sincronización en tiempo real activa con Supabase'
          : 'Modo Cancha (Offline): Operando con datos locales seguros. Se sincronizará al recuperar señal.'
      }
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '0.74rem',
        fontWeight: 700,
        letterSpacing: '0.03em',
        background: isOnline ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 215, 64, 0.15)',
        border: `1px solid ${isOnline ? 'rgba(0, 230, 118, 0.35)' : 'rgba(255, 215, 64, 0.45)'}`,
        color: isOnline ? '#00e676' : '#ffd740',
        transition: 'all 0.25s ease',
        cursor: 'default',
        userSelect: 'none'
      }}
    >
      {isOnline ? (
        <>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#00e676',
              boxShadow: '0 0 6px #00e676',
              display: 'inline-block'
            }}
          />
          <Wifi size={12} strokeWidth={2.5} />
          <span>EN LÍNEA</span>
        </>
      ) : (
        <>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#ffd740',
              boxShadow: '0 0 6px #ffd740',
              display: 'inline-block'
            }}
          />
          <WifiOff size={12} strokeWidth={2.5} />
          <span>MODO CANCHA</span>
        </>
      )}
    </div>
  );
}
