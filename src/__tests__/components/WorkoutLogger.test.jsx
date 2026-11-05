import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import WorkoutLogger from '../../components/WorkoutLogger';

const showToast = vi.fn();
vi.mock('../../context/ToastContext', () => ({ useToast: () => ({ showToast }) }));
vi.mock('../../engine/trainingPlanService', () => ({ completePlan: vi.fn() }));
vi.mock('../../engine/progressCoach', () => ({ analyzeProgress: () => null }));
vi.mock('../../utils/haptics', () => ({ vibrateWhistle: vi.fn() }));
vi.mock('../../utils/rugbyAudio', () => ({ playRugbyWhistle: vi.fn() }));
vi.mock('../../services/trainingService', () => ({ getExerciseCatalog: vi.fn().mockResolvedValue([]), getExerciseByCode: vi.fn() }));

const gymPlan = { id: 'p1', plan: { gym: [{ id: 'sq', name: 'Sentadilla', sets: 2, reps: 5, oneRMWeight: 120 }] } };
const lastSession = [{ category: 'gym', exerciseLogs: [{ exerciseId: 'sq', name: 'Sentadilla', setLogs: [
  { type: 'normal', weight: 100, reps: 5, done: true },
  { type: 'normal', weight: 100, reps: 4, done: true },
] }] }];

const setup = (workoutLog = []) => {
  const logWorkout = vi.fn().mockResolvedValue();
  render(<WorkoutLogger player={{ id: 'kennent.vergara', workoutLog }} logWorkout={logWorkout} myTrainingPlan={gymPlan} />);
  return { logWorkout };
};

describe('WorkoutLogger — registro por serie (gimnasio)', () => {
  it('muestra una fila por serie prescrita con la columna ANTERIOR', () => {
    setup(lastSession);
    expect(screen.getByRole('textbox', { name: 'Kg serie 1' })).toHaveAttribute('placeholder', '100');
    expect(screen.getByRole('textbox', { name: 'Kg serie 2' })).toBeInTheDocument();
    expect(screen.getByText('100×5')).toBeInTheDocument();
    expect(screen.getByText('100×4')).toBeInTheDocument();
  });

  it('marcar ✓ en una fila vacía adopta los valores anteriores e inicia el descanso', () => {
    setup(lastSession);
    fireEvent.click(screen.getByRole('button', { name: 'Marcar serie 1 como hecha' }));
    expect(screen.getByRole('textbox', { name: 'Kg serie 1' })).toHaveValue('100');
    expect(screen.getByRole('timer')).toBeInTheDocument();
  });

  it('superar la marca anterior muestra 🔥 Récord', () => {
    setup(lastSession);
    fireEvent.change(screen.getByRole('textbox', { name: 'Kg serie 1' }), { target: { value: '102,5' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Reps serie 1' }), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Marcar serie 1 como hecha' }));
    expect(screen.getByText('🔥 Récord')).toBeInTheDocument();
  });

  it('una serie de calentamiento no inicia el descanso y se guarda aparte', async () => {
    const { logWorkout } = setup();
    fireEvent.click(screen.getByRole('button', { name: /Serie 1: Efectiva/ })); // → calentamiento
    fireEvent.change(screen.getByRole('textbox', { name: 'Kg serie C' }), { target: { value: '60' } });
    fireEvent.click(screen.getByRole('button', { name: 'Marcar serie C como hecha' }));
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Kg serie 1' }), { target: { value: '110' } });
    fireEvent.click(screen.getByRole('button', { name: 'Marcar serie 1 como hecha' }));
    fireEvent.click(screen.getByRole('button', { name: /Guardar Sesión/ }));

    await waitFor(() => expect(logWorkout).toHaveBeenCalledTimes(1));
    const [, payload] = logWorkout.mock.calls[0];
    expect(payload.exerciseLogs[0]).toMatchObject({ name: 'Sentadilla', sets: 1, warmupSets: 1, reps: 5, weight: 110 });
    expect(payload.exerciseLogs[0].setLogs).toEqual([
      { type: 'warmup', weight: 60, reps: 5, done: true },
      { type: 'normal', weight: 110, reps: 5, done: true },
    ]);
  });

  it('añadir serie copia la anterior', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Añadir serie/ }));
    expect(screen.getByRole('textbox', { name: 'Reps serie 3' })).toHaveValue('5');
  });

  it('el Rest Timer manual respeta el preset elegido', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: '2:00' }));
    fireEvent.click(screen.getByRole('button', { name: /Iniciar descanso de 2:00/ }));
    expect(screen.getByRole('timer')).toHaveTextContent('2:00');
    fireEvent.click(screen.getByRole('button', { name: /Saltar descanso/ }));
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
  });
});

describe('WorkoutLogger — ejercicios de campo', () => {
  it('modo simple: sin tabla de series ni peso', () => {
    const fieldPlan = { id: 'p2', plan: { campo: [{ id: 'pase', name: 'Pase en carrera', sets: 3, reps: 10 }] } };
    render(<WorkoutLogger player={{ id: 'x', workoutLog: [] }} logWorkout={vi.fn()} myTrainingPlan={fieldPlan} />);
    expect(screen.queryByRole('table', { name: 'Series' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Series' })).toHaveValue('3');
  });
});

describe('WorkoutLogger — Ver técnica', () => {
  it('un drill sin equivalente en el catálogo muestra los pasos numerados', async () => {
    const fieldPlan = { id: 'p3', plan: { campo: [{ id: 'pase', name: 'Pase en carrera', sets: 3, reps: 10, drills: ['Recibe a la altura del pecho', 'Pasa con las dos manos'] }] } };
    render(<WorkoutLogger player={{ id: 'x', workoutLog: [] }} logWorkout={vi.fn()} myTrainingPlan={fieldPlan} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver técnica de Pase en carrera' }));
    const dialog = await screen.findByRole('dialog', { name: 'Técnica: Pase en carrera' });
    expect(await within(dialog).findByText('Pasa con las dos manos')).toBeInTheDocument();
  });
});
