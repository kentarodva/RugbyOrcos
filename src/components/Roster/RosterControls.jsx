import React, { useState } from 'react';
import { KeyRound, MoreVertical, Plus, Search, Swords, Archive, Printer, FileSpreadsheet, ListChecks } from 'lucide-react';
import Sheet, { SheetItem, SheetSection } from '../shell/Sheet';

const FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'assigned', label: "Con clan Mak'Gora" },
  { value: 'unassigned', label: 'Sin clan' },
];

/** Roster toolbar: title + primary action, search, filter chips; secondary tools live in the ⋯ sheet. */
function RosterControls({
  count, search, onSearchChange, makgoraFilter, onMakgoraFilterChange, onAdd, onPrint, onExportCsv,
  onToggleBulk, bulkMode, searchInputRef, onCompare, showDeleted, onToggleDeleted, onBulkCredentials,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const run = (fn) => () => { setMenuOpen(false); fn(); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: '10px', minWidth: 0 }}>
          <h2 className="page-title">Guerreros</h2>
          {count != null && <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{count}</span>}
        </div>
        <button type="button" className="btn-neon btn-sm" onClick={onAdd}>
          <Plus size={16} /> Nuevo
        </button>
        <button type="button" className="icon-btn" aria-label="Más opciones de la plantilla" onClick={() => setMenuOpen(true)}>
          <MoreVertical size={20} />
        </button>
      </div>

      <label className="search-field">
        <Search size={18} aria-hidden="true" />
        <input
          ref={searchInputRef}
          type="search"
          placeholder="Buscar por nombre, apodo o número"
          aria-label="Buscar guerrero"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </label>

      <div className="chip-row" role="group" aria-label="Filtrar plantilla">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`pro-subtab-btn${makgoraFilter === f.value ? ' active' : ''}`}
            aria-pressed={makgoraFilter === f.value}
            onClick={() => onMakgoraFilterChange(f.value)}
          >
            {f.label}
          </button>
        ))}
        {showDeleted && (
          <button type="button" className="pro-subtab-btn active" onClick={onToggleDeleted}>
            Papelera ✕
          </button>
        )}
      </div>

      <Sheet open={menuOpen} title="Plantilla" onClose={() => setMenuOpen(false)}>
        <SheetSection>
          <SheetItem icon={Swords} label="Comparar guerreros" onClick={run(onCompare)} />
          <SheetItem icon={ListChecks} label={bulkMode ? 'Cancelar asignación' : 'Asignar posiciones en lote'} active={bulkMode} onClick={run(onToggleBulk)} />
          <SheetItem icon={Archive} label={showDeleted ? 'Ocultar papelera' : 'Ver papelera'} active={showDeleted} onClick={run(onToggleDeleted)} />
        </SheetSection>
        <SheetSection label="Exportar">
          <SheetItem icon={Printer} label="Imprimir plantilla" onClick={run(onPrint)} />
          {onExportCsv && <SheetItem icon={FileSpreadsheet} label="Planilla de torneo (CSV)" onClick={run(onExportCsv)} />}
        </SheetSection>
        {onBulkCredentials && (
          <SheetSection label="Accesos">
            <SheetItem icon={KeyRound} label="Accesos del club" hint="Crear usuarios para los jugadores" onClick={run(onBulkCredentials)} />
          </SheetSection>
        )}
      </Sheet>
    </div>
  );
}

export default RosterControls;
