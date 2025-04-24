import { useState, useEffect } from 'react';
import Papa from 'papaparse';

type Task = {
  id: string;
  title: string;
  emoji: string;
};

interface DashboardProps {
  completedTasks?: string[];
  userPoints?: number;
  onTaskToggle?: (taskId: string, currentPoints: number, onPointsUpdate: (points: number) => void, onIsAnimatingChange: (isAnimating: boolean) => void) => void;
  onPointsUpdate?: (points: number) => void;
  onIsAnimatingChange?: (isAnimating: boolean) => void;
}

const getEmojiForTask = (taskText: string): string => {
  const text = taskText.toLowerCase();
  
  if (text.includes('workout') || text.includes('exercise') || text.includes('gym') || text.includes('fitness') || text.includes('training')) {
    return '💪';
  } else if (text.includes('tennis') || text.includes('sport') || text.includes('game')) {
    return '🎾';
  } else if (text.includes('email') || text.includes('message') || text.includes('text') || text.includes('contact')) {
    return '📧';
  } else if (text.includes('dog') || text.includes('pet') || text.includes('animal')) {
    return '🐕';
  } else if (text.includes('clip') || text.includes('video') || text.includes('edit')) {
    return '🎬';
  } else if (text.includes('plan') || text.includes('schedule') || text.includes('calendar')) {
    return '📅';
  } else if (text.includes('money') || text.includes('price') || text.includes('sale') || text.includes('profit')) {
    return '💸';
  } else if (text.includes('social') || text.includes('instagram') || text.includes('ig') || text.includes('post')) {
    return '📱';
  } else if (text.includes('sheet') || text.includes('excel') || text.includes('data')) {
    return '📊';
  } else if (text.includes('website') || text.includes('page') || text.includes('landing')) {
    return '🌐';
  } else if (text.includes('meeting') || text.includes('call') || text.includes('appointment')) {
    return '🤝';
  } else {
    return '✅'; // Default emoji
  }
};

export default function Dashboard({ 
  completedTasks = [], 
  userPoints = 0,
  onTaskToggle,
  onPointsUpdate,
  onIsAnimatingChange
}: DashboardProps) {
  const [localCompleted, setLocalCompleted] = useState<Set<string>>(new Set());
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const isStandalone = !onTaskToggle;
  const completed = isStandalone ? localCompleted : new Set(completedTasks);

  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());

  useEffect(() => {
    fetch('/tasks.csv')
      .then(r => r.text())
      .then(csv => Papa.parse<{date:string;task1:string;task2:string;task3:string;task4:string;task5:string}>(csv, {header:true, skipEmptyLines:true}))
      .then(parsed => {
        const row = parsed.data.find(r => r.date.trim() === today);
        if (row) {
          const newTasks = [
            { id: '1', title: row.task1, emoji: getEmojiForTask(row.task1) },
            { id: '2', title: row.task2, emoji: getEmojiForTask(row.task2) },
            { id: '3', title: row.task3, emoji: getEmojiForTask(row.task3) },
            { id: '4', title: row.task4, emoji: getEmojiForTask(row.task4) },
            { id: '5', title: row.task5, emoji: getEmojiForTask(row.task5) }
          ];
          setTasks(newTasks);
        } else {
          setTasks([]);
        }
      })
      .catch(e => setError(e.message));
  }, [today]);

  const toggleTask = (id: string) => {
    if (isStandalone) {
      setLocalCompleted(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    } else if (onTaskToggle && onPointsUpdate && onIsAnimatingChange) {
      onTaskToggle(id, userPoints, onPointsUpdate, onIsAnimatingChange);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Daily Tasks</h3>
          <div className="text-red-500 text-sm">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (tasks === null) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Daily Tasks</h3>
          <div className="text-gray-400 text-sm">Loading tasks...</div>
        </div>
        <div className="bg-[#191919] rounded-xl border border-[#2a2a2a] p-4">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-[#2a2a2a] rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Daily Tasks</h3>
          <div className="text-gray-400 text-sm">No tasks found for {today}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Daily Tasks</h3>
        <div className="flex items-center gap-2">
          <div className="text-[#32ab71] text-base font-medium">{completed.size}/5 completed</div>
          <div className="w-1 h-1 bg-[#2a2a2a] rounded-full"></div>
          <div className="text-gray-400 text-sm">+5 points each</div>
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-[#191919] rounded-xl border border-[#2a2a2a] overflow-hidden">
        <div className="divide-y divide-[#2a2a2a]">
          {tasks.map(task => (
            <button 
              key={task.id} 
              onClick={() => toggleTask(task.id)}
              className={`flex items-center gap-4 p-4 transition-colors w-full text-left ${
                completed.has(task.id) 
                  ? 'bg-[#132d21]' 
                  : 'hover:bg-[#ffffff0f]'
              }`}
            >
              <div className="text-2xl w-8 text-center flex-shrink-0">
                {task.emoji}
              </div>
              <div className="flex-grow">
                <div className={`text-base transition-colors ${
                  completed.has(task.id) 
                    ? 'text-[#32ab71]' 
                    : 'text-white'
                }`}>
                  {task.title}
                </div>
              </div>
              <div className="relative flex items-center flex-shrink-0">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={completed.has(task.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleTask(task.id);
                  }}
                />
                <div className={`w-5 h-5 border-2 rounded transition-all duration-200 ${
                  completed.has(task.id)
                    ? 'bg-[#32ab71] border-[#32ab71]'
                    : 'border-[#2a2a2a] bg-[#191919]'
                }`}></div>
                <svg 
                  className={`absolute w-3 h-3 text-white left-1 top-1 transition-opacity duration-200 ${
                    completed.has(task.id) ? 'opacity-100' : 'opacity-0'
                  }`}
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 