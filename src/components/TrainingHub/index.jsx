import React, { useContext, useMemo } from 'react';
import { ClubContext } from '../../context/ClubContext';
import { useToast } from '../../context/ToastContext';
import { useTrainingState } from './useTrainingState';
import PlanTab from './PlanTab';
import PlayersTab from './PlayersTab';
import CatalogTab from './CatalogTab';
import TeamOverview from './TeamOverview';

function TrainingHub() {
  const { players, activeTeam, logWorkout, schedule, viewMode, divisionView, makgoraTeamId } = useContext(ClubContext);
  const { showToast } = useToast();

  const teamPlayers = useMemo(() => {
    if (viewMode === 'general' && divisionView === 'all') {
      return players.filter(p => p.teamCategory?.startsWith('orcos'));
    }
    if (viewMode === 'general') {
      return players.filter(p => p.teamCategory === `orcos_${divisionView}`);
    }
    if (viewMode === 'makgora' && makgoraTeamId) {
      let filtered = players.filter(p => p.makgora_team_id === makgoraTeamId);
      if (divisionView !== 'all') {
        filtered = filtered.filter(p => p.teamCategory === `orcos_${divisionView}`);
      }
      return filtered;
    }
    return players.filter(p => p.teamCategory === activeTeam);
  }, [players, viewMode, divisionView, makgoraTeamId, activeTeam]);

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
