import React from 'react';
import { FINANCE_CATEGORIES } from './constants';
import { CopInput } from '../common/FormattedInputs';

export function FinanceForm({
  finDesc, setFinDesc,
  finAmount, setFinAmount,
  finType, setFinType,
  finCategory, setFinCategory,
  finDate, setFinDate,
  onSave, onCancel
}) {
  return (
    <div className="glass-panel animated-slide" style={{ padding: '25px' }}>
      <h3 className="neon-text-primary" style={{ marginBottom: '20px', fontFamily: 'var(--font-display)' }}>💰 Registrar Movimiento</h3>
      <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div className="form-group">
          <label>Descripción / Detalle</label>
          <input type="text" value={finDesc} onChange={(e) => setFinDesc(e.target.value)} placeholder="Ej. Balones Gilbert, Compra botiquín" className="form-input" required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '10px' }}>
          <div className="form-group">
            <label>Monto ($ COP)</label>
            <CopInput value={finAmount} onChange={(e) => setFinAmount(e.target.value)} placeholder="50.000" required />
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
            {FINANCE_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Fecha de Transacción</label>
          <input type="date" value={finDate} onChange={(e) => setFinDate(e.target.value)} className="form-input" required />
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button type="button" onClick={onCancel} className="btn-outline">Cancelar</button>
          <button type="submit" className="btn-neon">Guardar</button>
        </div>
      </form>
    </div>
  );
}
