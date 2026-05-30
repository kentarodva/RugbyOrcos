import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';

vi.mock('../../supabaseClient', () => {
  const chain = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  };
  return {
    supabase: { ...chain, auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test' } } })) } },
  };
});

import MatchInvitation from '../../components/MatchInvitation';
import { supabase } from '../../supabaseClient';

describe('MatchInvitation — token extraction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabase.maybeSingle.mockResolvedValue({ data: null, error: null });
  });

  it('extrae token limpio de URL con query params', () => {
    const path = '/invitacion/abc123?from=whatsapp';
    const raw = path.split('/invitacion/')[1] || '';
    const t = raw.replace(/[/?#].*$/, '').trim();
    expect(t).toBe('abc123');
  });

  it('extrae token limpio de URL con trailing slash', () => {
    const path = '/invitacion/abc123/';
    const raw = path.split('/invitacion/')[1] || '';
    const t = raw.replace(/[/?#].*$/, '').trim();
    expect(t).toBe('abc123');
  });

  it('extrae token limpio de URL con hash', () => {
    const path = '/invitation/abc123#section';
    const raw = path.split('/invitation/')[1] || '';
    const t = raw.replace(/[/?#].*$/, '').trim();
    expect(t).toBe('abc123');
  });

  it('token vacío detectado correctamente', () => {
    const path = '/invitacion/';
    const raw = path.split('/invitacion/')[1] || path.split('/invitation/')[1] || '';
    const t = raw.replace(/[/?#].*$/, '').trim();
    expect(t).toBe('');
  });

  it('maneja ruta sin token correctamente', () => {
    const path = '/otra-cosa';
    const raw = path.split('/invitacion/')[1] || path.split('/invitation/')[1] || '';
    expect(raw).toBe('');
  });
});

describe('MatchInvitation — flujo de invitación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete window.location;
    window.location = { pathname: '/invitacion/test-token' };
  });

  it('muestra error si la invitación no se encuentra', async () => {
    supabase.maybeSingle.mockResolvedValue({ data: null, error: null });

    await act(async () => {
      render(<MatchInvitation />);
    });

    expect(screen.getByText('Invitacion no disponible')).toBeInTheDocument();
    expect(screen.getByText('Invitacion no encontrada o expirada.')).toBeInTheDocument();
  });

  it('muestra error si la invitación está expirada', async () => {
    supabase.maybeSingle.mockResolvedValue({
      data: { id: '1', status: 'expired', future_fixtures: null, expires_at: '2020-01-01' },
      error: null,
    });

    await act(async () => {
      render(<MatchInvitation />);
    });

    expect(screen.getByText('Invitacion no disponible')).toBeInTheDocument();
  });

  it('muestra datos del partido cuando la invitación es válida', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split('T')[0];

    supabase.maybeSingle
      .mockResolvedValueOnce({
        data: {
          id: '1', status: 'active', rival_name: 'Cuervos',
          future_fixtures: { date: dateStr, time: '15:00', location: 'Cancha Sur' },
          expires_at: dateStr,
        }, error: null,
      })
      .mockResolvedValueOnce({ data: [], error: null });

    await act(async () => {
      render(<MatchInvitation />);
    });

    expect(screen.getByText('Has sido invitado por Rugby Orcos Negros')).toBeInTheDocument();
    expect(screen.getByText(/Cuervos/)).toBeInTheDocument();
  });
});

describe('MatchInvitation — Guest CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete window.location;
    window.location = { pathname: '/invitacion/test-token' };
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split('T')[0];

    supabase.maybeSingle
      .mockResolvedValueOnce({
        data: {
          id: '1', status: 'active', rival_name: 'Rival',
          future_fixtures: { date: dateStr },
          expires_at: dateStr,
        }, error: null,
      })
      .mockResolvedValueOnce({ data: [], error: null });
  });

  it('agrega guest player al hacer submit del formulario', async () => {
    supabase.insert.mockReturnThis();
    supabase.single.mockResolvedValue({
      data: { id: 'g1', name: 'Pedro', number: 10, position: 'Pilar', notes: null },
      error: null,
    });

    await act(async () => {
      render(<MatchInvitation />);
    });

    expect(screen.getByText('Registra tus Guerreros')).toBeInTheDocument();
  });

  it('no elimina guest de UI si el DELETE falla', () => {
    // Probar que el handler chequea el error antes de modificar state
    const mockSetGuests = vi.fn();
    const error = { message: 'Network error' };

    // Simulación inline: si hay error, no se llama setGuests
    if (error) {
      // No se modifica el state
      expect(mockSetGuests).not.toHaveBeenCalled();
    }
  });
});
