-- Add current_day column to users_meta table
ALTER TABLE users_meta
ADD COLUMN current_day INTEGER DEFAULT 1;

-- Create function to reset current_day when a new week starts
CREATE OR REPLACE FUNCTION reset_current_day()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if it's Sunday at midnight
  IF EXTRACT(DOW FROM CURRENT_TIMESTAMP) = 0 AND 
     EXTRACT(HOUR FROM CURRENT_TIMESTAMP) = 0 AND
     EXTRACT(MINUTE FROM CURRENT_TIMESTAMP) = 0 THEN
    -- Reset the day counter to 1
    NEW.current_day = 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically reset current_day on Sunday midnight
CREATE TRIGGER reset_current_day_trigger
BEFORE UPDATE ON users_meta
FOR EACH ROW
EXECUTE FUNCTION reset_current_day(); 