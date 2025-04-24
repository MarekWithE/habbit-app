import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tskychmsoqkdknxitfaw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRza3ljaG1zb3FrZGtueGl0ZmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5Nzk0NzgsImV4cCI6MjA2MDU1NTQ3OH0.Jeiuz6GoBHtR7NeWS7BB5XDTbtiEowATKi-_ikpdNk8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 