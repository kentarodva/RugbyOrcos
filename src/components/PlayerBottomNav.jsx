import { useState } from 'react';
import { Calendar, Dumbbell, HeartPulse, Wallet, Bot, LogOut } from 'lucide-react';
import { OrcosTackleShieldIcon } from './common/OrcosIcons';
import BottomNav from './shell/BottomNav';
import Sheet, { SheetItem, SheetSection } from './shell/Sheet';

export const PRIMARY_TABS = [
  { id: 'agenda', Icon: Calendar, label: 'Partidos' },
  { id: 'entreno', Icon: Dumbbell, label: 'Entreno' },
  { id: 'bienestar', Icon: HeartPulse, label: 'Físico' },
  { id: 'perfil', Icon: OrcosTackleShieldIcon, label: 'Ficha' },
];

export const MORE_TABS = [
  { id: 'finanzas', Icon: Wallet, label: 'Membresía & Cuotas' },
  { id: 'ia', Icon: Bot, label: 'Coach Táctico IA' },
];

/** Phone navigation: 4 primary destinations + "Más" sheet. Replaces the sidebar under 768px. */
export default function PlayerBottomNav({ activeTab, onTabChange, onSignOut }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE_TABS.some((t) => t.id === activeTab);

  const go = (id) => {
    onTabChange(id);
    setMoreOpen(false);
  };

  return (
    <>
      <BottomNav
        items={PRIMARY_TABS}
        activeId={activeTab}
        onSelect={go}
        moreActive={moreActive}
        moreOpen={moreOpen}
        onMore={() => setMoreOpen((o) => !o)}
      />
      <Sheet open={moreOpen} title="Más" onClose={() => setMoreOpen(false)}>
        <SheetSection>
          {MORE_TABS.map(({ id, Icon, label }) => (
            <SheetItem key={id} icon={Icon} label={label} active={activeTab === id} onClick={() => go(id)} />
          ))}
        </SheetSection>
        {onSignOut && (
          <SheetSection>
            <SheetItem icon={LogOut} label="Cerrar sesión" tone="danger" onClick={onSignOut} />
          </SheetSection>
        )}
      </Sheet>
    </>
  );
}
