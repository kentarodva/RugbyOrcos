import { useMemo, useState } from 'react';
import { Home, Users, Calendar, Dumbbell } from 'lucide-react';
import BottomNav from './BottomNav';
import Sheet, { SheetItem, SheetSection } from './Sheet';
import { ALL_GROUPS } from '../Sidebar';

const PRIMARY = [
  { id: 'dashboard', Icon: Home, label: 'Inicio' },
  { id: 'roster', Icon: Users, label: 'Guerreros' },
  { id: 'calendario', Icon: Calendar, label: 'Agenda' },
  { id: 'entrenamientos', Icon: Dumbbell, label: 'Entrenos' },
];
const PRIMARY_IDS = new Set(PRIMARY.map((t) => t.id));

/** Staff phone navigation: 4 daily destinations + "Más" sheet with every other module. */
export default function StaffBottomNav({ activeTab, setActiveTab, hasPermission }) {
  const [moreOpen, setMoreOpen] = useState(false);

  const moreGroups = useMemo(
    () =>
      ALL_GROUPS.map((g) => ({
        ...g,
        tabs: g.tabs.filter((t) => !PRIMARY_IDS.has(t.id) && (!t.perm || !hasPermission || hasPermission(t.perm))),
      })).filter((g) => g.tabs.length > 0),
    [hasPermission],
  );
  const moreActive = !PRIMARY_IDS.has(activeTab);

  const go = (id) => {
    setActiveTab(id);
    setMoreOpen(false);
    window.scrollTo?.(0, 0);
  };

  return (
    <>
      <BottomNav
        items={PRIMARY}
        activeId={activeTab}
        onSelect={go}
        moreActive={moreActive}
        moreOpen={moreOpen}
        onMore={() => setMoreOpen((o) => !o)}
      />
      <Sheet open={moreOpen} title="Más módulos" onClose={() => setMoreOpen(false)}>
        {moreGroups.map((g) => (
          <SheetSection key={g.label} label={g.label.charAt(0) + g.label.slice(1).toLowerCase()}>
            {g.tabs.map((t) => (
              <SheetItem key={t.id} icon={t.icon} label={t.label} active={activeTab === t.id} onClick={() => go(t.id)} />
            ))}
          </SheetSection>
        ))}
      </Sheet>
    </>
  );
}
