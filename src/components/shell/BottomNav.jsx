import { MoreHorizontal } from 'lucide-react';

/**
 * Phone tab bar: up to 4 primary destinations plus a "Más" button.
 * Shared by staff and player shells so both look and behave the same.
 */
export default function BottomNav({ items, activeId, onSelect, moreActive, moreOpen, onMore }) {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {items.map(({ id, Icon, label }) => {
        const active = activeId === id;
        return (
          <button
            key={id}
            type="button"
            className={`bottom-nav-item${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
            onClick={() => onSelect(id)}
          >
            <Icon size={22} strokeWidth={active ? 2.2 : 1.8} color="currentColor" aria-hidden="true" />
            <span>{label}</span>
          </button>
        );
      })}
      {onMore && (
        <button
          type="button"
          className={`bottom-nav-item${moreActive || moreOpen ? ' is-active' : ''}`}
          aria-haspopup="dialog"
          aria-expanded={!!moreOpen}
          onClick={onMore}
        >
          <MoreHorizontal size={22} aria-hidden="true" />
          <span>Más</span>
        </button>
      )}
    </nav>
  );
}
