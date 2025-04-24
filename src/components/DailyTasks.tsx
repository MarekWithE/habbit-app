import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

export default function DailyTasks() {
  const [tasks, setTasks] = useState<string[]>([]);
  const [checked, setChecked] = useState<boolean[]>([]);
  const [todayLabel, setTodayLabel] = useState<string>('');

  // 1) Compute "today" as YYYY-MM-DD in CET
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year:   'numeric',
    month:  '2-digit',
    day:    '2-digit'
  }).format(new Date());

  // 2) Prefix for per-task keys
  const keyPrefix = `dailyTasks-${today}-`;

  // 3) Load tasks from CSV, then initialize `checked` from localStorage
  useEffect(() => {
    fetch('/tasks.csv')
      .then(r => r.text())
      .then(csv => {
        const { data } = Papa.parse<{date:string;task1:string;task2:string;task3:string;task4:string;task5:string}>(
          csv,
          { header: true, skipEmptyLines: true }
        );
        const row = data.find(r => r.date.trim() === today) || { task1:'',task2:'',task3:'',task4:'',task5:'' };
        const todayTasks = [row.task1, row.task2, row.task3, row.task4, row.task5];
        setTasks(todayTasks);
        setTodayLabel(`Tasks for ${today}`);

        // build checked[] from localStorage
        const initial = todayTasks.map((_, idx) =>
          localStorage.getItem(keyPrefix + idx) === 'true'
        );
        setChecked(initial);
      })
      .catch(console.error);
  }, [today, keyPrefix]);

  // 4) Toggle handler that also writes to localStorage immediately
  const toggle = (i: number) => {
    setChecked(prev => {
      const nxt = [...prev];
      nxt[i] = !nxt[i];
      // persist that one checkbox
      localStorage.setItem(keyPrefix + i, nxt[i] ? 'true' : 'false');
      return nxt;
    });
  };

  // 5) Reset at next CET midnight
  useEffect(() => {
    const now = new Date();
    const nextMid = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin' })
    );
    nextMid.setHours(24, 0, 0, 0);
    const ms = nextMid.getTime() - now.getTime();
    const t = setTimeout(() => {
      // remove all today's keys
      checked.forEach((_, i) => localStorage.removeItem(keyPrefix + i));
      window.location.reload();
    }, ms);
    return () => clearTimeout(t);
  }, [checked.length, keyPrefix]);

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
              />{' '}
              {t}
            </label>
          </li>
        ))}
      </ol>
    </section>
  );
} 