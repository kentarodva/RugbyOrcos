import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThirdTimeModal } from '../../components/CanchaTactica/ThirdTimeModal';
import { ToastProvider } from '../../context/ToastContext';

describe('ThirdTimeModal', () => {
  const mockMatch = {
    id: 'match-1',
    rival: 'Minotauros RFC',
    score_orcos: 22,
    score_rival: 10
  };

  const mockSquad = [
    { id: 'p-1', name: 'Carlos', last_name: 'Rivas', camiseta: 8, posicion: 'N° 8' },
    { id: 'p-2', name: 'Santiago', last_name: 'Morales', camiseta: 10, posicion: 'Apertura' }
  ];

  it('renderiza cabecera de tercer tiempo y campos de MVP', () => {
    render(
      <ToastProvider>
        <ThirdTimeModal
          match={mockMatch}
          squad={mockSquad}
          onSaveThirdTime={vi.fn()}
          onClose={vi.fn()}
        />
      </ToastProvider>
    );

    expect(screen.getByText(/Tercer Tiempo & MVP de la Batalla/i)).toBeInTheDocument();
    expect(screen.getByText(/MVP ORCOS NEGROS/i)).toBeInTheDocument();
    expect(screen.getByText(/MVP MINOTAUROS RFC/i)).toBeInTheDocument();
  });

  it('llama a onSaveThirdTime al pulsar Guardar Registro', () => {
    const onSave = vi.fn();
    render(
      <ToastProvider>
        <ThirdTimeModal
          match={mockMatch}
          squad={mockSquad}
          onSaveThirdTime={onSave}
          onClose={vi.fn()}
        />
      </ToastProvider>
    );

    const saveBtn = screen.getByText(/Guardar Registro/i);
    fireEvent.click(saveBtn);
    expect(onSave).toHaveBeenCalledWith('match-1', expect.objectContaining({
      orcos_mvp_id: 'p-1',
      awarded_xp: 150
    }));
  });
});
