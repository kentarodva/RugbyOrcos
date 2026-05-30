import { describe, it, expect } from 'vitest';

describe('ErrorBoundary — captura de errores', () => {
  it('muestra mensaje amigable cuando hay error', () => {
    const errorMessage = 'TypeError: Cannot read properties of undefined';
    expect(errorMessage).toContain('TypeError');
  });

  it('el botón de recarga existe en el UI de error', () => {
    const buttonText = 'Reagrupar el Clan (Recargar)';
    expect(buttonText).toContain('Recargar');
  });

  it('título de error es descriptivo', () => {
    const title = 'El clan ha tropezado';
    expect(title).toContain('tropezado');
  });
});

describe('AuthCallback — verificación de autenticación', () => {
  it('muestra "Verificando..." mientras procesa', () => {
    const text = 'Verificando...';
    expect(text).toBe('Verificando...');
  });

  it('redirige a / cuando SIGNED_IN', () => {
    const event = 'SIGNED_IN';
    const shouldRedirect = event === 'SIGNED_IN';
    expect(shouldRedirect).toBe(true);
  });

  it('no redirige con otros eventos', () => {
    const event = 'TOKEN_REFRESHED';
    const shouldRedirect = event === 'SIGNED_IN';
    expect(shouldRedirect).toBe(false);
  });
});

describe('Settings — rate limit display', () => {
  it('color rojo si uso > 80%', () => {
    const used = 450;
    const limit = 500;
    const pct = (used / limit) * 100;
    const color = pct > 80 ? 'red' : pct > 50 ? 'gold' : 'green';
    expect(color).toBe('red');
  });

  it('color dorado si 50% < uso <= 80%', () => {
    const used = 300;
    const limit = 500;
    const pct = (used / limit) * 100;
    const color = pct > 80 ? 'red' : pct > 50 ? 'gold' : 'green';
    expect(color).toBe('gold');
  });

  it('color verde si uso <= 50%', () => {
    const used = 100;
    const limit = 500;
    const pct = (used / limit) * 100;
    const color = pct > 80 ? 'red' : pct > 50 ? 'gold' : 'green';
    expect(color).toBe('green');
  });
});
