-- CORRECTED MOCK EVENT DATASET FOR VIN: 1HGBH41JXMN109186 (2021 Honda Accord)
-- This matches the ACTUAL schema: only id, vehicle_id, type, date, miles, payload, notes, created_at

-- ACTUAL SCHEMA COLUMNS:
-- id UUID, vehicle_id UUID, type TEXT, date DATE, miles INTEGER, payload JSONB, notes TEXT, created_at TIMESTAMPTZ

-- 1. REPAIR EVENT - Alternator Replacement (Emergency Repair)
INSERT INTO vehicle_events (id, vehicle_id, type, date, miles, payload) VALUES (
  gen_random_uuid(),
  (SELECT id FROM vehicles WHERE vin = '1HGBH41JXMN109186' LIMIT 1),
  'maintenance', -- Using 'maintenance' since 'repair' not in schema CHECK constraint
  '2025-09-25',
  87450,
  jsonb_build_object(
    'problem_description', 'Battery not charging, alternator failure',
    'repair_performed', 'Complete alternator replacement with new belt',
    'parts_replaced', ARRAY['Alternator', 'Drive belt', 'Battery terminals'],
    'total_amount', 685.00,
    'warranty_period', '12 months',
    'shop_name', 'Joe''s Auto Repair',
    'vendor', 'Joe''s Auto Repair',
    'kind', 'Alternator replacement',
    'summary', 'Alternator replacement at Joe''s Auto Repair for $685',
    'confidence', 95,
    'source_document_url', 'https://example.com/repair-invoice-001.jpg'
  )
);

-- 2. INSPECTION EVENT - Safety Inspection Passed
INSERT INTO vehicle_events (id, vehicle_id, type, date, miles, payload) VALUES (
  gen_random_uuid(),
  (SELECT id FROM vehicles WHERE vin = '1HGBH41JXMN109186' LIMIT 1),
  'inspection',
  '2025-09-20',
  87100,
  jsonb_build_object(
    'inspection_type', 'safety',
    'result', 'passed',
    'certificate_number', 'SI-2025-789456',
    'inspection_station', 'State Inspection Station',
    'expiration_date', '2025-12-20',
    'kind', 'Safety inspection passed',
    'summary', 'Safety inspection passed at State Inspection Station',
    'confidence', 98,
    'source_document_url', 'https://example.com/inspection-cert-001.jpg'
  )
);

-- 3. INSURANCE EVENT - Policy Renewal
INSERT INTO vehicle_events (id, vehicle_id, type, date, payload) VALUES (
  gen_random_uuid(),
  (SELECT id FROM vehicles WHERE vin = '1HGBH41JXMN109186' LIMIT 1),
  'document', -- Using 'document' since 'insurance' not in schema CHECK constraint
  '2025-09-18',
  jsonb_build_object(
    'document_type', 'insurance',
    'insurance_company', 'State Farm',
    'policy_number', 'ABC123456789',
    'coverage_type', 'Full coverage',
    'premium_amount', 1200.00,
    'total_amount', 1200.00,
    'effective_date', '2025-09-18',
    'expiration_date', '2026-03-18',
    'kind', 'Auto insurance renewed',
    'summary', 'Auto insurance renewed with State Farm for $1,200/year',
    'confidence', 96,
    'source_document_url', 'https://example.com/insurance-policy-001.jpg'
  )
);

-- 4. ACCIDENT EVENT - Minor Collision
INSERT INTO vehicle_events (id, vehicle_id, type, date, miles, payload) VALUES (
  gen_random_uuid(),
  (SELECT id FROM vehicles WHERE vin = '1HGBH41JXMN109186' LIMIT 1),
  'document', -- Using 'document' since 'accident' not in schema CHECK constraint
  '2025-09-10',
  86890,
  jsonb_build_object(
    'document_type', 'accident',
    'accident_date', '2025-09-10',
    'location', 'Main St & 5th Ave, Downtown',
    'damage_description', 'Rear bumper damage, scratches and dent',
    'other_party_info', jsonb_build_object(
      'name', 'John Smith',
      'insurance', 'Geico',
      'vehicle', 'Honda Civic'
    ),
    'police_report_number', 'PR-2025-091045',
    'claim_number', 'CLM789456123',
    'estimated_damage', 2150.00,
    'kind', 'Minor collision',
    'summary', 'Minor collision at Main St & 5th Ave with rear bumper damage',
    'confidence', 92,
    'source_document_url', 'https://example.com/police-report-001.jpg'
  )
);

-- 5. SERVICE EVENT - 60K Mile Service
INSERT INTO vehicle_events (id, vehicle_id, type, date, miles, payload) VALUES (
  gen_random_uuid(),
  (SELECT id FROM vehicles WHERE vin = '1HGBH41JXMN109186' LIMIT 1),
  'maintenance',
  '2025-08-15',
  60125,
  jsonb_build_object(
    'services_performed', ARRAY['Oil change', 'Filter replacement', 'Brake inspection', 'Tire rotation'],
    'total_amount', 485.50,
    'shop_name', 'Honda Dealership',
    'vendor', 'Honda Dealership',
    'next_service_miles', 70000,
    'kind', '60K mile service',
    'summary', '60K mile service at Honda Dealership for $485.50',
    'confidence', 98,
    'source_document_url', 'https://example.com/service-invoice-001.jpg'
  )
);

-- 6. FUEL EVENT - Gas Purchase
INSERT INTO vehicle_events (id, vehicle_id, type, date, miles, payload) VALUES (
  gen_random_uuid(),
  (SELECT id FROM vehicles WHERE vin = '1HGBH41JXMN109186' LIMIT 1),
  'fuel',
  '2025-09-22',
  87380,
  jsonb_build_object(
    'station_name', 'Shell',
    'station', 'Shell',
    'fuel_type', 'Regular',
    'price_per_gallon', 3.67,
    'gallons', 14.2,
    'total_amount', 52.18,
    'mpg_calculated', 24.1,
    'kind', 'Fuel purchase',
    'summary', 'Fuel purchase at Shell for $52.18',
    'confidence', 94,
    'source_document_url', 'https://example.com/fuel-receipt-001.jpg'
  )
);

-- 7. ODOMETER EVENT - Mileage Reading
INSERT INTO vehicle_events (id, vehicle_id, type, date, miles, payload) VALUES (
  gen_random_uuid(),
  (SELECT id FROM vehicles WHERE vin = '1HGBH41JXMN109186' LIMIT 1),
  'odometer',
  '2025-09-27',
  87650,
  jsonb_build_object(
    'current_mileage', 87650,
    'display_type', 'digital',
    'reading_quality', 'clear',
    'kind', 'Odometer reading',
    'summary', '87,650 miles recorded',
    'confidence', 96,
    'source_document_url', 'https://example.com/odometer-photo-001.jpg'
  )
);

-- 8. DOCUMENT EVENT - Insurance Card Upload
INSERT INTO vehicle_events (id, vehicle_id, type, date, payload) VALUES (
  gen_random_uuid(),
  (SELECT id FROM vehicles WHERE vin = '1HGBH41JXMN109186' LIMIT 1),
  'document',
  '2025-09-18',
  jsonb_build_object(
    'document_type', 'insurance_card',
    'doc_type', 'insurance_card',
    'insurance_company', 'State Farm',
    'policy_number', 'ABC123456789',
    'expiration_date', '2026-03-18',
    'kind', 'Insurance card saved',
    'summary', 'Insurance card saved to vehicle records',
    'confidence', 95,
    'source_document_url', 'https://example.com/insurance-card-001.jpg'
  )
);

-- SUMMARY:
-- This dataset provides examples using ONLY the actual schema columns:
-- - id, vehicle_id, type, date, miles, payload (all rich data goes here)
-- - created_at is auto-populated by the database
-- - All UI-expected fields (vendor, kind, summary, etc.) are in payload JSONB
-- - Uses only valid type values: 'fuel', 'maintenance', 'odometer', 'document', 'inspection'
-- - The UI components read from payload->>'field_name' to display rich data
