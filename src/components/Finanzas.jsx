import React, { useContext, useState } from 'react';
import { ClubContext, EQUIPOS_LABELS } from '../context/ClubContext';
import { printFinances } from '../utils/exportPdf.js';
import { useToast } from '../context/ToastContext';

const MENSUALIDAD_BASE = 10000;
const ABONOS_RAPIDOS = [2000, 5000, 10000];

function Finanzas() {
  const { finances, addFinanceRecord, players, activeTeam, inventory, updateInventoryItem, recordMembershipPayment } = useContext(ClubContext);
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState('finances');
  const [financeSubTab, setFinanceSubTab] = useState('caja');
  const [showAddForm, setShowAddForm] = useState(false);
  const [finDesc, setFinDesc] = useState('');
  const [finAmount, setFinAmount] = useState('');
  const [finType, setFinType] = useState('ingreso');
  const [finCategory, setFinCategory] = useState('general');
  const [finDate, setFinDate] = useState(new Date().toISOString().split('T')[0]);
  const [customAbono, setCustomAbono] = useState('');

  const teamFinances = finances.filter(f => f.teamCategory === activeTeam);
  const teamPlayers = players.filter(p => p.teamCategory === activeTeam);

  const totalIncomes = teamFinances
    .filter(f => f.type === 'ingreso')
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const totalExpenses = teamFinances
    .filter(f => f.type === 'egreso')
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const netBalance = totalIncomes - totalExpenses;

  const handleSaveMovement = (e) => {
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
  };

  const handlePayMembership = (player, amount) => {
    recordMembershipPayment(player.id, amount);
    showToast(`Abono de $${amount.toLocaleString()} para ${player.name} registrado.`, 'success');
    setCustomAbono('');
  };

  const handleCustomAbono = (player, e) => {
    e.preventDefault();
    const amount = Number(customAbono);
    if (!amount || amount <= 0) {
      showToast('Ingresa un monto válido.', 'warning');
      return;
    }
    handlePayMembership(player, amount);
  };

  const getMembershipStatus = (player) => {
    const m = player.memberships || { paid: 0, due: 10000 };
    const due = m.due > 0 ? m.due : 10000;
    const paid = m.paid || 0;

    if (paid >= due) return { label: 'AL DÍA', color: 'var(--color-primary)', bg: 'rgba(0, 230, 118, 0.08)' };
    if (paid > 0 && paid < due - 2000) return { label: 'PAGO PARCIAL', color: 'var(--color-gold)', bg: 'rgba(255, 179, 0, 0.08)' };
    if (paid > 0) return { label: 'CASI AL DÍA', color: 'var(--color-blue)', bg: 'rgba(64, 196, 255, 0.08)' };
    return { label: 'MOROSO', color: 'var(--color-red)', bg: 'rgba(255, 61, 0, 0.06)' };
  };

  const handleStockChange = (itemId, currentTotal, diff) => {
    const newTotal = Math.max(0, currentTotal + diff);
    updateInventoryItem(itemId, { total: newTotal });
  };

  const handleCustodianChange = (itemId, assignedTo) => {
    updateInventoryItem(itemId, { assignedTo });
  };

  const handleStatusChange = (itemId, status) => {
    updateInventoryItem(itemId, { status });
  };

  return (
    <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div style={{ display: 'flex', gap: '10px', width: '100%', borderBottom: '1px solid var(--border-glass)', paddingBottom: '15px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveSubTab('finances')}
          className="btn-outline"
          style={{ 
            background: activeSubTab === 'finances' ? 'var(--color-primary)' : 'transparent',
            color: activeSubTab === 'finances' ? '#000' : '#fff',
            borderColor: activeSubTab === 'finances' ? 'var(--color-primary)' : 'var(--border-glass)',
            fontWeight: activeSubTab === 'finances' ? 800 : 500,
            padding: '8px 16px',
            fontSize: '0.85rem'
          }}
        >
          💰 Caja Chica y Membresías
        </button>
        <button 
          onClick={() => setActiveSubTab('inventory')}
          className="btn-outline"
          style={{ 
            background: activeSubTab === 'inventory' ? 'var(--color-gold)' : 'transparent',
            color: activeSubTab === 'inventory' ? '#000' : '#fff',
            borderColor: activeSubTab === 'inventory' ? 'var(--color-gold)' : 'var(--border-glass)',
            fontWeight: activeSubTab === 'inventory' ? 800 : 500,
            padding: '8px 16px',
            fontSize: '0.85rem'
          }}
        >
          📦 Inventario
        </button>
      </div>

      {activeSubTab === 'finances' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFinanceSubTab('caja')}
              className="btn-outline"
              style={{
                background: financeSubTab === 'caja' ? 'var(--color-primary)' : 'transparent',
                color: financeSubTab === 'caja' ? '#000' : '#fff',
                padding: '6px 14px', fontSize: '0.8rem',
                borderColor: financeSubTab === 'caja' ? 'var(--color-primary)' : 'var(--border-glass)'
              }}
            >
              💰 Caja Chica
            </button>
            <button
              onClick={() => setFinanceSubTab('membresias')}
              className="btn-outline"
              style={{
                background: financeSubTab === 'membresias' ? 'var(--color-gold)' : 'transparent',
                color: financeSubTab === 'membresias' ? '#000' : '#fff',
                padding: '6px 14px', fontSize: '0.8rem',
                borderColor: financeSubTab === 'membresias' ? 'var(--color-gold)' : 'var(--border-glass)'
              }}
            >
              👑 Membresías ($10.000)
            </button>
          </div>

          {financeSubTab === 'caja' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit' }}>💰 Caja Chica & Tercer Tiempo</h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div style={{ background: 'var(--bg-dark)', padding: '12px', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-primary)', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Ingresos</span>
                      <h4 style={{ color: 'var(--color-primary)', fontSize: '1.1rem', fontWeight: 800, marginTop: '4px' }}>${totalIncomes.toLocaleString()}</h4>
                    </div>
                    <div style={{ background: 'var(--bg-dark)', padding: '12px', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-red)', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Egresos</span>
                      <h4 style={{ color: 'var(--color-red)', fontSize: '1.1rem', fontWeight: 800, marginTop: '4px' }}>${totalExpenses.toLocaleString()}</h4>
                    </div>
                    <div style={{ background: 'var(--bg-dark)', padding: '12px', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${netBalance >= 0 ? 'var(--color-primary)' : 'var(--color-red)'}`, textAlign: 'center' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Balance</span>
                      <h4 style={{ color: netBalance >= 0 ? 'var(--color-primary)' : 'var(--color-red)', fontSize: '1.1rem', fontWeight: 800, marginTop: '4px' }}>${netBalance.toLocaleString()}</h4>
                    </div>
                  </div>
                </div>

                {showAddForm ? (
                  <div className="glass-panel animated-slide" style={{ padding: '25px' }}>
                    <h3 className="neon-text-primary" style={{ marginBottom: '20px', fontFamily: 'Outfit' }}>💸 Registrar Movimiento</h3>
                    <form onSubmit={handleSaveMovement} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div className="form-group">
                        <label>Descripción / Detalle</label>
                        <input type="text" value={finDesc} onChange={(e) => setFinDesc(e.target.value)} placeholder="Ej. Balones Gilbert, Compra botiquín" className="form-input" required />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="form-group">
                          <label>Monto ($ COP)</label>
                          <input type="number" value={finAmount} onChange={(e) => setFinAmount(e.target.value)} placeholder="Monto" className="form-input" required />
                        </div>
                        <div className="form-group">
                          <label>Tipo</label>
                          <select value={finType} onChange={(e) => setFinType(e.target.value)} className="form-select">
                            <option value="ingreso">Ingreso (+)</option>
                            <option value="egreso">Egreso (-)</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Categoría</label>
                        <select value={finCategory} onChange={(e) => setFinCategory(e.target.value)} className="form-select">
                          <option value="general">General</option>
                          <option value="mensualidad">Mensualidad</option>
                          <option value="eventualidad">Eventualidad (árbitro, cancha, ambulancia)</option>
                          <option value="implementos">Implementos deportivos</option>
                          <option value="tercer_tiempo">Tercer Tiempo</option>
                          <option value="transporte">Transporte</option>
                          <option value="otro">Otro</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Fecha de Transacción</label>
                        <input type="date" value={finDate} onChange={(e) => setFinDate(e.target.value)} className="form-input" required />
                      </div>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                        <button type="button" onClick={() => setShowAddForm(false)} className="btn-outline">Cancelar</button>
                        <button type="submit" className="btn-neon">Guardar</button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setShowAddForm(true)} className="btn-neon" style={{ justifyContent: 'center', flex: 1 }}>
                      💸 Registrar Gasto o Ingreso
                    </button>
                    <button onClick={() => printFinances(finances, EQUIPOS_LABELS[activeTeam])} className="btn-outline" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                      🖨️ Imprimir
                    </button>
                  </div>
                )}

                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Outfit' }}>📋 Historial de Caja (Ledger)</h3>
                  {teamFinances.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '15px 0' }}>Sin transacciones registradas.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                      {teamFinances.sort((a, b) => new Date(b.date) - new Date(a.date)).map(f => {
                        const catLabel = f.category === 'eventualidad' ? '🔴 Eventualidad' :
                          f.category === 'mensualidad' ? '👑 Mensualidad' :
                          f.category === 'implementos' ? '📦 Implementos' :
                          f.category === 'tercer_tiempo' ? '🍻 Tercer Tiempo' :
                          f.category === 'transporte' ? '🚌 Transporte' : '';
                        return (
                          <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <strong>{f.desc}</strong>
                              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                                📅 {f.date} {catLabel && `| ${catLabel}`}
                              </span>
                            </div>
                            <strong style={{ color: f.type === 'ingreso' ? 'var(--color-primary)' : 'var(--color-red)' }}>
                              {f.type === 'ingreso' ? '+' : '-'}${(f.amount || 0).toLocaleString()}
                            </strong>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit' }}>📊 Resumen por Categoría</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {['mensualidad', 'eventualidad', 'implementos', 'tercer_tiempo', 'transporte', 'general'].map(cat => {
                    const catTotal = teamFinances
                      .filter(f => (f.category || 'general') === cat)
                      .reduce((sum, f) => sum + Number(f.amount || 0) * (f.type === 'egreso' ? -1 : 1), 0);
                    return (
                      <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                        <span style={{ textTransform: 'capitalize' }}>{cat.replace('_', ' ')}</span>
                        <strong style={{ color: catTotal >= 0 ? 'var(--color-primary)' : 'var(--color-red)' }}>
                          ${catTotal.toLocaleString()}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {financeSubTab === 'membresias' && (
            <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-gold)' }}>
                    👑 Control de Membresías
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Membresía mensual: <strong style={{ color: 'var(--color-gold)' }}>${MENSUALIDAD_BASE.toLocaleString()} COP</strong> — Se permiten abonos parciales.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '15px' }}>
                {teamPlayers.map(p => {
                  const m = p.memberships || { paid: 0, due: 10000 };
                  const due = m.due > 0 ? m.due : 10000;
                  const paid = m.paid || 0;
                  const remaining = Math.max(0, due - paid);
                  const progress = Math.min(100, (paid / due) * 100);
                  const status = getMembershipStatus(p);

                  return (
                    <div key={p.id} style={{
                      display: 'flex', flexDirection: 'column', gap: '12px',
                      padding: '18px', background: 'rgba(255,255,255,0.01)',
                      border: `1px solid ${status.color === 'var(--color-red)' ? 'rgba(255, 61, 0, 0.2)' : 'var(--border-glass)'}`,
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '0.9rem' }}>{p.name}</strong>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginLeft: '6px' }}>
                            "{p.apodo}" | #{p.camiseta}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 800, padding: '3px 10px',
                          borderRadius: 'var(--radius-sm)', color: status.color,
                          background: status.bg, border: `1px solid ${status.color}`
                        }}>
                          {status.label}
                        </span>
                      </div>

                      <div style={{ background: 'var(--bg-dark)', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${progress}%`, height: '100%',
                          background: progress >= 100 ? 'var(--color-primary)' : progress > 50 ? 'var(--color-gold)' : 'var(--color-red)',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--color-primary)' }}>Pagado: ${paid.toLocaleString()}</span>
                        <span style={{ color: remaining > 0 ? 'var(--color-red)' : 'var(--color-primary)' }}>
                          {remaining > 0 ? `Pendiente: $${remaining.toLocaleString()}` : 'Completado'}
                        </span>
                      </div>

                      {m.lastPayment && (
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                          Último abono: ${(m.lastAmount || 0).toLocaleString()} el {m.lastPayment}
                        </div>
                      )}

                      {remaining > 0 && (
                        <div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '5px' }}>
                            {ABONOS_RAPIDOS.map(amount => (
                              <button
                                key={amount}
                                onClick={() => handlePayMembership(p, amount)}
                                className="btn-outline"
                                style={{
                                  padding: '4px 8px', fontSize: '0.7rem',
                                  color: 'var(--color-gold)', borderColor: 'var(--color-gold)'
                                }}
                              >
                                💵 ${amount.toLocaleString()}
                              </button>
                            ))}
                          </div>
                          <form onSubmit={(e) => handleCustomAbono(p, e)} style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                            <input
                              type="number"
                              value={customAbono}
                              onChange={(e) => setCustomAbono(e.target.value)}
                              placeholder="Otro monto"
                              className="form-input"
                              style={{ flex: 1, padding: '6px', fontSize: '0.75rem' }}
                              min="500"
                            />
                            <button type="submit" className="btn-neon" style={{ padding: '6px 10px', fontSize: '0.7rem' }}>
                              Abonar
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {teamPlayers.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '30px' }}>
                  No hay jugadores en este equipo. Agrega jugadores en el Roster.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'inventory' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {inventory.map(item => (
            <div key={item.id} className="glass-panel animated-slide" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit' }}>📦 {item.name}</h4>
                <span className="badge" style={{ 
                  fontSize: '0.75rem',
                  border: '1px solid ' + (item.status === 'Excelente' || item.status === 'Completo' ? 'var(--color-primary)' : item.status === 'Bueno' ? 'var(--color-gold)' : 'var(--color-red)'),
                  color: item.status === 'Excelente' || item.status === 'Completo' ? 'var(--color-primary)' : item.status === 'Bueno' ? 'var(--color-gold)' : 'var(--color-red)',
                  background: 'rgba(255,255,255,0.02)'
                }}>
                  {item.status}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-dark)', padding: '10px 15px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                <span style={{ fontSize: '0.8rem' }}>Total Stock:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button 
                    onClick={() => handleStockChange(item.id, item.total, -1)}
                    style={{
                      width: '26px', height: '26px', borderRadius: '50%',
                      border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.02)',
                      color: '#fff', fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >-</button>
                  <strong style={{ fontSize: '1.15rem', color: 'var(--color-primary)' }}>{item.total}</strong>
                  <button 
                    onClick={() => handleStockChange(item.id, item.total, 1)}
                    style={{
                      width: '26px', height: '26px', borderRadius: '50%',
                      border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.02)',
                      color: '#fff', fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >+</button>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Responsable / Custodio</label>
                <select 
                  value={item.assignedTo} 
                  onChange={(e) => handleCustodianChange(item.id, e.target.value)}
                  className="form-select"
                  style={{ padding: '6px', fontSize: '0.8rem' }}
                >
                  <option value="">-- Sin Asignar --</option>
                  {players.map(p => (
                    <option key={p.id} value={p.name}>#{p.camiseta} {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Estado de Conservación</label>
                <select 
                  value={item.status} 
                  onChange={(e) => handleStatusChange(item.id, e.target.value)}
                  className="form-select"
                  style={{ padding: '6px', fontSize: '0.8rem' }}
                >
                  <option value="Excelente">Excelente</option>
                  <option value="Bueno">Bueno</option>
                  <option value="Completo">Completo</option>
                  <option value="Requiere Reposición">Requiere Reposición</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default Finanzas;
