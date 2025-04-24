export interface DashboardProps {
  session: {
    user: {
      id: string;
      email: string;
    };
  };
  user: {
    id: string;
    username: string;
    points: number;
    rank: string;
    streak: number;
  };
  leaderboard: Array<{
    username: string;
    points: number;
    rank: string;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    points: number;
    timestamp: string;
  }>;
}

export interface User {
  id: string;
  username: string;
  points: number;
  rank: string;
  streak: number;
  last_date: string;
}

export interface LeaderboardEntry {
  username: string;
  points: number;
  rank: string;
}

export interface RecentActivity {
  type: string;
  description: string;
  points: number;
  timestamp: string;
}

export interface Habit {
  id: string;
  user_id: string;
  category: string;
  checked: boolean;
  created_at: string;
  updated_at: string;
} 