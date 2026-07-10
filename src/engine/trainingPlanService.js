import { supabase } from '../supabaseClient';
import { generatePlan } from './assignmentEngine';
import { generateTrainingPlan } from './aiProvider';
import { normalizeAIOutput, normalizeEngineOutput } from './planNormalizer';

export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

export async function getActivePlan(playerId) {
  const weekStart = getWeekStart();
  const { data } = await supabase
    .from('training_plans')
    .select('*')
    .eq('player_id', playerId)
    .eq('week_start', weekStart)
    .eq('status', 'active')
    .maybeSingle();
  return data;
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

  // Adjuntar datos de feedback de la semana anterior para el prompt de IA
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

  try {
    await supabase.from('training_plans')
      .update({ status: 'archived' })
      .eq('player_id', player.id)
      .eq('status', 'active');
  } catch { /* silencioso */ }

  const { data: inserted } = await supabase
    .from('training_plans')
    .upsert({
      player_id: player.id,
      week_start: getWeekStart(),
      source,
      plan: planData,
      ai_analysis: aiAnalysis,
      provider: aiProvider,
      model: aiModel,
      status: 'active',
    }, { onConflict: 'player_id, week_start' })
    .select()
    .maybeSingle();

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
  const { data } = await supabase
    .from('training_plans')
    .select('*')
    .eq('player_id', playerId)
    .order('week_start', { ascending: false })
    .limit(12);
  return data || [];
}

export async function completePlan(planId, feedback = {}) {
  const { data } = await supabase
    .from('training_plans')
    .update({
      status: 'completed',
      completion_rate: feedback.completionRate ?? 0,
      feedback,
      updated_at: new Date().toISOString()
    })
    .eq('id', planId)
    .select()
    .maybeSingle();
  return data;
}

export async function persistPlan(playerId, plan, source = 'engine') {
  const { data } = await supabase
    .from('training_plans')
    .upsert({
      player_id: playerId,
      week_start: getWeekStart(),
      source,
      plan: plan.plan || plan,
      ai_analysis: plan.aiAnalysis ? {
        analisis: plan.aiAnalysis,
        riesgos: plan.aiRisks || [],
        metas: plan.aiGoals || [],
        recomendaciones: plan.aiRecommendations || {},
      } : plan.ai_analysis || null,
      status: 'active',
    }, { onConflict: 'player_id, week_start' })
    .select()
    .maybeSingle();
  return data;
}

export async function getPreviousPlanFeedback(playerId) {
  const { data } = await supabase
    .from('training_plans')
    .select('feedback, completion_rate')
    .eq('player_id', playerId)
    .eq('status', 'completed')
    .order('week_start', { ascending: false })
    .limit(1);
  return data?.[0] || null;
}

export async function saveFeedback(planId, feedback) {
  const { data } = await supabase
    .from('training_plans')
    .update({ feedback, updated_at: new Date().toISOString() })
    .eq('id', planId)
    .select()
    .maybeSingle();
  return data;
}
