-- RICH MOCK DATA WITH PROPER JSON SCHEMA FOR EACH EVENT TYPE
-- This matches the real data structure that powers the UI detail blocks

BEGIN;

DO $$
DECLARE 
    v_vehicle_id uuid; 
    v_tenant_id uuid; 
BEGIN 
    -- Get vehicle info once
    SELECT id, tenant_id INTO v_vehicle_id, v_tenant_id 
    FROM public.vehicles 
    WHERE vin = '1HGBH41JXMN109186' 
    AND deleted_at IS NULL 
    LIMIT 1;

    -- Abort if VIN not found
    IF v_vehicle_id IS NULL THEN 
        RAISE EXCEPTION 'VIN not found or deleted'; 
    END IF;

    -- Insert all events with RICH, CONTEXTUAL JSON SCHEMAS
    INSERT INTO public.vehicle_events (id, tenant_id, vehicle_id, type, date, miles, payload) VALUES 
    
    -- 1. MAINTENANCE EVENT - 60K Mile Service (RICH SERVICE SCHEMA)
    (extensions.uuid_generate_v4(), v_tenant_id, v_vehicle_id, 'maintenance', '2025-08-15', 60125, 
     jsonb_build_object(
         'type', 'service_invoice',
         'summary', 'Service • oil change, filter replacement, brake inspection',
         'vendor', 'Honda Dealership',
         'kind', '60K mile service',
         'total_amount', 485.50,
         'confidence', 98,
         'allow_rollover', true,
         'key_facts', jsonb_build_object(
             'cost', 485.50,
             'vendor', 'Honda Dealership',
             'mileage', 60125,
             'category', 'scheduled_maintenance',
             'services', ARRAY['oil_change', 'filter_replacement', 'brake_inspection', 'tire_rotation'],
             'next_due_miles', 70000
         ),
         'validation', jsonb_build_object(
             'rollup', 'ok',
             'date_is_recent', true,
             'has_vehicle_info', true,
             'service_detected', true,
             'vendor_identified', true,
             'amount_makes_sense', true,
             'confidence_adequate', true,
             'extraction_complete', true
         ),
         'vehicle_info', jsonb_build_object(
             'vin', '1HGBH41JXMN109186',
             'make', 'Honda',
             'year', 2021,
             'model', 'Accord',
             'odometer', 60125,
             'license_plate', null
         ),
         'extracted_data', jsonb_build_object(
             'shop_name', 'Honda Dealership',
             'parts_used', ARRAY[
                 jsonb_build_object('price', 24.99, 'quantity', 1, 'part_name', 'Oil Filter'),
                 jsonb_build_object('price', 45.00, 'quantity', 5, 'part_name', '5W-30 Motor Oil'),
                 jsonb_build_object('price', 18.99, 'quantity', 1, 'part_name', 'Air Filter'),
                 jsonb_build_object('price', 12.50, 'quantity', 1, 'part_name', 'Cabin Filter')
             ],
             'labor_hours', 2.5,
             'labor_amount', 275.00,
             'services_performed', '60K mile interval scheduled maintenance service'
         ),
         'quality_signals', jsonb_build_object(
             'edit_count', 0,
             'user_edited', false,
             'fields_corrected', ARRAY[]::text[],
             'verification_status', 'pending'
         ),
         'document_details', jsonb_build_object(
             'date', '2025-08-15',
             'currency', 'USD',
             'location', null,
             'total_amount', 485.50,
             'business_name', 'Honda Dealership'
         ),
         'processing_metadata', jsonb_build_object(
             'started_at', '2025-08-15T10:30:00.000Z',
             'finished_at', '2025-08-15T10:35:00.000Z',
             'model_version', 'gpt-4o-mini-2025-09-12',
             'pipeline_version', '1.0.0',
             'processing_time_ms', 5000,
             'prompt_template_id', 'service_v1'
         ),
         'source_document_url', 'https://example.com/service-invoice-001.jpg'
     )),
    
    -- 2. ACCIDENT EVENT - Minor Collision (RICH ACCIDENT SCHEMA)
    (extensions.uuid_generate_v4(), v_tenant_id, v_vehicle_id, 'document', '2025-09-10', 86890, 
     jsonb_build_object(
         'type', 'accident_report',
         'summary', 'Accident • rear-end collision with minor damage',
         'vendor', null,
         'kind', 'Minor collision',
         'total_amount', null,
         'confidence', 92,
         'allow_rollover', true,
         'doc_type', 'accident_report',
         'document_type', 'accident_report',
         'key_facts', jsonb_build_object(
             'accident_type', 'rear_end_collision',
             'severity', 'minor',
             'location', 'Main St & 5th Ave, Downtown',
             'damage_estimate', 2150.00,
             'other_party_involved', true,
             'police_report_filed', true
         ),
         'validation', jsonb_build_object(
             'rollup', 'ok',
             'date_is_recent', true,
             'has_vehicle_info', true,
             'location_identified', true,
             'damage_assessed', true,
             'confidence_adequate', true,
             'extraction_complete', true
         ),
         'vehicle_info', jsonb_build_object(
             'vin', '1HGBH41JXMN109186',
             'make', 'Honda',
             'year', 2021,
             'model', 'Accord',
             'odometer', 86890,
             'license_plate', null
         ),
         'extracted_data', jsonb_build_object(
             'accident_date', '2025-09-10',
             'location', 'Main St & 5th Ave, Downtown',
             'damage_description', 'Rear bumper damage, scratches and dent',
             'other_party_info', jsonb_build_object(
                 'name', 'John Smith',
                 'insurance', 'Geico',
                 'vehicle', 'Honda Civic',
                 'license_plate', 'ABC123'
             ),
             'police_report_number', 'PR-2025-091045',
             'claim_number', 'CLM789456123',
             'estimated_damage', 2150.00,
             'weather_conditions', 'Clear',
             'road_conditions', 'Dry'
         ),
         'quality_signals', jsonb_build_object(
             'edit_count', 0,
             'user_edited', false,
             'fields_corrected', ARRAY[]::text[],
             'verification_status', 'pending'
         ),
         'document_details', jsonb_build_object(
             'date', '2025-09-10',
             'currency', 'USD',
             'location', 'Main St & 5th Ave, Downtown',
             'total_amount', null,
             'business_name', 'Police Department'
         ),
         'processing_metadata', jsonb_build_object(
             'started_at', '2025-09-10T14:15:00.000Z',
             'finished_at', '2025-09-10T14:20:00.000Z',
             'model_version', 'gpt-4o-mini-2025-09-12',
             'pipeline_version', '1.0.0',
             'processing_time_ms', 4500,
             'prompt_template_id', 'accident_v1'
         ),
         'source_document_url', 'https://example.com/police-report-001.jpg'
     )),
    
    -- 3. INSPECTION EVENT - Safety Inspection (RICH INSPECTION SCHEMA)
    (extensions.uuid_generate_v4(), v_tenant_id, v_vehicle_id, 'inspection', '2025-09-20', 87100, 
     jsonb_build_object(
         'type', 'inspection_certificate',
         'summary', 'Inspection • safety inspection passed',
         'vendor', 'State Inspection Station',
         'kind', 'Safety inspection passed',
         'total_amount', 35.00,
         'confidence', 98,
         'allow_rollover', true,
         'inspection_type', 'safety',
         'result', 'passed',
         'key_facts', jsonb_build_object(
             'inspection_type', 'safety',
             'result', 'passed',
             'certificate_number', 'SI-2025-789456',
             'expiration_date', '2025-12-20',
             'station_name', 'State Inspection Station',
             'fee_paid', 35.00
         ),
         'validation', jsonb_build_object(
             'rollup', 'ok',
             'date_is_recent', true,
             'has_vehicle_info', true,
             'certificate_valid', true,
             'station_identified', true,
             'confidence_adequate', true,
             'extraction_complete', true
         ),
         'vehicle_info', jsonb_build_object(
             'vin', '1HGBH41JXMN109186',
             'make', 'Honda',
             'year', 2021,
             'model', 'Accord',
             'odometer', 87100,
             'license_plate', null
         ),
         'extracted_data', jsonb_build_object(
             'certificate_number', 'SI-2025-789456',
             'inspection_station', 'State Inspection Station',
             'inspector_name', 'Mike Johnson',
             'inspector_license', 'INS-12345',
             'expiration_date', '2025-12-20',
             'items_checked', ARRAY['brakes', 'lights', 'tires', 'exhaust', 'steering', 'suspension'],
             'items_passed', ARRAY['brakes', 'lights', 'tires', 'exhaust', 'steering', 'suspension'],
             'items_failed', ARRAY[]::text[],
             'fee_amount', 35.00
         ),
         'quality_signals', jsonb_build_object(
             'edit_count', 0,
             'user_edited', false,
             'fields_corrected', ARRAY[]::text[],
             'verification_status', 'verified'
         ),
         'document_details', jsonb_build_object(
             'date', '2025-09-20',
             'currency', 'USD',
             'location', 'State Inspection Station',
             'total_amount', 35.00,
             'business_name', 'State Inspection Station'
         ),
         'processing_metadata', jsonb_build_object(
             'started_at', '2025-09-20T09:00:00.000Z',
             'finished_at', '2025-09-20T09:03:00.000Z',
             'model_version', 'gpt-4o-mini-2025-09-12',
             'pipeline_version', '1.0.0',
             'processing_time_ms', 3000,
             'prompt_template_id', 'inspection_v1'
         ),
         'source_document_url', 'https://example.com/inspection-cert-001.jpg'
     )),
    
    -- 4. FUEL EVENT - Gas Purchase (RICH FUEL SCHEMA)
    (extensions.uuid_generate_v4(), v_tenant_id, v_vehicle_id, 'fuel', '2025-09-22', 87380, 
     jsonb_build_object(
         'type', 'fuel_receipt',
         'summary', 'Fuel • 14.2 gallons at Shell for $52.18',
         'vendor', null,
         'station', 'Shell',
         'kind', 'Fuel purchase',
         'total_amount', 52.18,
         'gallons', 14.2,
         'confidence', 94,
         'allow_rollover', true,
         'key_facts', jsonb_build_object(
             'station_name', 'Shell',
             'fuel_type', 'Regular',
             'gallons', 14.2,
             'price_per_gallon', 3.67,
             'total_cost', 52.18,
             'payment_method', 'credit_card'
         ),
         'validation', jsonb_build_object(
             'rollup', 'ok',
             'date_is_recent', true,
             'has_vehicle_info', true,
             'station_identified', true,
             'amount_makes_sense', true,
             'confidence_adequate', true,
             'extraction_complete', true
         ),
         'vehicle_info', jsonb_build_object(
             'vin', '1HGBH41JXMN109186',
             'make', 'Honda',
             'year', 2021,
             'model', 'Accord',
             'odometer', 87380,
             'license_plate', null
         ),
         'extracted_data', jsonb_build_object(
             'station_name', 'Shell',
             'station_address', '123 Main St, Anytown, ST 12345',
             'fuel_type', 'Regular Unleaded',
             'octane_rating', 87,
             'price_per_gallon', 3.67,
             'gallons_purchased', 14.2,
             'total_amount', 52.18,
             'payment_method', 'Visa Credit',
             'card_last_four', '1234',
             'pump_number', 3,
             'transaction_id', 'TXN789456123'
         ),
         'quality_signals', jsonb_build_object(
             'edit_count', 0,
             'user_edited', false,
             'fields_corrected', ARRAY[]::text[],
             'verification_status', 'pending'
         ),
         'document_details', jsonb_build_object(
             'date', '2025-09-22',
             'currency', 'USD',
             'location', 'Shell Station',
             'total_amount', 52.18,
             'business_name', 'Shell'
         ),
         'processing_metadata', jsonb_build_object(
             'started_at', '2025-09-22T16:45:00.000Z',
             'finished_at', '2025-09-22T16:48:00.000Z',
             'model_version', 'gpt-4o-mini-2025-09-12',
             'pipeline_version', '1.0.0',
             'processing_time_ms', 2800,
             'prompt_template_id', 'fuel_v1'
         ),
         'source_document_url', 'https://example.com/fuel-receipt-001.jpg'
     )),
    
    -- 5. REPAIR EVENT - Alternator Replacement (RICH REPAIR SCHEMA)
    (extensions.uuid_generate_v4(), v_tenant_id, v_vehicle_id, 'maintenance', '2025-09-25', 87450, 
     jsonb_build_object(
         'type', 'repair_invoice',
         'summary', 'Repair • alternator replacement with warranty',
         'vendor', 'Joe''s Auto Repair',
         'kind', 'Alternator replacement',
         'total_amount', 685.00,
         'confidence', 95,
         'allow_rollover', true,
         'event_type', 'repair',
         'key_facts', jsonb_build_object(
             'repair_type', 'alternator_replacement',
             'cost', 685.00,
             'vendor', 'Joe''s Auto Repair',
             'mileage', 87450,
             'category', 'electrical_repair',
             'warranty_period', '12 months',
             'urgency', 'emergency'
         ),
         'validation', jsonb_build_object(
             'rollup', 'ok',
             'date_is_recent', true,
             'has_vehicle_info', true,
             'repair_identified', true,
             'vendor_identified', true,
             'amount_makes_sense', true,
             'confidence_adequate', true,
             'extraction_complete', true
         ),
         'vehicle_info', jsonb_build_object(
             'vin', '1HGBH41JXMN109186',
             'make', 'Honda',
             'year', 2021,
             'model', 'Accord',
             'odometer', 87450,
             'license_plate', null
         ),
         'extracted_data', jsonb_build_object(
             'shop_name', 'Joe''s Auto Repair',
             'problem_description', 'Battery not charging, alternator failure',
             'repair_performed', 'Complete alternator replacement with new belt',
             'parts_replaced', ARRAY[
                 jsonb_build_object('price', 425.00, 'quantity', 1, 'part_name', 'Alternator', 'part_number', 'ALT-12345'),
                 jsonb_build_object('price', 35.00, 'quantity', 1, 'part_name', 'Drive Belt', 'part_number', 'BELT-67890'),
                 jsonb_build_object('price', 15.00, 'quantity', 2, 'part_name', 'Battery Terminal', 'part_number', 'TERM-11111')
             ],
             'labor_hours', 3.5,
             'labor_amount', 210.00,
             'warranty_period', '12 months',
             'warranty_miles', 12000,
             'next_service_recommendation', 'Check charging system in 6 months'
         ),
         'quality_signals', jsonb_build_object(
             'edit_count', 0,
             'user_edited', false,
             'fields_corrected', ARRAY[]::text[],
             'verification_status', 'pending'
         ),
         'document_details', jsonb_build_object(
             'date', '2025-09-25',
             'currency', 'USD',
             'location', 'Joe''s Auto Repair',
             'total_amount', 685.00,
             'business_name', 'Joe''s Auto Repair'
         ),
         'processing_metadata', jsonb_build_object(
             'started_at', '2025-09-25T11:20:00.000Z',
             'finished_at', '2025-09-25T11:28:00.000Z',
             'model_version', 'gpt-4o-mini-2025-09-12',
             'pipeline_version', '1.0.0',
             'processing_time_ms', 8000,
             'prompt_template_id', 'repair_v1'
         ),
         'source_document_url', 'https://example.com/repair-invoice-001.jpg'
     )),
    
    -- 6. ODOMETER EVENT - Mileage Reading (RICH ODOMETER SCHEMA)
    (extensions.uuid_generate_v4(), v_tenant_id, v_vehicle_id, 'odometer', '2025-09-27', 87460, 
     jsonb_build_object(
         'type', 'odometer_reading',
         'summary', 'Odometer • 87,460 miles recorded',
         'vendor', null,
         'kind', 'Odometer reading',
         'total_amount', null,
         'confidence', 96,
         'allow_rollover', true,
         'key_facts', jsonb_build_object(
             'current_mileage', 87460,
             'reading_type', 'digital',
             'reading_quality', 'clear',
             'photo_quality', 'excellent'
         ),
         'validation', jsonb_build_object(
             'rollup', 'ok',
             'date_is_recent', true,
             'has_vehicle_info', true,
             'mileage_reasonable', true,
             'photo_clear', true,
             'confidence_adequate', true,
             'extraction_complete', true
         ),
         'vehicle_info', jsonb_build_object(
             'vin', '1HGBH41JXMN109186',
             'make', 'Honda',
             'year', 2021,
             'model', 'Accord',
             'odometer', 87460,
             'license_plate', null
         ),
         'extracted_data', jsonb_build_object(
             'current_mileage', 87460,
             'display_type', 'digital',
             'reading_quality', 'clear',
             'dashboard_visible', true,
             'warning_lights', ARRAY[]::text[],
             'fuel_level', 'half_tank',
             'trip_meter_a', 234.5,
             'trip_meter_b', 1567.8
         ),
         'quality_signals', jsonb_build_object(
             'edit_count', 0,
             'user_edited', false,
             'fields_corrected', ARRAY[]::text[],
             'verification_status', 'verified'
         ),
         'document_details', jsonb_build_object(
             'date', '2025-09-27',
             'currency', null,
             'location', null,
             'total_amount', null,
             'business_name', null
         ),
         'processing_metadata', jsonb_build_object(
             'started_at', '2025-09-27T08:30:00.000Z',
             'finished_at', '2025-09-27T08:32:00.000Z',
             'model_version', 'gpt-4o-mini-2025-09-12',
             'pipeline_version', '1.0.0',
             'processing_time_ms', 2000,
             'prompt_template_id', 'odometer_v1'
         ),
         'source_document_url', 'https://example.com/odometer-photo-001.jpg'
     )),
    
    -- 7. INSURANCE POLICY EVENT (RICH INSURANCE SCHEMA)
    (extensions.uuid_generate_v4(), v_tenant_id, v_vehicle_id, 'document', '2025-09-18', NULL, 
     jsonb_build_object(
         'type', 'insurance_policy',
         'summary', 'Insurance • policy renewed with State Farm',
         'vendor', 'State Farm',
         'kind', 'Auto insurance renewed',
         'total_amount', 1200.00,
         'confidence', 96,
         'doc_type', 'insurance_policy',
         'document_type', 'insurance_policy',
         'key_facts', jsonb_build_object(
             'insurance_company', 'State Farm',
             'policy_number', 'ABC123456789',
             'coverage_type', 'Full Coverage',
             'premium_amount', 1200.00,
             'policy_period', '6 months',
             'effective_date', '2025-09-18',
             'expiration_date', '2026-03-18'
         ),
         'validation', jsonb_build_object(
             'rollup', 'ok',
             'date_is_recent', true,
             'has_vehicle_info', true,
             'policy_valid', true,
             'company_identified', true,
             'confidence_adequate', true,
             'extraction_complete', true
         ),
         'vehicle_info', jsonb_build_object(
             'vin', '1HGBH41JXMN109186',
             'make', 'Honda',
             'year', 2021,
             'model', 'Accord',
             'odometer', null,
             'license_plate', null
         ),
         'extracted_data', jsonb_build_object(
             'insurance_company', 'State Farm',
             'policy_number', 'ABC123456789',
             'agent_name', 'Sarah Johnson',
             'agent_phone', '555-123-4567',
             'coverage_details', jsonb_build_object(
                 'liability', jsonb_build_object('bodily_injury', '250000/500000', 'property_damage', '100000'),
                 'comprehensive', jsonb_build_object('deductible', 500),
                 'collision', jsonb_build_object('deductible', 500),
                 'uninsured_motorist', jsonb_build_object('bodily_injury', '250000/500000')
             ),
             'premium_breakdown', jsonb_build_object(
                 'liability', 450.00,
                 'comprehensive', 275.00,
                 'collision', 425.00,
                 'uninsured_motorist', 50.00
             ),
             'discounts_applied', ARRAY['safe_driver', 'multi_policy', 'good_student'],
             'effective_date', '2025-09-18',
             'expiration_date', '2026-03-18'
         ),
         'quality_signals', jsonb_build_object(
             'edit_count', 0,
             'user_edited', false,
             'fields_corrected', ARRAY[]::text[],
             'verification_status', 'verified'
         ),
         'document_details', jsonb_build_object(
             'date', '2025-09-18',
             'currency', 'USD',
             'location', null,
             'total_amount', 1200.00,
             'business_name', 'State Farm'
         ),
         'processing_metadata', jsonb_build_object(
             'started_at', '2025-09-18T14:00:00.000Z',
             'finished_at', '2025-09-18T14:05:00.000Z',
             'model_version', 'gpt-4o-mini-2025-09-12',
             'pipeline_version', '1.0.0',
             'processing_time_ms', 5000,
             'prompt_template_id', 'insurance_v1'
         ),
         'source_document_url', 'https://example.com/insurance-policy-001.jpg'
     )),
    
    -- 8. INSURANCE CARD EVENT (RICH INSURANCE CARD SCHEMA)
    (extensions.uuid_generate_v4(), v_tenant_id, v_vehicle_id, 'document', '2025-09-18', NULL, 
     jsonb_build_object(
         'type', 'insurance_card',
         'summary', 'Insurance • card saved to records',
         'vendor', 'State Farm',
         'kind', 'Insurance card saved',
         'total_amount', null,
         'confidence', 95,
         'doc_type', 'insurance_card',
         'document_type', 'insurance_card',
         'key_facts', jsonb_build_object(
             'insurance_company', 'State Farm',
             'policy_number', 'ABC123456789',
             'card_type', 'digital',
             'expiration_date', '2026-03-18'
         ),
         'validation', jsonb_build_object(
             'rollup', 'ok',
             'date_is_recent', true,
             'has_vehicle_info', true,
             'card_valid', true,
             'company_identified', true,
             'confidence_adequate', true,
             'extraction_complete', true
         ),
         'vehicle_info', jsonb_build_object(
             'vin', '1HGBH41JXMN109186',
             'make', 'Honda',
             'year', 2021,
             'model', 'Accord',
             'odometer', null,
             'license_plate', null
         ),
         'extracted_data', jsonb_build_object(
             'insurance_company', 'State Farm',
             'policy_number', 'ABC123456789',
             'policy_holder', 'John Doe',
             'effective_date', '2025-09-18',
             'expiration_date', '2026-03-18',
             'card_number', 'CARD-987654321',
             'emergency_phone', '1-800-STATE-FARM'
         ),
         'quality_signals', jsonb_build_object(
             'edit_count', 0,
             'user_edited', false,
             'fields_corrected', ARRAY[]::text[],
             'verification_status', 'verified'
         ),
         'document_details', jsonb_build_object(
             'date', '2025-09-18',
             'currency', null,
             'location', null,
             'total_amount', null,
             'business_name', 'State Farm'
         ),
         'processing_metadata', jsonb_build_object(
             'started_at', '2025-09-18T14:10:00.000Z',
             'finished_at', '2025-09-18T14:12:00.000Z',
             'model_version', 'gpt-4o-mini-2025-09-12',
             'pipeline_version', '1.0.0',
             'processing_time_ms', 2000,
             'prompt_template_id', 'insurance_card_v1'
         ),
         'source_document_url', 'https://example.com/insurance-card-001.jpg'
     ));

    RAISE NOTICE 'Successfully inserted 8 RICH events with proper JSON schemas for vehicle % (tenant %)', v_vehicle_id, v_tenant_id;
    
END $$;

COMMIT;

-- Verification query to see the rich data
SELECT 
    type,
    vendor,
    station,
    total_amount,
    gallons,
    kind,
    summary,
    doc_type,
    confidence,
    jsonb_pretty(payload->'key_facts') as key_facts,
    jsonb_pretty(payload->'extracted_data') as extracted_data,
    created_at
FROM public.vehicle_events ve
JOIN public.vehicles v ON ve.vehicle_id = v.id
WHERE v.vin = '1HGBH41JXMN109186'
ORDER BY date DESC, created_at DESC
LIMIT 10;
