import React, { useContext, useState } from 'react';
import { ClubContext } from '../../context/ClubContext';
import { useToast } from '../../context/ToastContext';
import { useTeamPlayers } from '../../context/hooks/useFilterByView';
import { useTrainingState } from './useTrainingState';
import PlanTab from './PlanTab';
import PlayersTab from './PlayersTab';
import CatalogTab from './CatalogTab';
import BuilderTab from './BuilderTab';
import TeamOverview from './TeamOverview';

function TrainingHub() {
  const { logWorkout, schedule, activeTeam } = useContext(ClubContext);
  const { showToast } = useToast();
  const teamPlayers = useTeamPlayers();

  const {
    activeTab, setActiveTab,
    activeCategory, setActiveCategory,
    selectedPlayerId, setSelectedPlayerId,
    planPlayerId, generatedPlan, generating,
    completedExercises, linkToDate, setLinkToDate,
    scheduledEvents,
    handleGeneratePlan,
    handleToggleExercise,
    handleSaveWorkout,
    handleSelectPlayer,
  } = useTrainingState(teamPlayers, logWorkout, schedule, activeTeam, showToast);
  const [createMode, setCreateMode] = useState('plan');

  return (
    <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <header style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span className="page-eyebrow">Rutinas según posición y rol</span>
        <h1 className="page-title">Entrenamientos</h1>
      </header>

      <nav className="pro-subtabs chip-row" aria-label="Secciones de entrenamientos">
        {[
          { id: 'team', label: 'Equipo' },
          { id: 'create', label: 'Crear rutina' },
          { id: 'players', label: 'Por jugador' },
        ].map((t) => (
          <button key={t.id} type="button" onClick={() => setActiveTab(t.id)} aria-pressed={activeTab === t.id}
            className={`pro-subtab-btn${activeTab === t.id ? ' active' : ''}`}>
            {t.label}
          </button>
        ))}
      </nav>

      {activeTab === 'team' && (
        <TeamOverview
          teamPlayers={teamPlayers}
          onSelectPlayer={(id) => { setSelectedPlayerId(id); setActiveTab('players'); }}
        />
      )}

      {activeTab === 'create' && (
        <div className="segmented" role="tablist" aria-label="Cómo crear la rutina" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', width: 'min(100%, 380px)' }}>
          {[['plan', 'Automática'], ['builder', 'A mano'], ['catalog', 'Ejercicios']].map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={createMode === id}
              className={createMode === id ? 'is-on' : ''} onClick={() => setCreateMode(id)}>{label}</button>
          ))}
        </div>
      )}
      {activeTab === 'create' && (
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          {createMode === 'plan' && 'La app arma una rutina según la posición y el estado del jugador. Puedes ajustarla después en "A mano".'}
          {createMode === 'builder' && 'Arma la rutina tú mismo, ejercicio por ejercicio.'}
          {createMode === 'catalog' && 'Todos los ejercicios disponibles, para consultar antes de armar una rutina.'}
        </p>
      )}

      {activeTab === 'create' && createMode === 'plan' && (
        <PlanTab
          teamPlayers={teamPlayers}
          planPlayerId={planPlayerId}
          generatedPlan={generatedPlan}
          generating={generating}
          completedExercises={completedExercises}
          linkToDate={linkToDate}
          setLinkToDate={setLinkToDate}
          scheduledEvents={scheduledEvents}
          onGeneratePlan={handleGeneratePlan}
          onSelectPlayer={handleSelectPlayer}
          onToggleExercise={handleToggleExercise}
          onSaveWorkout={handleSaveWorkout}
        />
      )}

      {activeTab === 'players' && (
        <PlayersTab
          teamPlayers={teamPlayers}
          selectedPlayerId={selectedPlayerId}
          onSelectPlayer={setSelectedPlayerId}
          generatedPlan={generatedPlan}
          generating={generating}
          completedExercises={completedExercises}
          linkToDate={linkToDate}
          setLinkToDate={setLinkToDate}
          scheduledEvents={scheduledEvents}
          onGeneratePlan={handleGeneratePlan}
          onToggleExercise={handleToggleExercise}
          onSaveWorkout={handleSaveWorkout}
        />
      )}

      {activeTab === 'create' && createMode === 'builder' && (
        <BuilderTab
          teamPlayers={teamPlayers}
          onBuilderPlanSaved={() => showToast('Plan guardado exitosamente.', 'success')}
        />
      )}

      {activeTab === 'create' && createMode === 'catalog' && (
        <CatalogTab
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      )}
    </div>
  );
}

export default TrainingHub;
