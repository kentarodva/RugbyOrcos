import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('AuthContext — Fix #13: repairProfile para user_profiles huérfanos', () => {
  let source;

  beforeAll(() => {
    source = readFileSync(
      resolve(__dirname, '..', '..', 'context', 'AuthContext.jsx'),
      'utf-8'
    );
  });

  it('contiene la función repairProfile', () => {
    expect(source).toContain('repairProfile');
  });

  it('busca perfil huérfano por display_name cuando falla user_id', () => {
    expect(source).toContain('display_name');
    expect(source).toContain('ilike');
  });

  it('hace UPDATE del user_id cuando encuentra perfil huérfano', () => {
    expect(source).toContain('.update({ user_id:');
  });

  it('fetchProfile llama a repairProfile como fallback', () => {
    // fetchProfile debe intentar repairProfile si la búsqueda por user_id falla
    const fetchProfileIndex = source.indexOf('const fetchProfile');
    const repairProfileCall = source.indexOf('repairProfile', fetchProfileIndex);
    expect(repairProfileCall).toBeGreaterThan(fetchProfileIndex);
  });
});
