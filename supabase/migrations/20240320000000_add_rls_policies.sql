-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON users_meta;
DROP POLICY IF EXISTS "Users can update their own profile" ON users_meta;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users_meta;
DROP POLICY IF EXISTS "Service role can access all rows" ON users_meta;

-- Enable Row Level Security
ALTER TABLE users_meta ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
ON users_meta FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON users_meta FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON users_meta FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create a policy for service role to access all rows
CREATE POLICY "Service role can access all rows"
ON users_meta FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Create a policy to allow authenticated users to update their own records
CREATE POLICY "Authenticated users can update their own records"
ON users_meta FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create a policy to allow authenticated users to insert their own records
CREATE POLICY "Authenticated users can insert their own records"
ON users_meta FOR INSERT
WITH CHECK (auth.uid() = id); 