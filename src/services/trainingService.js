import { supabase } from '../supabaseClient.js';

export async function getExerciseCatalog() {
  const { data, error } = await supabase.from('exercise_catalog').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function createExercise(exercise) {
  const { error } = await supabase.from('exercise_catalog').insert({
    name: exercise.name,
    category: exercise.category,
    subcategory: exercise.subcategory || null,
    difficulty: exercise.difficulty || 1,
    duration_min: exercise.durationMin || 10,
    equipment: exercise.equipment || [],
    target_positions: exercise.targetPositions || [],
    drills: exercise.drills || [],
    description: exercise.description || null,
  });
  if (error) throw error;
}
