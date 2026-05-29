import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch() {
    // Error registrado silenciosamente
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'var(--bg-dark)',
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            padding: '40px',
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ fontSize: '3rem' }}>🛡️</div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: 'var(--color-red)' }}>
              El clan ha tropezado
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
              Ha ocurrido un error inesperado en la aplicación. Tus datos permanecen seguros en el dispositivo.
            </p>
            <p style={{
              background: 'var(--bg-input)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              color: 'var(--color-red)',
              fontFamily: 'monospace',
              wordBreak: 'break-all'
            }}>
              {this.state.error?.message || 'Error desconocido'}
            </p>
            <button
              onClick={this.handleReload}
              className="btn-neon"
              style={{ justifyContent: 'center', marginTop: '10px' }}
            >
              Reagrupar el Clan (Recargar)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
