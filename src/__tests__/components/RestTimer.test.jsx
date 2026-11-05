import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import RestTimer, { formatRest, stepWeight, REST_PRESETS } from '../../components/workout/RestTimer';

vi.mock('../../utils/haptics', () => ({ vibrateWhistle: vi.fn() }));
vi.mock('../../utils/rugbyAudio', () => ({ playRugbyWhistle: vi.fn() }));

describe('formatRest', () => {
  it('formatea segundos como m:ss', () => {
    expect(formatRest(90)).toBe('1:30');
    expect(formatRest(5)).toBe('0:05');
    expect(formatRest(0)).toBe('0:00');
  });
  it('nunca muestra negativos', () => {
    expect(formatRest(-12)).toBe('0:00');
  });
});

describe('stepWeight', () => {
  it('suma y resta en pasos de 2.5 kg', () => {
    expect(stepWeight('100', 2.5)).toBe('102.5');
    expect(stepWeight('100', -2.5)).toBe('97.5');
  });
  it('parte del placeholder cuando el campo está vacío', () => {
    expect(stepWeight('', 2.5, 60)).toBe('62.5');
    expect(stepWeight('', 2.5)).toBe('2.5');
  });
  it('no baja de 0', () => {
    expect(stepWeight('1', -2.5)).toBe('0');
  });
});

describe('REST_PRESETS', () => {
  it('incluye los descansos estándar de fuerza', () => {
    expect(REST_PRESETS).toEqual([60, 90, 120, 180]);
  });
});

describe('<RestTimer />', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-05T10:00:00Z')); });
  afterEach(() => { vi.useRealTimers(); });

  const renderTimer = (props = {}) => {
    const handlers = { onAdjust: vi.fn(), onSkip: vi.fn(), onFinish: vi.fn() };
    const endsAt = Date.now() + 90_000;
    render(<RestTimer endsAt={endsAt} total={90} label="Sentadilla" {...handlers} {...props} />);
    return handlers;
  };

  it('muestra la cuenta regresiva y el ejercicio', () => {
    renderTimer();
    expect(screen.getByRole('timer')).toHaveTextContent('1:30');
    expect(screen.getByText(/Sentadilla/)).toBeInTheDocument();
  });

  it('descuenta con el tiempo real', () => {
    renderTimer();
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(screen.getByRole('timer')).toHaveTextContent('1:00');
  });

  it('ajusta ±15 s y permite saltar', () => {
    const h = renderTimer();
    fireEvent.click(screen.getByRole('button', { name: /sumar 15/i }));
    fireEvent.click(screen.getByRole('button', { name: /restar 15/i }));
    fireEvent.click(screen.getByRole('button', { name: /saltar/i }));
    expect(h.onAdjust).toHaveBeenNthCalledWith(1, 15);
    expect(h.onAdjust).toHaveBeenNthCalledWith(2, -15);
    expect(h.onSkip).toHaveBeenCalledTimes(1);
  });

  it('dispara onFinish una sola vez al llegar a 0', () => {
    const h = renderTimer();
    act(() => { vi.advanceTimersByTime(95_000); });
    expect(h.onFinish).toHaveBeenCalledTimes(1);
  });
});
