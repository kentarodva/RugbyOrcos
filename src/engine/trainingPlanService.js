import { generatePlan } from './assignmentEngine';
import { generateTrainingPlan } from './aiProvider';
import { normalizeAIOutput, normalizeEngineOutput } from './planNormalizer';
import {
  getPlayerActivePlan,
  fetchTrainingPlans,
  persistTrainingPlan,
  completeTrainingPlan,
} from '../services/dataService';
import { localDateKey } from '../utils/agendaItems';

export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return localDateKey(d);
}

export async function getActivePlan(playerId) {
  return getPlayerActivePlan(playerId);
}

export async function getOrGeneratePlan(player) {
  if (!player?.id) return null;

  const existing = await getActivePlan(player.id);

  if (existing) {
    return {
      id: existing.id,
      playerId: existing.player_id,
      weekStart: existing.week_start,
      source: existing.source,
      plan: existing.plan,
      aiAnalysis: existing.ai_analysis?.analisis,
      aiRisks: existing.ai_analysis?.riesgos,
      aiGoals: existing.ai_analysis?.metas,
      aiRecommendations: existing.ai_analysis?.recomendaciones,
      completionRate: existing.completion_rate,
      fromDB: true,
      enrichedByAI: existing.source === 'ai',
      matchFaults: existing.plan?.matchFaults || [],
      isInjured: existing.plan?.isInjured || player.estado === 'lesionado',
    };
  }

  const enginePlan = generatePlan(player);
  const normalized = normalizeEngineOutput(enginePlan);

  const matchFaults = enginePlan.matchFaults || [];
  const isInjured = player.estado === 'lesionado';

  const prevFeedback = await getPreviousPlanFeedback(player.id);

  const playerCtx = {
    ...player,
    lastPlanFeedback: prevFeedback?.feedback || null,
    lastPlanCompletionRate: prevFeedback?.completion_rate || null,
  };

  let source = 'engine';
  let planData = { ...normalized.plan, matchFaults, isInjured };
  let aiAnalysis = null;
  let aiProvider = 'engine';
  let aiModel = null;

  try {
    const aiPlan = await generateTrainingPlan(playerCtx);
    if (aiPlan?.plan) {
      const normalizedAI = normalizeAIOutput(aiPlan, player);
      planData = { ...normalizedAI.plan, matchFaults, isInjured };
      aiAnalysis = {
        analisis: aiPlan.analisis || '',
        riesgos: aiPlan.riesgos || [],
        metas: aiPlan.metas || [],
        recomendaciones: aiPlan.recomendaciones || {},
      };
      source = 'ai';
      aiProvider = aiPlan.provider || 'gemini';
      aiModel = aiPlan.model || null;
    }
  } catch {
    /* fallback a engine */
  }

  const inserted = await persistTrainingPlan(player.id, {
    plan: planData,
    aiAnalysis,
    provider: aiProvider,
    model: aiModel,
  }, source);

  return {
    id: inserted?.id,
    playerId: player.id,
    weekStart: getWeekStart(),
    source,
    provider: aiProvider,
    model: aiModel,
    plan: planData,
    aiAnalysis: aiAnalysis?.analisis,
    aiRisks: aiAnalysis?.riesgos,
    aiGoals: aiAnalysis?.metas,
    aiRecommendations: aiAnalysis?.recomendaciones,
    completionRate: 0,
    fromDB: true,
    enrichedByAI: source === 'ai',
    matchFaults,
    isInjured,
  };
}

export async function listPlans(playerId) {
  return fetchTrainingPlans(playerId);
}

export async function completePlan(planId, feedback = {}) {
  return completeTrainingPlan(planId, {
    completion_rate: feedback.completionRate ?? 0,
    feedback,
  });
}

export async function persistPlan(playerId, plan, source = 'engine') {
  return persistTrainingPlan(playerId, plan, source);
}

export async function getPreviousPlanFeedback(playerId) {
  const plans = await fetchTrainingPlans(playerId);
  if (plans.length === 0) return null;
  const completed = plans.filter(p => p.status === 'completed');
  completed.sort((a, b) => new Date(b.week_start) - new Date(a.week_start));
  return completed[0] || null;
}

export async function saveFeedback(planId, feedback) {
  return completeTrainingPlan(planId, { feedback });
}
