import { describe, it, expect } from 'vitest';
import {
  normalizeColombianPhone,
  buildWhatsAppUrl,
  buildDebtReminderText,
  buildPaymentReceiptText,
  buildCampaignGroupSummaryText,
  buildMatchAvailabilitySummaryText,
} from '../../utils/whatsappUtils';

describe('whatsappUtils', () => {
  it('normaliza números colombianos de 10 dígitos agregando 57', () => {
    expect(normalizeColombianPhone('300 123 4567')).toBe('573001234567');
    expect(normalizeColombianPhone('+57 315-987-6543')).toBe('573159876543');
    expect(normalizeColombianPhone('')).toBe('');
  });

  it('construye URLs de WhatsApp con o sin teléfono', () => {
    const withPhone = buildWhatsAppUrl('3001234567', 'Hola Orco');
    expect(withPhone).toBe('https://wa.me/573001234567?text=Hola%20Orco');

    const withoutPhone = buildWhatsAppUrl('', 'Hola Grupo');
    expect(withoutPhone).toBe('https://wa.me/?text=Hola%20Grupo');
  });

  it('genera recordatorio de deuda formateado en COP', () => {
    const msg = buildDebtReminderText({
      playerName: 'Kennent',
      concept: 'Uniformes 2026',
      amountDue: 120000,
      amountPaid: 50000,
      deadline: '2026-12-01',
    });
    expect(msg).toContain('Kennent');
    expect(msg).toContain('Uniformes 2026');
    expect(msg).toContain('120.000');
    expect(msg).toContain('70.000');
  });

  it('genera comprobante de abono formateado en COP', () => {
    const receipt = buildPaymentReceiptText({
      playerName: 'Kennent',
      concept: 'Rifa Viaje',
      amountPaidNow: 25000,
      totalPaid: 50000,
      totalDue: 50000,
      notes: 'Nequi',
    });
    expect(receipt).toContain('COMPROBANTE DE ABONO');
    expect(receipt).toContain('PAZ Y SALVO COMPLETO');
    expect(receipt).toContain('Nequi');
  });

  it('genera resumen de campaña para grupo de WhatsApp', () => {
    const summary = buildCampaignGroupSummaryText({
      campaign: { name: 'Kit Oficial', deadline: '2026-11-30' },
      assignments: [
        { player_id: 'p1', amount_due: 100000, amount_paid: 100000 },
        { player_id: 'p2', amount_due: 100000, amount_paid: 40000 },
      ],
      playerMap: {
        p1: { name: 'Thrall' },
        p2: { name: 'Grommash' },
      },
    });
    expect(summary).toContain('KIT OFICIAL');
    expect(summary).toContain('✅ Thrall');
    expect(summary).toContain('🟡 Grommash');
  });

  it('genera lista de convocatoria para partido futuro', () => {
    const text = buildMatchAvailabilitySummaryText({
      future: {
        opponent: 'Minotauros RC',
        date: '2026-11-15',
        time: '15:00',
        location: 'Cancha Marte',
        availabilities: { p1: 'going', p2: 'maybe', p3: 'not_going' },
      },
      teamPlayers: [
        { id: 'p1', name: 'Thrall', posicion: 'Octavo / N8' },
        { id: 'p2', name: 'Grommash' },
        { id: 'p3', name: 'Durotan' },
        { id: 'p4', name: 'Orgrim' },
      ],
    });
    expect(text).toContain('MINOTAUROS RC');
    expect(text).toContain('1. Thrall (Octavo / N8)');
    expect(text).toContain('Grommash');
    expect(text).toContain('Durotan');
    expect(text).toContain('Orgrim');
  });
});
