import { describe, it, expect } from 'vitest';
import {
  formatHeightInputDisplay,
  parseHeightToCanonical,
  formatHeightM,
  formatWeightInputDisplay,
  parseWeightToCanonical,
  formatWeightKg,
  formatCopInputDisplay,
  parseCopToCanonical,
  formatCOP,
} from '../../utils/inputFormatters';

describe('inputFormatters — Altura (1,85M)', () => {
  it('convierte 185 (cm) automáticamente a 1,85 en visual y 1.85 en BD', () => {
    expect(formatHeightInputDisplay('185')).toBe('1,85');
    expect(parseHeightToCanonical('185')).toBe('1.85');
  });

  it('mantiene coma en visual para 1.85 o 1,85', () => {
    expect(formatHeightInputDisplay(1.85)).toBe('1,85');
    expect(formatHeightInputDisplay('1,85')).toBe('1,85');
    expect(parseHeightToCanonical('1,85')).toBe('1.85');
  });

  it('formatea lectura como 1,85M', () => {
    expect(formatHeightM(1.85)).toBe('1,85M');
    expect(formatHeightM('1.80')).toBe('1,80M');
    expect(formatHeightM(null)).toBe('—');
  });
});

describe('inputFormatters — Peso (KG)', () => {
  it('formatea decimales con coma y parsea a punto', () => {
    expect(formatWeightInputDisplay('85.5')).toBe('85,5');
    expect(parseWeightToCanonical('85,5')).toBe('85.5');
    expect(formatWeightKg(85.5)).toBe('85,5 KG');
    expect(formatWeightKg(85)).toBe('85 KG');
  });
});

describe('inputFormatters — Dinero ($ COP)', () => {
  it('formatea miles y extrae entero limpio', () => {
    expect(formatCopInputDisplay('120000')).toBe('120.000');
    expect(parseCopToCanonical('120.000')).toBe('120000');
    expect(formatCOP(120000)).toBe('$120.000 COP');
  });
});
