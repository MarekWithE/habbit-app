-- Create task_progress table
CREATE TABLE IF NOT EXISTS task_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  date DATE NOT NULL,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, task_id, date)
);

-- Create task_stats table
CREATE TABLE IF NOT EXISTS task_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_completed_tasks INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  last_completed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_task_progress_user_date ON task_progress(user_id, date);
CREATE INDEX IF NOT EXISTS idx_task_progress_task_date ON task_progress(task_id, date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_task_progress_updated_at
  BEFORE UPDATE ON task_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_stats_updated_at
  BEFORE UPDATE ON task_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE task_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_stats ENABLE ROW LEVEL SECURITY;

-- Task progress policies
CREATE POLICY "Users can view their own task progress"
  ON task_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task progress"
  ON task_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task progress"
  ON task_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Task stats policies
CREATE POLICY "Users can view their own task stats"
  ON task_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task stats"
  ON task_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task stats"
  ON task_stats FOR UPDATE
  USING (auth.uid() = user_id); 