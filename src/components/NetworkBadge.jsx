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
        background: isOnline ? 'rgba(46, 229, 122, 0.12)' : 'rgba(255, 215, 64, 0.15)',
        border: `1px solid ${isOnline ? 'rgba(46, 229, 122, 0.35)' : 'rgba(255, 215, 64, 0.45)'}`,
        color: isOnline ? '#2EE57A' : '#E8B931',
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
              background: '#2EE57A',
              boxShadow: '0 0 6px #2EE57A',
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
              background: '#E8B931',
              boxShadow: '0 0 6px #E8B931',
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
