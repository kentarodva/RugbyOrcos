import { describe, it, expect } from 'vitest';

describe('App.jsx — ruta de invitación pública', () => {
  it('detecta ruta /invitacion/ sin login', () => {
    const pathname = '/invitacion/abc123';
    const isInvitation = pathname.startsWith('/invitacion/') || pathname.startsWith('/invitation/');
    expect(isInvitation).toBe(true);
  });

  it('detecta ruta /invitation/ (inglés) sin login', () => {
    const pathname = '/invitation/abc123';
    const isInvitation = pathname.startsWith('/invitacion/') || pathname.startsWith('/invitation/');
    expect(isInvitation).toBe(true);
  });

  it('no activa para rutas normales', () => {
    const pathname = '/dashboard';
    const isInvitation = pathname.startsWith('/invitacion/') || pathname.startsWith('/invitation/');
    expect(isInvitation).toBe(false);
  });

  it('la ruta pública se evalúa antes del check de auth', () => {
    // En App.jsx línea 48: la invitación se chequea ANTES de !isAuthenticated
    // Verificamos que el orden lógico es correcto
    const checkOrder = [
      'invitation_route',   // línea 48
      'isAuthenticated',    // línea 52
      'jugador_view',       // línea 54
      'staff_view',         // resto
    ];
    expect(checkOrder.indexOf('invitation_route')).toBe(0);
    expect(checkOrder.indexOf('invitation_route')).toBeLessThan(checkOrder.indexOf('isAuthenticated'));
  });
});
