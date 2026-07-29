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

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)',
          border: '1px solid var(--border-glass)', borderRadius: '12px', margin: '20px 0',
        }}>
          <p style={{ fontSize: '1rem', fontWeight: 700, color: '#ef4444', marginBottom: '8px' }}>
            ⚠️ Este módulo no pudo cargar
          </p>
          <p style={{ fontSize: '0.75rem', marginBottom: '16px' }}>
            {this.state.error?.message || 'Error desconocido al cargar el componente.'}
          </p>
          <button onClick={() => this.setState({ hasError: false })}
            className="btn-neon" style={{ padding: '8px 20px', fontSize: '0.8rem' }}>
            🔄 Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
