import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { getTodayTaskProgress, updateTaskProgress, updateTaskStats } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function DailyTasks() {
  const [tasks, setTasks] = useState<string[]>([]);
  const [checked, setChecked] = useState<boolean[]>([]);
  const [todayLabel, setTodayLabel] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // 1) Compute "today" as YYYY-MM-DD in CET
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year:   'numeric',
    month:  '2-digit',
    day:    '2-digit'
  }).format(new Date());

  // 2) Load tasks from CSV and progress from Supabase
  useEffect(() => {
    if (!user) return;

    const loadTasks = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load tasks from CSV
        const response = await fetch('/tasks.csv');
        const csv = await response.text();
        const { data } = Papa.parse<{date:string;task1:string;task2:string;task3:string;task4:string;task5:string}>(
          csv,
          { header: true, skipEmptyLines: true }
        );
        const row = data.find(r => r.date.trim() === today) || { task1:'',task2:'',task3:'',task4:'',task5:'' };
        const todayTasks = [row.task1, row.task2, row.task3, row.task4, row.task5];
        setTasks(todayTasks);
        setTodayLabel(`Tasks for ${today}`);

        // Load progress from Supabase
        const progress = await getTodayTaskProgress(user.id, today);
        const initialChecked = todayTasks.map((_, idx) => 
          progress.find(p => p.task_id === `task${idx + 1}`)?.is_checked || false
        );
        setChecked(initialChecked);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tasks');
        console.error('Error loading tasks:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [today, user]);

  // 3) Toggle handler with Supabase updates
  const toggle = async (i: number) => {
    if (!user) return;

    try {
      setError(null);
      const newChecked = [...checked];
      newChecked[i] = !newChecked[i];
      setChecked(newChecked);

      // Update Supabase
      await updateTaskProgress(user.id, `task${i + 1}`, today, newChecked[i]);

      // Check if all tasks are completed
      const allCompleted = newChecked.every(c => c);
      if (allCompleted) {
        await updateTaskStats(user.id, today, true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      console.error('Error updating task:', err);
      // Revert the checkbox state on error
      setChecked(prev => {
        const next = [...prev];
        next[i] = !next[i];
        return next;
      });
    }
  };

  if (loading) {
    return <div className="daily-tasks">Loading tasks...</div>;
  }

  if (error) {
    return <div className="daily-tasks error">Error: {error}</div>;
  }

  return (
    <section className="daily-tasks">
      <h2>{todayLabel}</h2>
      <ol>
        {tasks.map((t, i) => (
          <li key={i}>
            <label>
              <input
                type="checkbox"
                checked={checked[i] || false}
                onChange={() => toggle(i)}
                disabled={!user}
              />{' '}
              {t}
            </label>
          </li>
        ))}
      </ol>
    </section>
  );
} 