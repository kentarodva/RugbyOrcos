import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';
import { ToastProvider, useToast } from '../../context/ToastContext';

function ToastTrigger({ message, type }) {
  const { showToast } = useToast();
  return <button onClick={() => showToast(message, type)}>Show</button>;
}

describe('ToastContext — Fix #9: limpieza de timeouts', () => {
  it('muestra un toast y lo remueve tras 4 segundos', async () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Test toast" type="success" />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Show').click();
    });

    expect(screen.getByText('Test toast')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Test toast')).not.toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('limpia los timeouts cuando el provider se desmonta', () => {
    vi.useFakeTimers();
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
    vi.useRealTimers();
  });

  it('elimina toast inmediatamente al llamar removeToast clickeando', async () => {
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

    await waitFor(() => {
      expect(screen.queryByText('Clickeable')).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });
});
