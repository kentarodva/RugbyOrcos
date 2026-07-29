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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }} className="neon-text-primary">
            Centro de Entrenamientos Especificos
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Rutinas tácticas y físicas personalizadas reactivamente según la posición y el rol de cada guerrero.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('team')}
          className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
          style={{ fontSize: '0.9rem', padding: '10px 20px' }}
        >
          📊 Vista Equipo
        </button>
        <button
          onClick={() => setActiveTab('plan')}
          className={`tab-btn ${activeTab === 'plan' ? 'active' : ''}`}
          style={{ fontSize: '0.9rem', padding: '10px 20px' }}
        >
          Plan Inteligente
        </button>
        <button
          onClick={() => setActiveTab('players')}
          className={`tab-btn ${activeTab === 'players' ? 'active' : ''}`}
          style={{ fontSize: '0.9rem', padding: '10px 20px' }}
        >
          Rutinas por Jugador
        </button>
        <button
          onClick={() => setActiveTab('builder')}
          className={`tab-btn ${activeTab === 'builder' ? 'active' : ''}`}
          style={{ fontSize: '0.9rem', padding: '10px 20px' }}
        >
          🛠️ Constructor
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
          style={{ fontSize: '0.9rem', padding: '10px 20px' }}
        >
          Catálogo General
        </button>
      </div>

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
