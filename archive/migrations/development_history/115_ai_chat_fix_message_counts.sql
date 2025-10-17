-- Fix Message Counts for Existing Threads
-- This updates the message_count based on actual messages

-- 1. Update all thread message counts
UPDATE conversation_threads t
SET message_count = (
  SELECT COUNT(*)
  FROM conversation_messages m
  WHERE m.thread_id = t.id
);

-- 2. Update last_message_at
UPDATE conversation_threads t
SET last_message_at = (
  SELECT MAX(created_at)
  FROM conversation_messages m
  WHERE m.thread_id = t.id
);

-- 3. Update thread titles from first user message (if null)
UPDATE conversation_threads t
SET title = (
  SELECT LEFT(content, 60) || CASE WHEN LENGTH(content) > 60 THEN '...' ELSE '' END
  FROM conversation_messages m
  WHERE m.thread_id = t.id AND m.role = 'user'
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE title IS NULL;

-- 4. Verify the triggers exist
SELECT 
  trigger_name, 
  event_object_table, 
  action_timing, 
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN ('conversation_message_created', 'conversation_title_generator');

-- You should see 2 triggers listed above
-- If not, re-run the original migration SQL
