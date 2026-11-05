import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AcademiaLeyesModal } from '../../components/CanchaTactica/AcademiaLeyesModal';
import { ToastProvider } from '../../context/ToastContext';

describe('AcademiaLeyesModal', () => {
  it('renderiza cabecera y pestañas de estudio', () => {
    render(
      <ToastProvider>
        <AcademiaLeyesModal onClose={vi.fn()} onAwardXp={vi.fn()} />
      </ToastProvider>
    );

    expect(screen.getByText(/Academia de Rugby & Leyes FCR/i)).toBeInTheDocument();
    expect(screen.getByText(/📖 Leyes & Faltas Didácticas/i)).toBeInTheDocument();
    expect(screen.getByText(/📝 Examen de Leyes/i)).toBeInTheDocument();
    expect(screen.getByText(/📜 Certificaciones World Rugby/i)).toBeInTheDocument();
  });

  it('permite cambiar a la pestaña de Certificaciones World Rugby', () => {
    render(
      <ToastProvider>
        <AcademiaLeyesModal onClose={vi.fn()} onAwardXp={vi.fn()} />
      </ToastProvider>
    );

    const certTabBtn = screen.getByText(/📜 Certificaciones World Rugby/i);
    fireEvent.click(certTabBtn);

    expect(screen.getByText(/Plataforma Oficial World Rugby Passport/i)).toBeInTheDocument();
    expect(screen.getByText(/Rugby Ready/i)).toBeInTheDocument();
    expect(screen.getByText(/Gestión de Conmociones Cerebrales/i)).toBeInTheDocument();
  });

  it('permite responder preguntas en el examen de leyes', () => {
    render(
      <ToastProvider>
        <AcademiaLeyesModal onClose={vi.fn()} onAwardXp={vi.fn()} />
      </ToastProvider>
    );

    const quizTabBtn = screen.getByText(/📝 Examen de Leyes/i);
    fireEvent.click(quizTabBtn);

    expect(screen.getByText(/Pregunta 1 de 5/i)).toBeInTheDocument();
    // Encuentra una opción y haz clic
    const option = screen.getByText(/Penal y Tarjeta Roja directa/i);
    fireEvent.click(option);

    expect(screen.getByText(/Explicación Oficial/i)).toBeInTheDocument();
  });
});
