import React, { useContext, useState } from 'react';
import { ClubContext } from '../../context/ClubContext';
import { useToast } from '../../context/ToastContext';
import { useFilterByView } from '../../context/hooks/useFilterByView';
import { ChampionshipCountdown, AddChampionshipModal } from '../Dashboard/index';

/** Campeonatos agendados (con cuenta regresiva), dentro de Agenda › Partidos. */
function ChampionshipsSection() {
  const { championships, addChampionship } = useContext(ClubContext);
  const { showToast } = useToast();
  const filterByView = useFilterByView();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <>
      <ChampionshipCountdown
        teamChamps={filterByView(championships || [])}
        currentTime={new Date()}
        onAddChampionship={() => setShowAdd(true)}
      />
      {showAdd && (
        <AddChampionshipModal
          onClose={() => setShowAdd(false)}
          onAdd={(champ) => { addChampionship(champ); showToast('Campeonato agendado correctamente.', 'success'); }}
        />
      )}
    </>
  );
}

export default ChampionshipsSection;
