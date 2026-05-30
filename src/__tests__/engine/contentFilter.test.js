import { describe, it, expect } from 'vitest';
import { filterMessage, sanitizeAndFormatAI } from '../../engine/contentFilter';

describe('contentFilter — Fix #8: palabras permitidas', () => {
  it('permite preguntas sobre el presidente del club', () => {
    const result = filterMessage('cuáles son las funciones del presidente del club de rugby');
    expect(result.allowed).toBe(true);
  });

  it('permite preguntas sobre código de conducta de rugby', () => {
    const result = filterMessage('cuál es el código de conducta de World Rugby');
    expect(result.allowed).toBe(true);
  });

  it('permite preguntas sobre entrenamiento', () => {
    const result = filterMessage('cómo entrenar tackle en el club');
    expect(result.allowed).toBe(true);
  });

  it('bloquea temas no relacionados (pizza)', () => {
    const result = filterMessage('cómo hacer una pizza napolitana');
    expect(result.allowed).toBe(false);
  });

  it('bloquea temas prohibidos (drogas)', () => {
    const result = filterMessage('drogas en el deporte profesional');
    expect(result.allowed).toBe(false);
  });

  it('bloquea preguntas vacías', () => {
    const result = filterMessage('');
    expect(result.allowed).toBe(false);
  });

  it('devuelve score > 0 para preguntas válidas', () => {
    const result = filterMessage('táctica de scrum en rugby');
    expect(result.score).toBeGreaterThan(0);
  });
});

describe('sanitizeAndFormatAI — Fix #14: XSS', () => {
  it('escapa tags <script> maliciosos', () => {
    const input = '<script>alert("hack")</script> texto normal';
    const result = sanitizeAndFormatAI(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
    expect(result).toContain('texto normal');
  });

  it('escapa tags <img onerror> maliciosos', () => {
    const input = '<img src=x onerror=alert(1)> rugby';
    const result = sanitizeAndFormatAI(input);
    expect(result).not.toContain('<img');
    expect(result).not.toContain('<img ');
    expect(result).toContain('&lt;img');
    expect(result).toContain('rugby');
  });

  it('convierte **negritas** a <strong>', () => {
    const result = sanitizeAndFormatAI('texto **importante** aquí');
    expect(result).toContain('<strong>importante</strong>');
  });

  it('convierte *cursiva* a <em>', () => {
    const result = sanitizeAndFormatAI('texto *enfatizado* aquí');
    expect(result).toContain('<em>enfatizado</em>');
  });

  it('convierte saltos de línea a <br/>', () => {
    const result = sanitizeAndFormatAI('línea 1\nlínea 2');
    expect(result).toContain('<br/>');
  });

  it('maneja texto vacío', () => {
    expect(sanitizeAndFormatAI('')).toBe('');
    expect(sanitizeAndFormatAI(null)).toBe('');
  });

  it('no rompe con entidades HTML ya escapadas', () => {
    const result = sanitizeAndFormatAI('usar &amp; en HTML');
    expect(result).toContain('usar &amp;amp;');
  });

  it('maneja strings con emojis sin crash', () => {
    const result = sanitizeAndFormatAI('🏉 rugby es **genial** 🛡️');
    expect(result).toContain('<strong>genial</strong>');
    expect(result).toContain('🏉');
    expect(result).toContain('🛡️');
  });

  it('maneja strings muy largas sin crash', () => {
    const longText = '🏉 rugby '.repeat(200) + '**fin**';
    const result = sanitizeAndFormatAI(longText);
    expect(result).toContain('<strong>fin</strong>');
  });

  it('escapa comillas dobles y simples', () => {
    const result = sanitizeAndFormatAI('valor="x" y \'y\'');
    expect(result).toContain('&quot;');
    expect(result).toContain('&#039;');
  });
});
