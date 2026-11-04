import { describe, it, expect } from 'vitest';
import { handleError, wrapCatch } from '../../utils/errorHandler';

describe('handleError', () => {
  it('retorna objeto con error', () => {
    const r = handleError(new Error('test error'), 'Test');
    expect(r).toHaveProperty('error', 'test error');
  });

  it('string sin Error usa el mensaje directo', () => {
    const r = handleError('raw string', 'Test');
    expect(r).toHaveProperty('error');
  });

  it('rethrow lanza el error', () => {
    expect(() => handleError(new Error('boom'), 'Test', { rethrow: true })).toThrow('boom');
  });

  it('silent no previene retorno', () => {
    const r = handleError(new Error('silent'), 'Test', { silent: true });
    expect(r.error).toBe('silent');
  });
});

describe('wrapCatch', () => {
  it('retorna una función', () => {
    const w = wrapCatch('Test');
    expect(typeof w).toBe('function');
  });

  it('la función retornada maneja error', () => {
    const w = wrapCatch('Test');
    const r = w(new Error('wrapped'));
    expect(r.error).toBe('wrapped');
  });
});
