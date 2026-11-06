import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error('[ErrorBoundary]', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const errorMsg = this.state.error?.message || '';
      const isChunkError =
        errorMsg.includes('Failed to fetch dynamically imported module') ||
        errorMsg.includes('Importing a module script failed') ||
        errorMsg.includes('Loading chunk') ||
        errorMsg.includes('dynamically imported module') ||
        this.state.error?.name === 'ChunkLoadError';

      return (
        <div
          style={{
            padding: '36px 20px',
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            background: 'rgba(17, 20, 18, 0.9)',
            border: `1px solid ${isChunkError ? 'rgba(46, 229, 122, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: '16px',
            margin: '20px 0',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
          }}
        >
          <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>
            {isChunkError ? '🛡️' : '⚠️'}
          </div>
          <p
            style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              color: isChunkError ? 'var(--color-primary, #2EE57A)' : '#ef4444',
              marginBottom: '6px',
            }}
          >
            {isChunkError ? 'Nueva Versión del Club Disponible' : 'Este módulo no pudo cargar'}
          </p>
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--color-text-muted)',
              marginBottom: '18px',
              maxWidth: '460px',
              margin: '0 auto 18px',
              lineHeight: 1.5,
            }}
          >
            {isChunkError
              ? 'Se acaba de desplegar una actualización con nuevos módulos y mejoras. Para sincronizar tu fortaleza y ver los cambios, recarga la aplicación.'
              : errorMsg || 'Error desconocido al cargar el componente.'}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={this.handleReload}
              className="btn-primary"
              style={{
                padding: '9px 24px',
                fontSize: '0.82rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              🔄 {isChunkError ? 'Cargar Nueva Versión' : 'Recargar Página'}
            </button>
            <button
              onClick={this.handleReset}
              className="btn-outline"
              style={{ padding: '9px 18px', fontSize: '0.82rem' }}
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
