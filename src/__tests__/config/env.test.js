import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envExamplePath = resolve(__dirname, '..', '..', '..', '.env.example');

describe('.env.example — Fix #1: sin credenciales reales', () => {
  let content;

  beforeAll(() => {
    content = readFileSync(envExamplePath, 'utf-8');
  });

  it('no contiene la URL real de Supabase', () => {
    expect(content).not.toContain('qtvmqlbjcotvbzuwanjs');
  });

  it('no contiene tokens JWT reales', () => {
    expect(content).not.toMatch(/eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/);
  });
});
