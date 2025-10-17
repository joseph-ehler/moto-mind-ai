-- Temporarily disable RLS for development
-- This makes it easier to test without auth

ALTER TABLE conversation_threads DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages DISABLE ROW LEVEL SECURITY;

-- You can re-enable later with:
-- ALTER TABLE conversation_threads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
