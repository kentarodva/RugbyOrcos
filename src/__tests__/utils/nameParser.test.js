import { describe, test, expect } from 'vitest';
import { parseFullName } from '../../utils/nameParser';

describe('parseFullName', () => {
  test('1 palabra: solo firstName', () => {
    expect(parseFullName('Pedro')).toEqual({
      firstName: 'Pedro', middleName: null, lastName: '', secondLastName: null
    });
  });

  test('2 palabras: first + last', () => {
    expect(parseFullName('Freyder Pérez')).toEqual({
      firstName: 'Freyder', middleName: null, lastName: 'Pérez', secondLastName: null
    });
  });

  test('3 palabras: first + 2 apellidos (Colombia)', () => {
    expect(parseFullName('Juan Pérez García')).toEqual({
      firstName: 'Juan', middleName: null, lastName: 'Pérez', secondLastName: 'García'
    });
  });

  test('4 palabras: first + middle + 2 apellidos', () => {
    expect(parseFullName('Kennt David Vergara Arroyo')).toEqual({
      firstName: 'Kennt', middleName: 'David', lastName: 'Vergara', secondLastName: 'Arroyo'
    });
  });

  test('5 palabras: first + middle joined + 2 apellidos', () => {
    expect(parseFullName('Ana María López García')).toEqual({
      firstName: 'Ana', middleName: 'María', lastName: 'López', secondLastName: 'García'
    });
  });

  test('6+ palabras: extras se unen al middle', () => {
    expect(parseFullName('Juan Carlos Andrés Pérez García')).toEqual({
      firstName: 'Juan', middleName: 'Carlos Andrés', lastName: 'Pérez', secondLastName: 'García'
    });
  });

  test('vacío: devuelve campos vacíos', () => {
    expect(parseFullName('')).toEqual({
      firstName: '', middleName: null, lastName: '', secondLastName: null
    });
  });

  test('null/undefined: devuelve campos vacíos', () => {
    expect(parseFullName(null)).toEqual({
      firstName: '', middleName: null, lastName: '', secondLastName: null
    });
    expect(parseFullName(undefined)).toEqual({
      firstName: '', middleName: null, lastName: '', secondLastName: null
    });
  });

  test('múltiples espacios: normaliza', () => {
    expect(parseFullName('  Kennent   David   Vergara   Arroyo  ')).toEqual({
      firstName: 'Kennent', middleName: 'David', lastName: 'Vergara', secondLastName: 'Arroyo'
    });
  });

  test('solo espacios: devuelve campos vacíos', () => {
    expect(parseFullName('   ')).toEqual({
      firstName: '', middleName: null, lastName: '', secondLastName: null
    });
  });

  test('tab y newlines: los trata como separadores', () => {
    expect(parseFullName('Kennt\tDavid\nVergara\r\nArroyo')).toEqual({
      firstName: 'Kennt', middleName: 'David', lastName: 'Vergara', secondLastName: 'Arroyo'
    });
  });
});
