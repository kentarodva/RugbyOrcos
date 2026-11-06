import React, { useContext } from 'react';
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

  return (
    <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <header style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span className="page-eyebrow">Rutinas según posición y rol</span>
        <h1 className="page-title">Entrenamientos</h1>
      </header>

      <nav className="pro-subtabs chip-row" aria-label="Secciones de entrenamientos">
        {[
          { id: 'team', label: 'Equipo' },
          { id: 'plan', label: 'Plan inteligente' },
          { id: 'players', label: 'Por jugador' },
          { id: 'builder', label: 'Constructor' },
          { id: 'catalog', label: 'Catálogo' },
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

      {activeTab === 'plan' && (
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

      {activeTab === 'builder' && (
        <BuilderTab
          teamPlayers={teamPlayers}
          onBuilderPlanSaved={() => showToast('Plan guardado exitosamente.', 'success')}
        />
      )}

      {activeTab === 'catalog' && (
        <CatalogTab
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      )}
    </div>
  );
}

export default TrainingHub;
