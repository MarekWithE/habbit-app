-- Enable RLS
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;

-- Create policy to enable read access for all authenticated users
CREATE POLICY "Enable read access for authenticated users"
ON daily_tasks
FOR SELECT
TO authenticated
USING (true);

-- Create policy to enable read access for users_meta
ALTER TABLE users_meta ENABLE ROW LEVEL SECURITY;

-- Allow users to read and update their own data
CREATE POLICY "Users can read own data"
ON users_meta
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update own data"
ON users_meta
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow users to insert their own data
CREATE POLICY "Users can insert own data"
ON users_meta
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid()); 