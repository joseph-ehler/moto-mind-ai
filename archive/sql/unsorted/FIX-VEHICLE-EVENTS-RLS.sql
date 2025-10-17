-- =============================================================================
-- FIX: Vehicle Events RLS Policies - Enable API Access
-- =============================================================================
-- Problem: RLS "disabled" = no policies = blocks service role access
-- Solution: Add permissive policies for authenticated users (service role)

-- First, check current RLS status
SELECT 
  schemaname,
  tablename, 
  rowsecurity as rls_enabled,
  (SELECT count(*) FROM pg_policies WHERE tablename = 'vehicle_events') as policy_count
FROM pg_tables 
WHERE tablename = 'vehicle_events';

-- Enable RLS and create permissive policies for vehicle_events
ALTER TABLE public.vehicle_events ENABLE ROW LEVEL SECURITY;

-- Create policy for service role to access all vehicle_events
CREATE POLICY "service_role_all_access" ON public.vehicle_events
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Apply same policies to all partitions
ALTER TABLE public.vehicle_events_2024 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_access" ON public.vehicle_events_2024
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.vehicle_events_2025 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_access" ON public.vehicle_events_2025
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.vehicle_events_2026 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_access" ON public.vehicle_events_2026
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.vehicle_events_2027 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_access" ON public.vehicle_events_2027
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.vehicle_events_2028 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_access" ON public.vehicle_events_2028
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.vehicle_events_default ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_access" ON public.vehicle_events_default
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Test insert to verify it works
INSERT INTO public.vehicle_events (
  tenant_id, 
  vehicle_id, 
  type, 
  date, 
  miles, 
  payload,
  notes
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'dfa33260-a922-45d9-a649-3050377a7a62',
  'odometer',
  '2025-09-27',
  125432,
  '{"source": "rls_fix_test"}',
  'Test event to verify RLS policies work'
);

-- Verify the insert worked
SELECT 
  id,
  type,
  date,
  miles,
  payload->>'source' as source,
  created_at
FROM public.vehicle_events 
WHERE vehicle_id = 'dfa33260-a922-45d9-a649-3050377a7a62'
ORDER BY created_at DESC
LIMIT 5;

-- Check final RLS status
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  (SELECT count(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE tablename LIKE 'vehicle_events%'
ORDER BY tablename;
