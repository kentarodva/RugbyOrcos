import React from 'react';
import { InventoryCard } from './InventoryCard';

export function InventoryList({ inventory, players, onStockChange, onCustodianChange, onStatusChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
      {inventory.map(item => (
        <InventoryCard
          key={item.id}
          item={item}
          players={players}
          onStockChange={onStockChange}
          onCustodianChange={onCustodianChange}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
