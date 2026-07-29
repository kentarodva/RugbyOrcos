import { supabase } from '../supabaseClient.js';

export async function getExerciseCatalog() {
  const { data, error } = await supabase.rpc('get_exercise_catalog_light');
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getExerciseByCode(code) {
  const { data, error } = await supabase.from('exercise_catalog')
    .select('*')
    .eq('code', code)
    .single();
  if (error) throw error;
  return data;
}

export async function createExercise(exercise) {
  const { error } = await supabase.from('exercise_catalog').insert({
    name_technical: exercise.name_technical || exercise.name || '',
    name_local: exercise.name_local || exercise.name || '',
    category: exercise.category,
    subcategory: exercise.subcategory || 'general',
    difficulty: exercise.difficulty || 2,
    description: exercise.description || null,
    equipment: Array.isArray(exercise.equipment) ? exercise.equipment.join(', ') : (exercise.equipment || ''),
    target_positions: exercise.targetPositions || exercise.target_positions || 'TODOS',
    is_system: false,
  });
  if (error) throw error;
}
