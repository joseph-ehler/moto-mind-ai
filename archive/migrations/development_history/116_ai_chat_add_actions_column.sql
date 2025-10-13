-- Add actions column to conversation_messages
-- This stores action buttons so they persist on refresh

ALTER TABLE conversation_messages 
ADD COLUMN IF NOT EXISTS actions JSONB DEFAULT '[]'::jsonb;

-- Add index for better performance when querying
CREATE INDEX IF NOT EXISTS idx_conversation_messages_actions 
ON conversation_messages USING gin(actions);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'conversation_messages' AND column_name = 'actions';
