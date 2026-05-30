import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import React from 'react';
import { ToastProvider, useToast } from '../../context/ToastContext';

function ToastTrigger({ message, type }) {
  const { showToast } = useToast();
  return <button onClick={() => showToast(message, type)}>Show</button>;
}

describe('ToastContext — Fix #9: limpieza de timeouts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('muestra un toast y lo remueve tras 4 segundos', () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Test toast" type="success" />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Show').click();
    });

    expect(screen.getByText('Test toast')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByText('Test toast')).not.toBeInTheDocument();
  });

  it('limpia los timeouts cuando el provider se desmonta', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const { unmount } = render(
      <ToastProvider>
        <ToastTrigger message="Toast que sobrevive" type="info" />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Show').click();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('elimina toast inmediatamente al llamar removeToast clickeando', () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Clickeable" type="error" />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Show').click();
    });

    const toast = screen.getByText('Clickeable');
    expect(toast).toBeInTheDocument();

    act(() => {
      toast.click();
    });

    expect(screen.queryByText('Clickeable')).not.toBeInTheDocument();
  });
});
