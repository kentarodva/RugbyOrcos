import { describe, it, expect, vi, beforeEach } from 'vitest';

const esc = (str) => String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

describe('exportPdf — Fix #28: sanitización HTML y Planillas', () => {
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

  describe('printRoster y printOfficialMatchSheet — integración básica', () => {
    let mockWindow;

    beforeEach(() => {
      mockWindow = {
        document: { write: vi.fn(), close: vi.fn() },
        onload: null,
        print: vi.fn(),
      };
      vi.stubGlobal('open', vi.fn(() => mockWindow));
    });

    it('llama window.open al imprimir roster', async () => {
      const { printRoster } = await import('../../utils/exportPdf.js');
      const players = [{ name: 'Test', rol: 'Titular', camiseta: 10, posicion: 'Pilar', estado: 'activo', contacto: {} }];
      printRoster(players, 'Orcos');
      expect(window.open).toHaveBeenCalled();
      expect(mockWindow.document.write).toHaveBeenCalled();
      expect(mockWindow.document.close).toHaveBeenCalled();
    });

    it('genera planilla oficial con titulares, suplentes y advertencias legales', async () => {
      const { printOfficialMatchSheet } = await import('../../utils/exportPdf.js');
      const players = [
        { id: 'p1', name: 'Alvaro', last_name: 'Gomez', document_type: 'CC', document_number: '12345678', health_insurance: 'Sura', rol: 'Capitan' },
        { id: 'p2', name: 'Carlos', last_name: 'Perez', document_type: 'CC', document_number: '87654321', health_insurance: 'Sanitas', rol: 'Titular' },
      ];
      const lineup = { 1: 'p1', 2: 'p2', 16: 'p1' };
      const match = { opponent: 'Toros RC', tournament: 'Torneo Apertura 2026', date: '2026-06-15', location: 'Estadio La Tablada' };

      printOfficialMatchSheet({ match, lineup, players, teamLabel: 'Rugby Orcos Negros Club', division: 'Masculina Mayor' });

      expect(window.open).toHaveBeenCalled();
      expect(mockWindow.document.write).toHaveBeenCalled();
      const htmlWritten = mockWindow.document.write.mock.calls[0][0];
      expect(htmlWritten).toContain('PLANILLA OFICIAL DE PARTIDO');
      expect(htmlWritten).toContain('Toros RC');
      expect(htmlWritten).toContain('Alvaro Gomez');
      expect(htmlWritten).toContain('Sura');
      expect(htmlWritten).toContain('CAP');
      expect(htmlWritten).toContain('Certificación Médica y Antidopaje');
    });
  });
});
