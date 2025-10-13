-- COMPLETE MOCK EVENT DATASET FOR VIN: 1HGBH41JXMN109186 (2021 Honda Accord)
-- This demonstrates all Tier 1 event types with realistic data

-- First, let's assume we have a vehicle record
-- Vehicle: 2021 Honda Accord, VIN: 1HGBH41JXMN109186

-- MOCK EVENTS (Most Recent First)

-- 1. REPAIR EVENT - Alternator Replacement (Emergency Repair)
INSERT INTO vehicle_events (
  id, vehicle_id, type, date, miles, payload
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM vehicles WHERE vin = '1HGBH41JXMN109186' LIMIT 1),
  'repair',
  '2025-09-25',
  87450,
  jsonb_build_object(
    'problem_description', 'Battery not charging, alternator failure',
    'repair_performed', 'Complete alternator replacement with new belt',
    'parts_replaced', ARRAY['Alternator', 'Drive belt', 'Battery terminals'],
    'labor_hours', 3.5,
    'parts_cost', 485.00,
    'labor_cost', 200.00,
    'total_amount', 685.00,
    'warranty_period', '12 months',
    'diagnostic_fee', 0,
    'shop_name', 'Joe''s Auto Repair',
    'vendor', 'Joe''s Auto Repair',
    'kind', 'Alternator replacement',
    'summary', 'Alternator replacement at Joe''s Auto Repair for $685',
    'date', '2025-09-25',
    'mileage', 87450,
    'confidence', 95,
    'source_document_url', 'https://example.com/repair-invoice-001.jpg'
  )
);

-- 2. INSPECTION EVENT - Safety Inspection Passed
INSERT INTO vehicle_events (
  id, vehicle_id, type, date, miles,
  kind, summary,
  payload
) VALUES (
  'inspection-001-' || generate_random_uuid(),
  (SELECT id FROM vehicles WHERE vin = '1HGBH41JXMN109186' LIMIT 1),
  'inspection',
  '2025-09-20',
  87100,
  'Safety inspection passed',
  'Safety inspection passed at State Inspection Station',
  jsonb_build_object(
    'inspection_type', 'safety',
    'result', 'passed',
    'certificate_number', 'SI-2025-789456',
    'inspection_station', 'State Inspection Station',
    'inspector_name', 'Mike Johnson',
    'expiration_date', '2025-12-20',
    'next_due_date', '2025-12-20',
    'items_checked', ARRAY['Brakes', 'Lights', 'Tires', 'Steering', 'Suspension'],
    'notes', 'All systems passed inspection',
    'fee', 25.00,
    'confidence', 98,
    'source_document_url', 'https://example.com/inspection-cert-001.jpg'
  )
);

-- 3. INSURANCE EVENT - Policy Renewal
INSERT INTO vehicle_events (
  id, vehicle_id, type, date, total_amount,
  kind, summary,
  payload
) VALUES (
  'insurance-001-' || generate_random_uuid(),
  (SELECT id FROM vehicles WHERE vin = '1HGBH41JXMN109186' LIMIT 1),
  'insurance',
  '2025-09-18',
  1200.00,
  'Auto insurance renewed',
  'Auto insurance renewed with State Farm for $1,200/year',
  jsonb_build_object(
    'document_type', 'policy_renewal',
    'insurance_company', 'State Farm',
    'policy_number', 'ABC123456789',
    'coverage_type', 'Full coverage',
    'premium_amount', 1200.00,
    'deductible', 500.00,
    'effective_date', '2025-09-18',
    'expiration_date', '2026-03-18',
    'coverage_details', jsonb_build_object(
      'liability', '$100,000/$300,000',
      'collision', '$500 deductible',
      'comprehensive', '$500 deductible',
      'uninsured_motorist', '$100,000/$300,000'
    ),
    'agent_name', 'Sarah Wilson',
    'agent_phone', '555-123-4567',
    'confidence', 96,
    'source_document_url', 'https://example.com/insurance-policy-001.jpg'
  )
);

-- 4. ACCIDENT EVENT - Minor Collision
INSERT INTO vehicle_events (
  id, vehicle_id, type, date, miles,
  kind, summary,
  payload
) VALUES (
  'accident-001-' || generate_random_uuid(),
  (SELECT id FROM vehicles WHERE vin = '1HGBH41JXMN109186' LIMIT 1),
  'accident',
  '2025-09-10',
  86890,
  'Minor collision',
  'Minor collision at Main St & 5th Ave with rear bumper damage',
  jsonb_build_object(
    'document_type', 'police_report',
    'accident_date', '2025-09-10',
    'location', 'Main St & 5th Ave, Downtown',
    'damage_description', 'Rear bumper damage, scratches and dent',
    'other_party_info', jsonb_build_object(
      'name', 'John Smith',
      'insurance', 'Geico',
      'vehicle', 'Honda Civic',
      'license_plate', 'ABC-1234'
    ),
    'police_report_number', 'PR-2025-091045',
    'claim_number', 'CLM789456123',
    'estimated_damage', 2150.00,
    'fault_determination', 'Other party at fault',
    'injuries', 'None reported',
    'weather_conditions', 'Clear, dry',
    'officer_name', 'Officer Martinez',
    'towed', false,
    'confidence', 92,
    'source_document_url', 'https://example.com/police-report-001.jpg'
  )
);

-- 5. SERVICE EVENT - 60K Mile Service
INSERT INTO vehicle_events (
  id, vehicle_id, type, date, miles, total_amount,
  vendor, kind, summary,
  payload
) VALUES (
  'service-001-' || generate_random_uuid(),
  (SELECT id FROM vehicles WHERE vin = '1HGBH41JXMN109186' LIMIT 1),
  'service',
  '2025-08-15',
  60125,
  485.50,
  'Honda Dealership',
  '60K mile service',
  '60K mile service at Honda Dealership for $485.50',
  jsonb_build_object(
    'services_performed', ARRAY['Oil change', 'Filter replacement', 'Brake inspection', 'Tire rotation'],
    'parts_used', ARRAY[
      jsonb_build_object('description', 'Honda Oil Filter', 'price', 15.99, 'quantity', 1),
      jsonb_build_object('description', 'Full Synthetic Oil', 'price', 45.00, 'quantity', 5),
      jsonb_build_object('description', 'Air Filter', 'price', 25.99, 'quantity', 1)
    ],
    'labor_hours', 2.5,
    'next_service_miles', 70000,
    'next_service_date', '2026-02-15',
    'shop_name', 'Honda Dealership',
    'service_advisor', 'Mike Chen',
    'confidence', 98,
    'source_document_url', 'https://example.com/service-invoice-001.jpg'
  )
);

-- 6. FUEL EVENT - Gas Purchase
INSERT INTO vehicle_events (
  id, vehicle_id, type, date, miles, total_amount, gallons,
  station, kind, summary,
  payload
) VALUES (
  'fuel-001-' || generate_random_uuid(),
  (SELECT id FROM vehicles WHERE vin = '1HGBH41JXMN109186' LIMIT 1),
  'fuel',
  '2025-09-22',
  87380,
  52.18,
  14.2,
  'Shell',
  'Fuel purchase',
  'Fuel purchase at Shell for $52.18',
  jsonb_build_object(
    'station_name', 'Shell',
    'station_address', '123 Main Street, Anytown, ST 12345',
    'fuel_type', 'Regular',
    'price_per_gallon', 3.67,
    'gallons', 14.2,
    'total_amount', 52.18,
    'payment_method', 'Credit Card',
    'pump_number', '3',
    'receipt_number', 'R-789456123',
    'mpg_calculated', 24.1,
    'confidence', 94,
    'source_document_url', 'https://example.com/fuel-receipt-001.jpg'
  )
);

-- 7. ODOMETER EVENT - Mileage Reading
INSERT INTO vehicle_events (
  id, vehicle_id, type, date, miles,
  kind, summary,
  payload
) VALUES (
  'odometer-001-' || generate_random_uuid(),
  (SELECT id FROM vehicles WHERE vin = '1HGBH41JXMN109186' LIMIT 1),
  'odometer',
  '2025-09-27',
  87650,
  'Odometer reading',
  '87,650 miles recorded',
  jsonb_build_object(
    'current_mileage', 87650,
    'display_type', 'digital',
    'units', 'miles',
    'reading_quality', 'clear',
    'validation_notes', ARRAY['Reading within expected range'],
    'confidence_adjusted', 96,
    'source_document_url', 'https://example.com/odometer-photo-001.jpg'
  )
);

-- 8. DOCUMENT EVENT - Insurance Card Upload
INSERT INTO vehicle_events (
  id, vehicle_id, type, date,
  doc_type, kind, summary,
  payload
) VALUES (
  'document-001-' || generate_random_uuid(),
  (SELECT id FROM vehicles WHERE vin = '1HGBH41JXMN109186' LIMIT 1),
  'document',
  '2025-09-18',
  'insurance_card',
  'Insurance card saved',
  'Insurance card saved to vehicle records',
  jsonb_build_object(
    'document_type', 'insurance',
    'document_subtype', 'auto_insurance',
    'classification_confidence', 95,
    'expiration_date', '2026-03-18',
    'key_identifiers', ARRAY['Policy: ABC123456789'],
    'insurance_company', 'State Farm',
    'policy_number', 'ABC123456789',
    'source_document_url', 'https://example.com/insurance-card-001.jpg'
  )
);

-- SUMMARY COMMENT
-- This dataset provides complete examples of all 8 event types:
-- 1. REPAIR - Emergency alternator replacement with warranty
-- 2. INSPECTION - Safety inspection with certificate
-- 3. INSURANCE - Policy renewal with full coverage details
-- 4. ACCIDENT - Minor collision with police report
-- 5. SERVICE - Scheduled 60K mile maintenance
-- 6. FUEL - Gas purchase with MPG calculation
-- 7. ODOMETER - Digital mileage reading
-- 8. DOCUMENT - Insurance card classification

-- Each event includes:
-- - Realistic data for a 2021 Honda Accord
-- - Proper payload structure for Vision API results
-- - Source document URLs for original images
-- - Confidence scores and validation data
-- - Rich metadata for timeline display

-- Timeline will show chronological order with beautiful cards:
-- 🔧 Repair (amber) - Emergency fixes with warranty
-- ✅ Inspection (emerald) - Compliance with expiration
-- 🛡️ Insurance (indigo) - Coverage with policy details
-- ⚠️ Accident (red) - Incidents with claim tracking
-- 🔧 Service (orange) - Scheduled maintenance
-- ⛽ Fuel (green) - Purchases with economy tracking
-- 📊 Odometer (blue) - Mileage progression
-- 📄 Document (gray) - Classified document storage
