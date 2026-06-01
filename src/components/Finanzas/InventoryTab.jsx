import React from 'react';
import { InventoryList } from './InventoryList';

export function InventoryTab({ inventory, players, onStockChange, onCustodianChange, onStatusChange }) {
  return (
    <InventoryList
      inventory={inventory}
      players={players}
      onStockChange={onStockChange}
      onCustodianChange={onCustodianChange}
      onStatusChange={onStatusChange}
    />
  );
}
