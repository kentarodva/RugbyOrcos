import React, { useState } from 'react';
import { INVENTORY_STATUS_OPTIONS, INVENTORY_CATEGORIES } from './constants';

export function AddInventoryForm({ players, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('equipamiento');
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState('disponible');
  const [assignedTo, setAssignedTo] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      category,
      quantity: Math.max(1, parseInt(quantity, 10) || 1),
      status,
      assignedTo: assignedTo || null,
      description: description.trim(),
    });
  };

  return (
    <div className="glass-panel animated-slide" style={{ padding: '25px' }}>
      <h3 style={{ marginBottom: '20px', fontFamily: 'Outfit', color: 'var(--color-primary)' }}>
        Agregar Item al Inventario
      </h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div className="form-group">
          <label>Nombre del Item</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Balon Gilbert, Peto de contacto"
            className="form-input"
            required
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="form-group">
            <label>Categoria</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-select">
              {INVENTORY_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Cantidad</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              className="form-input"
            />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="form-group">
            <label>Estado</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-select">
              {INVENTORY_STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Custodio</label>
            <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="form-select">
              <option value="">-- Sin custodio --</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nickname || `${p.firstName} ${p.lastName}`}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Descripcion / Notas</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalles adicionales (opcional)"
            className="form-input"
          />
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} className="btn-outline">Cancelar</button>
          <button type="submit" className="btn-neon">Agregar Item</button>
        </div>
      </form>
    </div>
  );
}
