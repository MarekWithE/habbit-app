import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export type TaskProgress = {
  id: string;
  user_id: string;
  task_id: string;
  date: string;
  is_checked: boolean;
};

export type TaskStats = {
  user_id: string;
  total_completed_tasks: number;
  current_streak: number;
  last_completed_date: string;
};

// Helper functions
export async function getTodayTaskProgress(userId: string, date: string): Promise<TaskProgress[]> {
  const { data, error } = await supabase
    .from('task_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date);

  if (error) throw error;
  return data || [];
}

export async function updateTaskProgress(
  userId: string,
  taskId: string,
  date: string,
  isChecked: boolean
): Promise<void> {
  // Check if record exists
  const { data: existing } = await supabase
    .from('task_progress')
    .select('id')
    .eq('user_id', userId)
    .eq('task_id', taskId)
    .eq('date', date)
    .single();

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from('task_progress')
      .update({ is_checked: isChecked })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    // Insert new record
    const { error } = await supabase
      .from('task_progress')
      .insert([{ user_id: userId, task_id: taskId, date, is_checked: isChecked }]);
    if (error) throw error;
  }
}

export async function updateTaskStats(
  userId: string,
  date: string,
  allTasksCompleted: boolean
): Promise<void> {
  if (!allTasksCompleted) return;

  const { data: stats } = await supabase
    .from('task_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const updates = {
    total_completed_tasks: (stats?.total_completed_tasks || 0) + 1,
    last_completed_date: date,
    current_streak: stats?.last_completed_date === yesterdayStr
      ? (stats.current_streak || 0) + 1
      : 1
  };

  if (stats) {
    const { error } = await supabase
      .from('task_stats')
      .update(updates)
      .eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('task_stats')
      .insert([{ user_id: userId, ...updates }]);
    if (error) throw error;
  }
} 