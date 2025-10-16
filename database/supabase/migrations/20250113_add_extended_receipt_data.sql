-- Add extended receipt data fields for fraud detection and compliance
-- These fields capture rich metadata from fuel receipts

-- Add transaction time (separate from date)
ALTER TABLE vehicle_events
ADD COLUMN IF NOT EXISTS transaction_time TIME;

-- Add station address for geofencing
ALTER TABLE vehicle_events
ADD COLUMN IF NOT EXISTS station_address TEXT;

-- Add pump number for fraud detection
ALTER TABLE vehicle_events
ADD COLUMN IF NOT EXISTS pump_number VARCHAR(10);

-- Add payment method for expense tracking
ALTER TABLE vehicle_events
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);

-- Add transaction ID for duplicate detection
ALTER TABLE vehicle_events
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255);

-- Add authorization code for dispute resolution
ALTER TABLE vehicle_events
ADD COLUMN IF NOT EXISTS auth_code VARCHAR(50);

-- Add invoice number for expense reconciliation
ALTER TABLE vehicle_events
ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50);

-- Add receipt metadata as JSONB for flexibility (catch-all for other fields)
ALTER TABLE vehicle_events
ADD COLUMN IF NOT EXISTS receipt_metadata JSONB;

-- Add comments
COMMENT ON COLUMN vehicle_events.transaction_time IS 'Time of transaction (separate from date for precise timestamp)';
COMMENT ON COLUMN vehicle_events.station_address IS 'Full address of gas station for geofencing and location tracking';
COMMENT ON COLUMN vehicle_events.pump_number IS 'Pump number used at station for fraud detection';
COMMENT ON COLUMN vehicle_events.payment_method IS 'Payment method and last 4 digits (e.g., Mastercard ****2273)';
COMMENT ON COLUMN vehicle_events.transaction_id IS 'Unique transaction ID from receipt for duplicate detection';
COMMENT ON COLUMN vehicle_events.auth_code IS 'Authorization code from payment processor for dispute resolution';
COMMENT ON COLUMN vehicle_events.invoice_number IS 'Invoice/receipt number for expense reconciliation';
COMMENT ON COLUMN vehicle_events.receipt_metadata IS 'Additional receipt fields as JSON (site ID, trace ID, merchant ID, etc.)';

-- Create unique index on transaction_id for duplicate detection
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_events_transaction_id 
ON vehicle_events(transaction_id) 
WHERE transaction_id IS NOT NULL;

-- Create index for payment method queries
CREATE INDEX IF NOT EXISTS idx_vehicle_events_payment_method 
ON vehicle_events(payment_method);

-- Create index for pump number (fraud detection)
CREATE INDEX IF NOT EXISTS idx_vehicle_events_pump_number 
ON vehicle_events(pump_number);

-- Create composite index for time-based fraud detection
CREATE INDEX IF NOT EXISTS idx_vehicle_events_date_time 
ON vehicle_events(date, transaction_time);
