import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { supabase } from '../../../supabaseClient.js';

vi.mock('../../../supabaseClient.js', () => {
  const mockChain = () => {
    const p = Promise.resolve({ data: [], error: null });
    const chain = {
      select: vi.fn(() => chain),
      insert: vi.fn(() => chain),
      upsert: vi.fn(() => chain),
      update: vi.fn(() => chain),
      delete: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      order: vi.fn(() => chain),
      range: vi.fn(() => chain),
      single: vi.fn(() => chain),
      in: vi.fn(() => chain),
      then: p.then.bind(p),
      catch: p.catch.bind(p),
      finally: p.finally.bind(p),
    };
    return chain;
  };
  return {
    supabase: { from: vi.fn(() => mockChain()) },
  };
});

import { useFundraising } from '../../../context/hooks/useFundraising';

describe('useFundraising', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('estado inicial vacío', () => {
    const { result } = renderHook(() => useFundraising('orcos_masculina_mayor', { id: 'u1' }));
    expect(result.current.campaigns).toEqual([]);
    expect(result.current.allPayments).toEqual([]);
  });

  it('loadCampaigns actualiza estado con datos del mock', async () => {
    const { result } = renderHook(() => useFundraising('orcos_masculina_mayor', { id: 'u1' }));
    await act(async () => { await result.current.loadCampaigns(); });
    expect(result.current.campaigns).toEqual([]);
  });

  it('addCampaign agrega campaña al estado local', async () => {
    const { result } = renderHook(() => useFundraising('orcos_masculina_mayor', { id: 'u1' }));
    await act(async () => {
      await result.current.addCampaign({ name: 'Rifa', type: 'raffle', ticket_price: 5000, total_tickets: 50 });
    });
    expect(result.current.campaigns).toHaveLength(1);
    expect(result.current.campaigns[0].name).toBe('Rifa');
    expect(result.current.campaigns[0].status).toBe('active');
    expect(result.current.campaigns[0].team_category).toBe('orcos_masculina_mayor');
  });

  it('deleteCampaign elimina campaña del estado', async () => {
    const { result } = renderHook(() => useFundraising('orcos_masculina_mayor', { id: 'u1' }));
    await act(async () => { await result.current.addCampaign({ name: 'Test', type: 'raffle' }); });
    expect(result.current.campaigns).toHaveLength(1);
    await act(async () => { await result.current.deleteCampaign(result.current.campaigns[0].id); });
    expect(result.current.campaigns).toHaveLength(0);
  });

  it('updateCampaign cambia status', async () => {
    const { result } = renderHook(() => useFundraising('orcos_masculina_mayor', { id: 'u1' }));
    await act(async () => { await result.current.addCampaign({ name: 'Test', type: 'raffle' }); });
    const id = result.current.campaigns[0].id;
    await act(async () => { await result.current.updateCampaign(id, { status: 'closed' }); });
    expect(result.current.campaigns[0].status).toBe('closed');
  });
});
