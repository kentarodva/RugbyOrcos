import { useState, useMemo, useCallback } from 'react';
import { MENSUALIDAD_BASE } from './constants';
import { membershipStatus } from '../../utils/membership';
import { useFilterByView } from '../../context/hooks/useFilterByView';
import { localDateKey } from '../../utils/agendaItems';

export function useFinanzasState({ finances, players, addFinanceRecord, recordMembershipPayment, updateInventoryItem, showToast, mensualidadBase }) {
  const [activeSubTab, setActiveSubTab] = useState('finances');
  const [financeSubTab, setFinanceSubTab] = useState('caja');
  const [showAddForm, setShowAddForm] = useState(false);
  const [finDesc, setFinDesc] = useState('');
  const [finAmount, setFinAmount] = useState('');
  const [finType, setFinType] = useState('ingreso');
  const [finCategory, setFinCategory] = useState('general');
  const [finDate, setFinDate] = useState(localDateKey());
  const filterByView = useFilterByView();

  const teamFinances = useMemo(
    () => filterByView(finances),
    [finances, filterByView]
  );

  const teamPlayers = useMemo(
    () => filterByView(players),
    [players, filterByView]
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

  const handlePayMembership = useCallback(async (player, amount) => {
    await recordMembershipPayment(player.id, amount);
    showToast(`${amount.toLocaleString()} para ${player.name} registrado.`, 'success');
  }, [recordMembershipPayment, showToast]);

  const getMembershipStatus = useCallback(
    (player) => membershipStatus(player, mensualidadBase || MENSUALIDAD_BASE),
    [mensualidadBase]
  );

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
    teamFinances,
    teamPlayers,
    totalIncomes,
    totalExpenses,
    netBalance,
    handleSaveMovement,
    handlePayMembership,
    getMembershipStatus,
    handleStockChange,
    handleCustodianChange,
    handleStatusChange,
    MENSUALIDAD_BASE
  };
}
