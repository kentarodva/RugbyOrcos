import { describe, it, expect } from 'vitest';
import {
  generateThirdTimeBannerBlob,
  generateThirdTimeWhatsAppText
} from '../../utils/exportThirdTimeBanner';

describe('exportThirdTimeBanner', () => {
  const match = {
    rival: 'Bogota Barbarians',
    score_orcos: 24,
    score_rival: 15,
    date: '2026-11-04'
  };

  const thirdTime = {
    orcos_mvp_name: 'Carlos Rivas',
    orcos_mvp_number: 8,
    orcos_mvp_pos: 'N° 8',
    rival_mvp_name: 'Santiago Pardo',
    rival_mvp_number: 10
  };

  it('genera texto de WhatsApp con ambos MVPs', () => {
    const text = generateThirdTimeWhatsAppText(match, thirdTime);
    expect(text).toContain('Carlos Rivas');
    expect(text).toContain('Santiago Pardo');
    expect(text).toContain('Bogota Barbarians');
    expect(text).toContain('Tercer Tiempo');
  });

  it('genera Blob de Canvas sin fallar', async () => {
    const blob = await generateThirdTimeBannerBlob(match, thirdTime);
    expect(blob).not.toBeNull();
  });
});
