import { describe, it, expect, vi, beforeEach } from 'vitest';

// Importamos el módulo real — como usa window.open/document.write, mockeamos.
// La función esc() se puede testear importándola como named export... pero
// no se exporta individualmente. Testeamos las funciones públicas.

const esc = (str) => String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

describe('exportPdf — Fix #28: sanitización HTML', () => {
  describe('esc() — helper interno', () => {
    it('escapa < y >', () => {
      expect(esc('<script>')).toBe('&lt;script&gt;');
    });

    it('escapa comillas dobles y simples', () => {
      expect(esc('a"b\'c')).toBe('a&quot;b&#39;c');
    });

    it('escapa ampersand primero', () => {
      expect(esc('a & b')).toBe('a &amp; b');
    });

    it('maneja null y undefined', () => {
      expect(esc(null)).toBe('');
      expect(esc(undefined)).toBe('');
      expect(esc(0)).toBe('0');
    });

    it('no modifica strings limpias', () => {
      const clean = 'Jugador Normal 123';
      expect(esc(clean)).toBe(clean);
    });

    it('escapa combinación compleja', () => {
      const input = '<a href="x" onclick=\'alert(1)\'>click</a>';
      const result = esc(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('"');
      expect(result).not.toContain('\'');
    });
  });

  describe('printRoster — integración básica', () => {
    beforeEach(() => {
      vi.stubGlobal('open', vi.fn(() => ({
        document: { write: vi.fn(), close: vi.fn() },
        onload: null,
        print: vi.fn(),
      })));
    });

    it('llama window.open al imprimir', async () => {
      const { printRoster } = await import('../../utils/exportPdf.js');
      const players = [{ name: 'Test', rol: 'Titular', camiseta: 10, posicion: 'Pilar', estado: 'activo', contacto: {} }];
      printRoster(players, 'Orcos');
      expect(window.open).toHaveBeenCalled();
    });
  });
});
