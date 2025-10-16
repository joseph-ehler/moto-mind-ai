-- Conversation Threads & Messages for AI Assistant
-- Allows persistent, vehicle-specific conversation history

-- Conversation Threads (one per conversation session)
CREATE TABLE IF NOT EXISTS conversation_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT, -- Auto-generated from first message
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  message_count INT DEFAULT 0,
  is_archived BOOLEAN DEFAULT FALSE
);

-- Conversation Messages (individual messages within threads)
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES conversation_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tokens_used INT DEFAULT 0,
  -- Optional: user feedback
  feedback_rating INT CHECK (feedback_rating BETWEEN 1 AND 5),
  feedback_comment TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_threads_vehicle ON conversation_threads(vehicle_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_threads_user ON conversation_threads(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_thread ON conversation_messages(thread_id, created_at ASC);

-- Function to update thread timestamp and message count
CREATE OR REPLACE FUNCTION update_conversation_thread()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversation_threads
  SET 
    updated_at = NOW(),
    last_message_at = NOW(),
    message_count = message_count + 1
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update threads on new messages
DROP TRIGGER IF EXISTS conversation_message_created ON conversation_messages;
CREATE TRIGGER conversation_message_created
AFTER INSERT ON conversation_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_thread();

-- Function to auto-generate thread title from first message
CREATE OR REPLACE FUNCTION generate_thread_title()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT message_count FROM conversation_threads WHERE id = NEW.thread_id) = 1 
     AND NEW.role = 'user' THEN
    UPDATE conversation_threads
    SET title = LEFT(NEW.content, 60) || CASE WHEN LENGTH(NEW.content) > 60 THEN '...' ELSE '' END
    WHERE id = NEW.thread_id AND title IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate title
DROP TRIGGER IF EXISTS conversation_title_generator ON conversation_messages;
CREATE TRIGGER conversation_title_generator
AFTER INSERT ON conversation_messages
FOR EACH ROW
EXECUTE FUNCTION generate_thread_title();

-- Row Level Security
ALTER TABLE conversation_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS conversation_threads_user_policy ON conversation_threads;
DROP POLICY IF EXISTS conversation_messages_user_policy ON conversation_messages;

-- Users can only see their own threads
CREATE POLICY conversation_threads_user_policy ON conversation_threads
  FOR ALL USING (auth.uid() = user_id);

-- Users can only see messages from their threads
CREATE POLICY conversation_messages_user_policy ON conversation_messages
  FOR ALL USING (
    thread_id IN (
      SELECT id FROM conversation_threads WHERE user_id = auth.uid()
    )
  );
