-- Add metadata and actions columns to conversation_messages
-- For storing photo URLs and AI actions

ALTER TABLE conversation_messages
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

ALTER TABLE conversation_messages
ADD COLUMN IF NOT EXISTS actions JSONB DEFAULT NULL;

-- Index for querying messages with photos
CREATE INDEX IF NOT EXISTS idx_conversation_messages_metadata 
ON conversation_messages USING GIN (metadata);

-- Comment
COMMENT ON COLUMN conversation_messages.metadata IS 'Stores additional message data like photo_urls, attachments, etc.';
COMMENT ON COLUMN conversation_messages.actions IS 'Stores AI-detected actions for the message (proposals, reminders, etc.)';
