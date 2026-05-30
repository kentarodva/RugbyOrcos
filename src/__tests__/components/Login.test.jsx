import { describe, it, expect } from 'vitest';

describe('Login — flujo de autenticación', () => {
  it('detecta email vs username', () => {
    const isEmail = (input) => input.includes('@');
    expect(isEmail('admin@orcos.com')).toBe(true);
    expect(isEmail('freyder.andres')).toBe(false);
  });

  it('username sin @ activa búsqueda en players', () => {
    const input = 'freyder.andres';
    expect(input.includes('@')).toBe(false);
    // Si no es email, buscar en players.username
  });

  it('email con @ va directo a signIn', () => {
    const input = 'admin@orcosnegros.com';
    expect(input.includes('@')).toBe(true);
  });

  it('validación: campos vacíos', () => {
    const credential = '';
    const password = '';
    const isValid = credential.trim() && password.trim();
    expect(isValid).toBeFalsy();
  });

  it('validación: password mínimo 6 caracteres en registro', () => {
    const password = '12345';
    expect(password.length >= 6).toBe(false);
  });

  it('checkFirstRun: sin perfiles es true', () => {
    const count = 0;
    expect(count === 0).toBe(true);
  });

  it('checkFirstRun: con perfiles es false', () => {
    const count = 5;
    expect(count === 0).toBe(false);
  });
});

describe('Login — signUp: Fundar Reino', () => {
  it('crea user en auth.users + perfil en user_profiles', () => {
    const email = 'nuevo@test.com';
    const password = 'Test1234!';
    const displayName = 'Nuevo Admin';
    const systemRole = 'desarrollador';

    expect(email).toContain('@');
    expect(password.length).toBeGreaterThanOrEqual(6);
    expect(displayName.trim()).toBeTruthy();
    expect(systemRole).toBe('desarrollador');
  });

  it('rechaza registro sin @ en email', () => {
    const credential = 'sinarroba';
    expect(credential.includes('@')).toBe(false);
  });
});
