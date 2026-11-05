import { describe, it, expect } from 'vitest';
import { EVENT_TYPES, normalizeEventType, getEventTypeMeta } from '../../utils/eventTypes';

const DB_ALLOWED = ['entrenamiento', 'partido', 'evento', 'reunion'];

describe('eventTypes', () => {
  it('solo ofrece valores que acepta la restricción de la base de datos', () => {
    EVENT_TYPES.forEach(t => expect(DB_ALLOWED).toContain(t.value));
  });

  it("convierte el legado 'otro' (rechazado por la BD) en 'evento'", () => {
    expect(normalizeEventType('otro')).toBe('evento');
  });

  it('una reunión se etiqueta como Reunión, no como Entrenamiento', () => {
    expect(getEventTypeMeta('reunion').label).toBe('Reunión');
  });

  it('sin tipo asume entrenamiento; tipo desconocido cae en evento', () => {
    expect(normalizeEventType(undefined)).toBe('entrenamiento');
    expect(normalizeEventType('fiesta')).toBe('evento');
  });
});
