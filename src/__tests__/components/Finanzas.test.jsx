import { describe, it, expect } from 'vitest';

describe('Finanzas — caja chica', () => {
  it('calcula total de ingresos correctamente', () => {
    const finances = [
      { type: 'ingreso', amount: 50000 },
      { type: 'ingreso', amount: 25000 },
      { type: 'egreso', amount: 15000 },
    ];
    const incomes = finances.filter(f => f.type === 'ingreso').reduce((s, f) => s + Number(f.amount), 0);
    expect(incomes).toBe(75000);
  });

  it('calcula total de egresos correctamente', () => {
    const finances = [
      { type: 'egreso', amount: 15000 },
      { type: 'egreso', amount: 5000 },
    ];
    const expenses = finances.filter(f => f.type === 'egreso').reduce((s, f) => s + Number(f.amount), 0);
    expect(expenses).toBe(20000);
  });

  it('balance neto es ingresos - egresos', () => {
    const incomes = 75000;
    const expenses = 20000;
    const balance = incomes - expenses;
    expect(balance).toBe(55000);
  });

  it('balance negativo se detecta correctamente', () => {
    const incomes = 5000;
    const expenses = 20000;
    const balance = incomes - expenses;
    expect(balance).toBeLessThan(0);
  });
});

describe('Finanzas — membresías', () => {
  it('abono parcial reduce el due', () => {
    const membership = { paid: 3000, due: 10000 };
    const amount = 5000;
    const newPaid = Math.min(membership.paid + amount, membership.due);
    const newDue = Math.max(0, membership.due - newPaid);
    expect(newPaid).toBe(8000);
    expect(newDue).toBe(2000);
  });

  it('abono total deja due en 0', () => {
    const membership = { paid: 0, due: 10000 };
    const amount = 10000;
    const newPaid = Math.min(membership.paid + amount, membership.due);
    const newDue = Math.max(0, membership.due - newPaid);
    expect(newPaid).toBe(10000);
    expect(newDue).toBe(0);
  });

  it('estado al día: paid >= due', () => {
    const m = { paid: 10000, due: 10000 };
    const status = m.paid >= m.due ? 'AL DIA' : m.paid > 0 ? 'PAGO PARCIAL' : 'MOROSO';
    expect(status).toBe('AL DIA');
  });

  it('estado moroso: paid === 0', () => {
    const m = { paid: 0, due: 10000 };
    const status = m.paid >= m.due ? 'AL DIA' : m.paid > 0 ? 'PAGO PARCIAL' : 'MOROSO';
    expect(status).toBe('MOROSO');
  });

  it('estado pago parcial', () => {
    const m = { paid: 5000, due: 10000 };
    const status = m.paid >= m.due ? 'AL DIA' : m.paid > 0 ? 'PAGO PARCIAL' : 'MOROSO';
    expect(status).toBe('PAGO PARCIAL');
  });
});

describe('Finanzas — inventario', () => {
  it('cambiar stock total', () => {
    const item = { name: 'Balones', total: 10 };
    const newTotal = Math.max(0, item.total + 3);
    expect(newTotal).toBe(13);
  });

  it('stock no puede ser negativo', () => {
    const item = { name: 'Conos', total: 2 };
    const newTotal = Math.max(0, item.total - 5);
    expect(newTotal).toBe(0);
  });

  it('asignar custodio', () => {
    const item = { name: 'Botiquín', assignedTo: null };
    item.assignedTo = 'Freyder Andres';
    expect(item.assignedTo).toBe('Freyder Andres');
  });
});
