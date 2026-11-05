import { describe, it, expect, vi } from 'vitest';
import { generateRosterCsv, downloadRosterCsv } from '../../utils/exportRosterCsv';

describe('exportRosterCsv', () => {
  const mockPlayers = [
    {
      name: 'Carlos',
      last_name: 'Vergara',
      camiseta: 7,
      posicion: 'Tercera Línea Ala',
      cedula: '10203040',
      birth_date: '1998-05-12',
      health_insurance: 'Sura EPS',
      blood_type: 'O+',
      estado: 'activo'
    },
    {
      name: 'Santiago',
      last_name: 'Morales',
      camiseta: 10,
      posicion: 'Apertura',
      cedula: '99887766',
      birth_date: '2001-08-20',
      health_insurance: 'Sanitas',
      blood_type: 'A+',
      estado: 'activo'
    }
  ];

  it('genera CSV con BOM UTF-8 y encabezados reglamentarios', () => {
    const csv = generateRosterCsv(mockPlayers, 'Orcos Mayor Masculino');
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('N° Camiseta');
    expect(csv).toContain('Carlos');
    expect(csv).toContain('Vergara');
    expect(csv).toContain('Tercera Línea Ala');
    expect(csv).toContain('Sura EPS');
    expect(csv).toContain('Santiago');
  });

  it('descarga archivo sin errores', () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');
    const success = downloadRosterCsv(mockPlayers, 'Orcos_M18');
    expect(success).toBe(true);
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
  });
});
