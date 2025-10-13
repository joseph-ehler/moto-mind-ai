-- SIMPLE FIX: Disable RLS and fix foreign key
-- Run this entire block in Supabase SQL Editor

-- 1. Disable Row Level Security (for development)
ALTER TABLE conversation_threads DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages DISABLE ROW LEVEL SECURITY;

-- 2. Drop the user_id foreign key constraint (it's causing issues)
ALTER TABLE conversation_threads 
  DROP CONSTRAINT IF EXISTS conversation_threads_user_id_fkey;

-- 3. Recreate the user_id column without the foreign key
-- (This allows us to use a dummy user ID)
-- No need to recreate, just remove the constraint above

-- That's it! Now try the modal again.
