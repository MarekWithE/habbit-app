-- Add weekly challenge completion tracking columns
ALTER TABLE users_meta
ADD COLUMN weekly_challenge_completions INTEGER DEFAULT 0,
ADD COLUMN weekly_challenge_reset_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create a function to reset weekly challenge completions
CREATE OR REPLACE FUNCTION reset_weekly_challenge_completions()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if it's Sunday at midnight
  IF EXTRACT(DOW FROM CURRENT_TIMESTAMP) = 0 AND 
     EXTRACT(HOUR FROM CURRENT_TIMESTAMP) = 0 AND
     EXTRACT(MINUTE FROM CURRENT_TIMESTAMP) = 0 THEN
    -- Reset the counter and update the reset date
    NEW.weekly_challenge_completions = 0;
    NEW.weekly_challenge_reset_date = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically reset completions on Sunday midnight
CREATE TRIGGER reset_weekly_challenge_completions_trigger
BEFORE UPDATE ON users_meta
FOR EACH ROW
EXECUTE FUNCTION reset_weekly_challenge_completions(); 