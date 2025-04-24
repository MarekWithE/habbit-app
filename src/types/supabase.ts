export interface Database {
  public: {
    Tables: {
      users_meta: {
        Row: {
          id: string
          user_id: string
          points: number
          weekly_challenge_completions: number
          weekly_challenge_reset_date: string
          current_day: number
          last_task_reset: string | null
          last_weekly_challenge_completed: string | null
          avatar_url: string | null
          full_name: string | null
          bio: string | null
          country: string | null
        }
        Insert: {
          id: string
          user_id: string
          points?: number
          weekly_challenge_completions?: number
          weekly_challenge_reset_date?: string
          current_day?: number
          last_task_reset?: string | null
          last_weekly_challenge_completed?: string | null
          avatar_url?: string | null
          full_name?: string | null
          bio?: string | null
          country?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          points?: number
          weekly_challenge_completions?: number
          weekly_challenge_reset_date?: string
          current_day?: number
          last_task_reset?: string | null
          last_weekly_challenge_completed?: string | null
          avatar_url?: string | null
          full_name?: string | null
          bio?: string | null
          country?: string | null
        }
      }
      tasks: {
        Row: {
          id: string
          day: number
          date: string
          task1: string
          task2: string
          task3: string
          task4: string
          task5: string
          weekly_challenge: string | null
          created_at: string
        }
        Insert: {
          id?: string
          day: number
          date: string
          task1: string
          task2: string
          task3: string
          task4: string
          task5: string
          weekly_challenge?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          day?: number
          date?: string
          task1?: string
          task2?: string
          task3?: string
          task4?: string
          task5?: string
          weekly_challenge?: string | null
          created_at?: string
        }
      }
      completed_tasks: {
        Row: {
          id: string
          user_id: string
          task_id: string
          completed_at: string
          date: string
        }
        Insert: {
          id?: string
          user_id: string
          task_id: string
          completed_at?: string
          date?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string
          completed_at?: string
          date?: string
        }
      }
    }
  }
}




