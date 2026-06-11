import { describe, it, expect } from 'vitest';
import {
  filterMessage,
  sanitizeAndFormatAI,
  isRugbyRelated,
  getRugbyScore,
  isValidRugbyExercise,
} from '../../engine/contentFilter';

describe('isRugbyRelated — edge cases', () => {
  it('texto vacío no es rugby', () => {
    expect(isRugbyRelated('')).toBe(false);
    expect(isRugbyRelated(null)).toBe(false);
    expect(isRugbyRelated(undefined)).toBe(false);
  });

  it('solo números no es rugby', () => {
    expect(isRugbyRelated('12345')).toBe(false);
  });

  it('palabra suelta "orcos" es rugby', () => {
    expect(isRugbyRelated('orcos')).toBe(true);
  });

  it('frase larga con keyword rugby funciona', () => {
    expect(isRugbyRelated('quiero mejorar mi tackle en los entrenamientos de rugby')).toBe(true);
  });

  it('contiene palabra prohibida incluso con rugby', () => {
    expect(isRugbyRelated('política en el rugby')).toBe(false);
  });

  it('mensaje SQL injection no es rugby', () => {
    expect(isRugbyRelated("'; DROP TABLE players; --")).toBe(false);
  });

  it('contiene HTML tag no es rugby', () => {
    expect(isRugbyRelated('<script>alert("xss")</script>')).toBe(false);
  });

  it('contiene url no es rugby', () => {
    expect(isRugbyRelated('visita http://malicious.com')).toBe(false);
  });
});

describe('filterMessage — security & edge cases', () => {
  it('bloquea HTML injection directo', () => {
    const r = filterMessage('<script>alert("xss")</script>');
    expect(r.allowed).toBe(false);
    expect(r.score).toBe(0);
  });

  it('bloquea SQL injection', () => {
    const r = filterMessage("'; DROP TABLE players; --");
    expect(r.allowed).toBe(false);
  });

  it('bloquea drogas incluso con rugby', () => {
    const r = filterMessage('drogas para mejorar rendimiento en rugby');
    expect(r.allowed).toBe(false);
  });

  it('bloquea política incluso con rugby', () => {
    const r = filterMessage('política en el rugby profesional');
    expect(r.allowed).toBe(false);
  });

  it('permite pregunta rugby con emoji', () => {
    const r = filterMessage('🏉 cómo mejorar el tackle?');
    expect(r.allowed).toBe(true);
    expect(r.score).toBeGreaterThan(0);
  });

  it('devuelve reason para mensaje vacío', () => {
    const r = filterMessage('');
    expect(r.reason).toContain('vacía');
  });

  it('devuelve reason para tema prohibido', () => {
    const r = filterMessage('drogas');
    expect(r.reason).toBeDefined();
  });

  it('devuelve score exacto para tackle scrum rugby', () => {
    const r = filterMessage('tackle y scrum en rugby');
    expect(r.score).toBeGreaterThanOrEqual(7);
    expect(r.allowed).toBe(true);
  });

  it('bloquea string vacío con score 0', () => {
    const r = filterMessage('');
    expect(r.score).toBe(0);
  });

  it('bloquea crypto mention', () => {
    const r = filterMessage('bitcoin rugby');
    expect(r.allowed).toBe(false);
  });
});

describe('getRugbyScore', () => {
  it('retorna 0 para null', () => { expect(getRugbyScore(null)).toBe(0); });
  it('retorna 0 para texto vacío', () => { expect(getRugbyScore('')).toBe(0); });
  it('retorna 0 para texto no rugby', () => { expect(getRugbyScore('hola mundo')).toBe(0); });
  it('retorna 3 para "rugby"', () => { expect(getRugbyScore('rugby')).toBe(3); });
  it('retorna 2 para "tackle"', () => { expect(getRugbyScore('tackle')).toBe(2); });
  it('suma pesos de múltiples keywords', () => {
    expect(getRugbyScore('tackle scrum rugby')).toBeGreaterThanOrEqual(7);
  });
  it('case insensitive', () => {
    expect(getRugbyScore('Rugby Tackle')).toBeGreaterThanOrEqual(5);
  });
  it('peso 3 para world rugby', () => {
    expect(getRugbyScore('world rugby')).toBeGreaterThanOrEqual(6);
  });
});

describe('isValidRugbyExercise', () => {
  it('rechaza null', () => { expect(isValidRugbyExercise(null)).toBe(false); });
  it('rechaza undefined', () => { expect(isValidRugbyExercise()).toBe(false); });
  it('rechaza sin nombre', () => { expect(isValidRugbyExercise({ categoria: 'campo' })).toBe(false); });
  it('rechaza categoria inválida', () => {
    expect(isValidRugbyExercise({ nombre: 'tackle', categoria: 'natacion' })).toBe(false);
  });
  it('rechaza ejercicio sin keyword', () => {
    expect(isValidRugbyExercise({ nombre: 'carrera', categoria: 'campo' })).toBe(false);
  });
  it('acepta tackle campo', () => {
    expect(isValidRugbyExercise({ nombre: 'tackle técnico', categoria: 'campo' })).toBe(true);
  });
  it('acepta sentadilla gym', () => {
    expect(isValidRugbyExercise({ nombre: 'sentadilla profunda', categoria: 'gym' })).toBe(true);
  });
  it('acepta estiramiento recuperacion', () => {
    expect(isValidRugbyExercise({ nombre: 'estiramiento', categoria: 'recuperacion' })).toBe(true);
  });
  it('case insensitive en nombre', () => {
    expect(isValidRugbyExercise({ nombre: 'Tackle Alto', categoria: 'campo' })).toBe(true);
  });
});

describe('sanitizeAndFormatAI — XSS', () => {
  it('escapa tags HTML', () => {
    const r = sanitizeAndFormatAI('<img src=x onerror=alert(1)>');
    expect(r).not.toContain('<img');
    expect(r).toContain('&lt;img');
  });

  it('escapa <script> en bold', () => {
    const r = sanitizeAndFormatAI('**<script>alert(1)</script>**');
    expect(r).not.toContain('<script>');
    expect(r).toContain('&lt;script&gt;');
    expect(r).toContain('<strong>');
  });

  it('convierte **bold** a <strong>', () => {
    const r = sanitizeAndFormatAI('**tackle**');
    expect(r).toContain('<strong>');
  });

  it('convierte *italic* a <em>', () => {
    const r = sanitizeAndFormatAI('*scrum*');
    expect(r).toContain('<em>');
  });

  it('convierte guion a bullet', () => {
    const r = sanitizeAndFormatAI('- tackle');
    expect(r).toContain('•');
  });

  it('escapa & antes de convertir', () => {
    const r = sanitizeAndFormatAI('**A & B**');
    expect(r).toContain('&amp;');
    expect(r).toContain('<strong>');
  });

  it('retorna string vacío para null', () => {
    expect(sanitizeAndFormatAI(null)).toBe('');
  });

  it('retorna string vacío para undefined', () => {
    expect(sanitizeAndFormatAI()).toBe('');
  });

  it('no rompe con backticks', () => {
    const r = sanitizeAndFormatAI('código `const x = 1` en rugby');
    expect(r).toContain('const x = 1');
  });

  it('escapa comillas dobles', () => {
    const r = sanitizeAndFormatAI('dijo "hola"');
    expect(r).toContain('&quot;');
  });

  it('escapa comillas simples', () => {
    const r = sanitizeAndFormatAI("dijo 'hola'");
    expect(r).toContain('&#039;');
  });
});
