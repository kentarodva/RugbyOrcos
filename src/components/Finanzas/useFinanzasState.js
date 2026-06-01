import { useState, useMemo, useCallback } from 'react';
import { MENSUALIDAD_BASE, ABONOS_RAPIDOS } from './constants';

export function useFinanzasState({ finances, players, activeTeam, addFinanceRecord, recordMembershipPayment, updateInventoryItem, showToast }) {
  const [activeSubTab, setActiveSubTab] = useState('finances');
  const [financeSubTab, setFinanceSubTab] = useState('caja');
  const [showAddForm, setShowAddForm] = useState(false);
  const [finDesc, setFinDesc] = useState('');
  const [finAmount, setFinAmount] = useState('');
  const [finType, setFinType] = useState('ingreso');
  const [finCategory, setFinCategory] = useState('general');
  const [finDate, setFinDate] = useState(new Date().toISOString().split('T')[0]);
  const [customAbono, setCustomAbono] = useState('');

  const teamFinances = useMemo(
    () => finances.filter(f => f.teamCategory === activeTeam),
    [finances, activeTeam]
  );

  const teamPlayers = useMemo(
    () => players.filter(p => p.teamCategory === activeTeam),
    [players, activeTeam]
  );

  const totalIncomes = useMemo(
    () => teamFinances.filter(f => f.type === 'ingreso').reduce((sum, item) => sum + Number(item.amount), 0),
    [teamFinances]
  );

  const totalExpenses = useMemo(
    () => teamFinances.filter(f => f.type === 'egreso').reduce((sum, item) => sum + Number(item.amount), 0),
    [teamFinances]
  );

  const netBalance = totalIncomes - totalExpenses;

  const handleSaveMovement = useCallback((e) => {
    e.preventDefault();
    if (!finDesc || !finAmount) return;

    addFinanceRecord({
      desc: finDesc,
      amount: Number(finAmount),
      type: finType,
      date: finDate,
      category: finCategory
    });

    setFinDesc('');
    setFinAmount('');
    setFinType('ingreso');
    setFinCategory('general');
    setShowAddForm(false);
  }, [finDesc, finAmount, finType, finDate, finCategory, addFinanceRecord]);

  const handlePayMembership = useCallback((player, amount) => {
    recordMembershipPayment(player.id, amount);
    showToast(`${amount.toLocaleString()} para ${player.name} registrado.`, 'success');
    setCustomAbono('');
  }, [recordMembershipPayment, showToast]);

  const handleCustomAbono = useCallback((player, e) => {
    e.preventDefault();
    const amount = Number(customAbono);
    if (!amount || amount <= 0) {
      showToast('Ingresa un monto valido.', 'warning');
      return;
    }
    handlePayMembership(player, amount);
  }, [customAbono, handlePayMembership, showToast]);

  const getMembershipStatus = useCallback((player) => {
    const m = player.memberships || { paid: 0, due: MENSUALIDAD_BASE };
    const due = m.due > 0 ? m.due : MENSUALIDAD_BASE;
    const paid = m.paid || 0;

    if (paid >= due) return { label: 'AL DIA', color: 'var(--color-primary)', bg: 'rgba(0, 230, 118, 0.08)' };
    if (paid > 0 && paid < due - 2000) return { label: 'PAGO PARCIAL', color: 'var(--color-gold)', bg: 'rgba(255, 179, 0, 0.08)' };
    if (paid > 0) return { label: 'CASI AL DIA', color: 'var(--color-blue)', bg: 'rgba(64, 196, 255, 0.08)' };
    return { label: 'MOROSO', color: 'var(--color-red)', bg: 'rgba(255, 61, 0, 0.06)' };
  }, []);

  const handleStockChange = useCallback((itemId, currentTotal, diff) => {
    const newTotal = Math.max(0, currentTotal + diff);
    updateInventoryItem(itemId, { total: newTotal });
  }, [updateInventoryItem]);

  const handleCustodianChange = useCallback((itemId, assignedTo) => {
    updateInventoryItem(itemId, { assignedTo });
  }, [updateInventoryItem]);

  const handleStatusChange = useCallback((itemId, status) => {
    updateInventoryItem(itemId, { status });
  }, [updateInventoryItem]);

  return {
    activeSubTab, setActiveSubTab,
    financeSubTab, setFinanceSubTab,
    showAddForm, setShowAddForm,
    finDesc, setFinDesc,
    finAmount, setFinAmount,
    finType, setFinType,
    finCategory, setFinCategory,
    finDate, setFinDate,
    customAbono, setCustomAbono,
    teamFinances,
    teamPlayers,
    totalIncomes,
    totalExpenses,
    netBalance,
    handleSaveMovement,
    handlePayMembership,
    handleCustomAbono,
    getMembershipStatus,
    handleStockChange,
    handleCustodianChange,
    handleStatusChange,
    ABONOS_RAPIDOS,
    MENSUALIDAD_BASE
  };
}
