import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { NetworkBadge } from '../../components/NetworkBadge';

describe('NetworkBadge', () => {
  it('renderiza estado online por defecto', () => {
    render(<NetworkBadge />);
    expect(screen.getByText('EN LÍNEA')).toBeInTheDocument();
  });

  it('cambia a modo cancha cuando se dispara evento offline', () => {
    render(<NetworkBadge />);
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByText('MODO CANCHA')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(screen.getByText('EN LÍNEA')).toBeInTheDocument();
  });
});
