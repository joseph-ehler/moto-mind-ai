-- Debug: Check if event has vehicle_id
SELECT 
  id,
  type,
  date,
  vehicle_id,
  vendor,
  total_amount
FROM vehicle_events
WHERE id = 'ffb05630-b5b7-46dc-b3ce-c2e0df511c1b';

-- If vehicle_id is NULL, the event wasn't assigned to a vehicle
-- If vehicle_id has a value, check if that vehicle exists:

-- Check all vehicles
SELECT 
  id,
  name,
  year,
  make,
  model
FROM vehicles
ORDER BY created_at DESC;

-- If the vehicle_id from the first query doesn't exist in the vehicles table,
-- that's the problem - the vehicle was deleted or never existed.
