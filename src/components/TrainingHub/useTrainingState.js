import { useState, useCallback } from 'react';
import { generatePlan } from '../../engine/assignmentEngine';
import { generatePlanWithAI, isAnyAIConfigured } from '../../engine/multiProviderCoach';
import { normalizeAIOutput } from '../../engine/planNormalizer';
import { persistPlan } from '../../engine/trainingPlanService';

export function useTrainingState(teamPlayers, logWorkout, schedule, activeTeam, showToast) {
  const [activeTab, setActiveTab] = useState('plan');
  const [activeCategory, setActiveCategory] = useState('forwards');
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  const [planPlayerId, setPlanPlayerId] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [completedExercises, setCompletedExercises] = useState({});
  const [linkToDate, setLinkToDate] = useState('');

  const handleGeneratePlan = useCallback(async (playerIdOverride) => {
    const effectiveId = playerIdOverride || planPlayerId;
    if (!effectiveId) {
      showToast('Selecciona un jugador para generar el plan.', 'warning');
      return null;
    }
    const player = teamPlayers.find(p => p.id === effectiveId);
    if (!player) return null;

    setGenerating(true);
    setGeneratedPlan(null);
    setCompletedExercises({});
    if (!playerIdOverride) setPlanPlayerId(effectiveId);

    let plan = generatePlan(player);

    if (isAnyAIConfigured()) {
      try {
        const aiPlan = await generatePlanWithAI(player);
        if (aiPlan?.plan) {
          const merged = {
            ...plan,
            enrichedByAI: true,
            aiAnalysis: aiPlan.analisis,
            aiRisks: aiPlan.riesgos,
            aiGoals: aiPlan.metas,
            aiRecommendations: aiPlan.recomendaciones,
          };
          const normalized = normalizeAIOutput(aiPlan, player);
          if (normalized) {
            merged.plan = normalized.plan;
          }
          plan = merged;
        }
      } catch (e) {
        if (import.meta.env.DEV) console.warn('[TrainingHub] AI plan generation failed, using base plan:', e.message);
      }
    }

    // Persistir a BD para que el jugador lo vea en su dashboard
    try {
      await persistPlan(effectiveId, plan, plan.enrichedByAI ? 'ai' : 'engine');
    } catch { /* fallback: el plan se muestra igual aunque no se persista */ }

    setGeneratedPlan(plan);
    setGenerating(false);
    if (plan.enrichedByAI) {
      showToast('Plan generado y enriquecido con IA.', 'success');
    } else {
      showToast('Plan generado con motor de reglas.', 'success');
    }
    return plan;
  }, [planPlayerId, teamPlayers, showToast]);

  const handleToggleExercise = useCallback((exerciseId) => {
    setCompletedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  }, []);

  const handleSaveWorkout = useCallback(() => {
    if (!planPlayerId) return;
    const completed = Object.entries(completedExercises)
      .filter(([, done]) => done)
      .map(([id]) => ({ exerciseId: id, completed: true }));

    if (completed.length === 0) {
      showToast('Marca al menos un ejercicio como completado.', 'warning');
      return;
    }

    logWorkout(planPlayerId, {
      ejercicios: completed,
      type: 'plan',
      linkedDate: linkToDate || null
    });

    showToast(`Rutina registrada: ${completed.length} ejercicios completados.${linkToDate ? ' Vinculada a fecha del calendario.' : ''}`, 'success');
    setCompletedExercises({});
    setGeneratedPlan(null);
    setLinkToDate('');
  }, [planPlayerId, completedExercises, linkToDate, logWorkout, showToast]);

  const handleSelectPlayer = useCallback((id) => {
    setPlanPlayerId(id);
    setGeneratedPlan(null);
    setCompletedExercises({});
  }, []);

  const scheduledEvents = schedule
    .filter(s => s.teamCategory === activeTeam)
    .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time))
    .slice(0, 10);

  return {
    activeTab, setActiveTab,
    activeCategory, setActiveCategory,
    selectedPlayerId, setSelectedPlayerId,
    planPlayerId, setPlanPlayerId,
    generatedPlan, setGeneratedPlan,
    generating,
    completedExercises,
    linkToDate, setLinkToDate,
    scheduledEvents,
    handleGeneratePlan,
    handleToggleExercise,
    handleSaveWorkout,
    handleSelectPlayer,
  };
}
