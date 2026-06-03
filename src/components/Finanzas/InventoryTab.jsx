import React, { useState } from 'react';
import { InventoryList } from './InventoryList';
import { AddInventoryForm } from './AddInventoryForm';

export function InventoryTab({ inventory, players, onStockChange, onCustodianChange, onStatusChange, onAddItem }) {
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSave = (item) => {
    if (onAddItem) onAddItem(item);
    setShowAddForm(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-gold)' }}>
          {inventory.length} items
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-neon"
          style={{ padding: '8px 14px', fontSize: '0.8rem' }}
        >
          {showAddForm ? 'Cancelar' : '+ Agregar Item'}
        </button>
      </div>

      {showAddForm && (
        <AddInventoryForm
          players={players}
          onSave={handleSave}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <InventoryList
        inventory={inventory}
        players={players}
        onStockChange={onStockChange}
        onCustodianChange={onCustodianChange}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}
