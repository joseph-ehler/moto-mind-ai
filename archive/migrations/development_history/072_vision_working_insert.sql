-- FINAL WORKING INSERT - SINGLE TRANSACTION, NO BULLSHIT
-- Based on your expert analysis - this WILL work

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

    -- Insert all events atomically
    INSERT INTO public.vehicle_events (id, tenant_id, vehicle_id, type, date, miles, payload) VALUES 
    
    -- 1. SERVICE EVENT - 60K Mile Service (earliest chronologically)
    (extensions.uuid_generate_v4(), v_tenant_id, v_vehicle_id, 'maintenance', '2025-08-15', 60125, 
     jsonb_build_object(
         'services_performed', ARRAY['Oil change','Filter replacement','Brake inspection','Tire rotation'], 
         'total_amount', 485.50, 
         'shop_name','Honda Dealership',
         'vendor','Honda Dealership', 
         'next_service_miles',70000,
         'kind','60K mile service',
         'summary','60K mile service at Honda Dealership for $485.50',
         'confidence',98, 
         'source_document_url','https://example.com/service-invoice-001.jpg',
         'allow_rollover', true
     )),
    
    -- 2. ACCIDENT EVENT - Minor Collision
    (extensions.uuid_generate_v4(), v_tenant_id, v_vehicle_id, 'document', '2025-09-10', 86890, 
     jsonb_build_object(
         'document_type','accident',
         'doc_type','accident_report',
         'accident_date','2025-09-10',
         'location','Main St & 5th Ave, Downtown', 
         'damage_description','Rear bumper damage, scratches and dent', 
         'other_party_info', jsonb_build_object('name','John Smith','insurance','Geico','vehicle','Honda Civic'), 
         'police_report_number','PR-2025-091045',
         'claim_number','CLM789456123',
         'estimated_damage',2150.00, 
         'kind','Minor collision',
         'summary','Minor collision at Main St & 5th Ave with rear bumper damage',
         'confidence',92, 
         'source_document_url','https://example.com/police-report-001.jpg',
         'allow_rollover', true
     )),
    
    -- 3. INSURANCE DOCUMENTS - Policy and Card (same date)
    (extensions.uuid_generate_v4(), v_tenant_id, v_vehicle_id, 'document', '2025-09-18', NULL, 
     jsonb_build_object(
         'document_type','insurance_policy',
         'doc_type','insurance_policy',
         'insurance_company','State Farm',
         'policy_number','ABC123456789', 
         'coverage_type','Full coverage',
         'premium_amount',1200.00,
         'total_amount',1200.00, 
         'effective_date','2025-09-18',
         'expiration_date','2026-03-18',
         'kind','Auto insurance renewed', 
         'summary','Auto insurance renewed with State Farm for $1,200/year',
         'confidence',96, 
         'source_document_url','https://example.com/insurance-policy-001.jpg'
     )),
    
    (extensions.uuid_generate_v4(), v_tenant_id, v_vehicle_id, 'document', '2025-09-18', NULL, 
     jsonb_build_object(
         'document_type','insurance_card',
         'doc_type','insurance_card',
         'insurance_company','State Farm',
         'policy_number','ABC123456789', 
         'expiration_date','2026-03-18',
         'kind','Insurance card saved', 
         'summary','Insurance card saved to vehicle records',
         'confidence',95, 
         'source_document_url','https://example.com/insurance-card-001.jpg'
     )),
    
    -- 4. INSPECTION EVENT - Safety Inspection
    (extensions.uuid_generate_v4(), v_tenant_id, v_vehicle_id, 'inspection', '2025-09-20', 87100, 
     jsonb_build_object(
         'inspection_type','safety',
         'result','passed',
         'certificate_number','SI-2025-789456', 
         'inspection_station','State Inspection Station',
         'expiration_date','2025-12-20', 
         'kind','Safety inspection passed',
         'summary','Safety inspection passed at State Inspection Station',
         'confidence',98, 
         'source_document_url','https://example.com/inspection-cert-001.jpg',
         'allow_rollover', true
     )),
    
    -- 5. FUEL EVENT - Gas Purchase
    (extensions.uuid_generate_v4(), v_tenant_id, v_vehicle_id, 'fuel', '2025-09-22', 87380, 
     jsonb_build_object(
         'station_name','Shell',
         'station','Shell',
         'fuel_type','Regular',
         'price_per_gallon',3.67,
         'gallons',14.2,
         'total_amount',52.18, 
         'mpg_calculated',24.1,
         'kind','Fuel purchase',
         'summary','Fuel purchase at Shell for $52.18',
         'confidence',94, 
         'source_document_url','https://example.com/fuel-receipt-001.jpg',
         'allow_rollover', true
     )),
    
    -- 6. REPAIR EVENT - Alternator Replacement
    (extensions.uuid_generate_v4(), v_tenant_id, v_vehicle_id, 'maintenance', '2025-09-25', 87450, 
     jsonb_build_object(
         'event_type','repair',
         'problem_description','Battery not charging, alternator failure', 
         'repair_performed','Complete alternator replacement with new belt', 
         'parts_replaced', ARRAY['Alternator','Drive belt','Battery terminals'], 
         'total_amount',685.00,
         'warranty_period','12 months',
         'shop_name','Joe''s Auto Repair',
         'vendor','Joe''s Auto Repair', 
         'kind','Alternator replacement',
         'summary','Alternator replacement at Joe''s Auto Repair for $685',
         'confidence',95, 
         'source_document_url','https://example.com/repair-invoice-001.jpg',
         'allow_rollover', true
     )),
    
    -- 7. ODOMETER EVENT - Mileage Reading (slightly higher than repair)
    (extensions.uuid_generate_v4(), v_tenant_id, v_vehicle_id, 'odometer', '2025-09-27', 87460, 
     jsonb_build_object(
         'current_mileage',87460,
         'display_type','digital',
         'reading_quality','clear', 
         'kind','Odometer reading',
         'summary','87,460 miles recorded',
         'confidence',96, 
         'source_document_url','https://example.com/odometer-photo-001.jpg',
         'allow_rollover', true
     ));

    RAISE NOTICE 'Successfully inserted 8 events for vehicle % (tenant %)', v_vehicle_id, v_tenant_id;
    
END $$;

COMMIT;

-- Verification query
SELECT 
    COUNT(*) as event_count,
    string_agg(DISTINCT type, ', ' ORDER BY type) as event_types
FROM public.vehicle_events ve
JOIN public.vehicles v ON ve.vehicle_id = v.id
WHERE v.vin = '1HGBH41JXMN109186';
