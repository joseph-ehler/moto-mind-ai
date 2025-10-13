import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { TimelineItem } from '@/types/timeline'

// Dynamically import to avoid SSR issues
const TimelineItemCompact = dynamic(
  () => import('@/components/timeline/TimelineItemCompact').then(mod => ({ default: mod.TimelineItemCompact })),
  { ssr: false }
)

export default function EventCardsShowcase() {
  const [useMockData, setUseMockData] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Mock data for all event types with ELITE-TIER features!
  const mockEvents: TimelineItem[] = [
    // 1. FUEL - HIGH QUALITY with exceptional efficiency
    {
      id: 'fuel-1',
      vehicle_id: 'test',
      type: 'fuel',
      timestamp: new Date('2025-01-09T20:00:00'),
      mileage: 77306,
      photo_url: 'https://placehold.co/800x600/3b82f6/white?text=Fuel+Receipt',
      thumbnail_url: 'https://placehold.co/400x300/3b82f6/white?text=Receipt',
      notes: 'Regular gas, Shell station',
      created_at: new Date(),
      updated_at: new Date(),
      extracted_data: {
        location: 'Shell',
        cost: 42.50,
        gallons: 13.2,
        price_per_gallon: 3.22,
        fuel_type: 'Regular (87)',
        payment_method: 'Credit Card',
        receipt_number: '4829-3847',
        mpg_calculated: 32.5,
        // ELITE: AI Summary
        ai_summary: 'Fuel efficiency is 8% above your 6-month average. This station typically has competitive pricing in your area.',
        ai_confidence: 'high',
        // ELITE: Quality Metadata
        extraction_quality: {
          level: 'high',
          fields_extracted: 7,
          fields_missing: 0,
          image_quality: 95
        }
      } as any
    },
    
    // 2. SERVICE - With overdue warning
    {
      id: 'service-1',
      vehicle_id: 'test',
      type: 'service',
      timestamp: new Date('2025-01-09T14:45:00'),
      mileage: 77000,
      photo_url: 'https://placehold.co/800x600/10b981/white?text=Service+Invoice',
      thumbnail_url: 'https://placehold.co/400x300/10b981/white?text=Invoice',
      notes: 'Oil change and filter replacement',
      created_at: new Date(),
      updated_at: new Date(),
      extracted_data: {
        service_type: 'oil_change',
        service_provider: "Joe's Auto Repair",
        cost: 250.00,
        warranty_period: 12,
        parts_replaced: ['Oil filter', 'Air filter', 'Cabin filter'],
        labor_hours: 2.5,
        next_service_miles: 80000,
        ai_summary: 'All fluids topped off. Next service recommended at 80,000 miles or 6 months.',
        ai_confidence: 'high',
        extraction_quality: {
          level: 'high',
          fields_extracted: 6,
          fields_missing: 0,
          image_quality: 90
        }
      } as any
    },

    // 3. ODOMETER - 80K Milestone!
    {
      id: 'odometer-1',
      vehicle_id: 'test',
      type: 'odometer',
      timestamp: new Date('2025-01-09T13:11:00'),
      mileage: 80000,
      photo_url: 'https://placehold.co/800x600/6366f1/white?text=Odometer+80K',
      thumbnail_url: 'https://placehold.co/400x300/6366f1/white?text=80K',
      notes: 'Dashboard odometer reading - milestone!',
      created_at: new Date(),
      updated_at: new Date(),
      extracted_data: {
        trip_a: 324.5,
        trip_b: 1842.3,
        range_remaining: 285,
        avg_daily_miles: 42,
        days_since_last_reading: 7,
        ai_summary: 'You\'ve reached 80,000 miles! Average daily usage is 42 miles.',
        ai_confidence: 'high',
        extraction_quality: {
          level: 'high',
          fields_extracted: 5,
          fields_missing: 0,
          image_quality: 88
        }
      } as any
    },

    // 4. DASHBOARD WARNING - Critical with diagnostic codes
    {
      id: 'warning-1',
      vehicle_id: 'test',
      type: 'dashboard_warning',
      timestamp: new Date('2025-01-09T20:21:00'),
      mileage: 77306,
      photo_url: 'https://placehold.co/800x600/ef4444/white?text=Warning+Light',
      thumbnail_url: 'https://placehold.co/400x300/ef4444/white?text=Warning',
      notes: 'Check engine light on',
      created_at: new Date(),
      updated_at: new Date(),
      extracted_data: {
        warnings: [{
          system: 'Check Engine Light',
          description: 'P0420 - Catalyst System Efficiency Below Threshold'
        }],
        diagnostic_codes: ['P0420', 'P0171'],
        severity: 'critical',
        affected_systems: ['Engine', 'Emissions'],
        ai_summary: 'Catalytic converter efficiency is below threshold. Schedule diagnostic scan soon to prevent further issues.',
        ai_confidence: 'medium',
        extraction_quality: {
          level: 'medium',
          fields_extracted: 4,
          fields_missing: 1,
          image_quality: 75
        }
      } as any
    },

    // 5. DASHBOARD SNAPSHOT (no warnings)
    {
      id: 'snapshot-1',
      vehicle_id: 'test',
      type: 'dashboard_snapshot',
      timestamp: new Date('2025-01-09T18:31:00'),
      mileage: 77306,
      photo_url: '/test.jpg',
      notes: 'Regular dashboard check',
      created_at: new Date(),
      updated_at: new Date(),
      extracted_data: {
        warning_type: [],
        severity: 'low' as const,
        resolved: true,
        description: 'All systems normal'
      }
    },

    // 6. TIRE TREAD - Per-tire with low warning
    {
      id: 'tread-1',
      vehicle_id: 'test',
      type: 'tire_tread',
      timestamp: new Date('2025-01-09T15:15:00'),
      mileage: 77000,
      photo_url: 'https://placehold.co/800x600/f59e0b/white?text=Tire+Tread',
      thumbnail_url: 'https://placehold.co/400x300/f59e0b/white?text=Tread',
      notes: 'All four tires checked',
      created_at: new Date(),
      updated_at: new Date(),
      extracted_data: {
        average_tread_depth: 5.5,
        front_left_tread: 7,
        front_right_tread: 6,
        rear_left_tread: 3,
        rear_right_tread: 4,
        min_tread_depth: 3,
        overall_condition: 'Fair - rear tires low',
        ai_summary: 'Rear tires showing significant wear. Consider replacement within next 2,000 miles for safety.',
        ai_confidence: 'high',
        extraction_quality: {
          level: 'high',
          fields_extracted: 6,
          fields_missing: 0,
          image_quality: 85
        }
      } as any
    },

    // 7. TIRE PRESSURE - Normal readings
    {
      id: 'pressure-1',
      vehicle_id: 'test',
      type: 'tire_pressure',
      timestamp: new Date('2025-01-09T14:30:00'),
      mileage: 77000,
      photo_url: 'https://placehold.co/800x600/10b981/white?text=Tire+Pressure',
      thumbnail_url: 'https://placehold.co/400x300/10b981/white?text=Pressure',
      notes: 'All four tires checked',
      created_at: new Date(),
      updated_at: new Date(),
      extracted_data: {
        average_pressure: 32.5,
        front_left_pressure: 32,
        front_right_pressure: 33,
        rear_left_pressure: 33,
        rear_right_pressure: 32,
        ai_summary: 'All tire pressures within normal range. Check again in 30 days.',
        ai_confidence: 'high',
        extraction_quality: {
          level: 'high',
          fields_extracted: 5,
          fields_missing: 0,
          image_quality: 92
        }
      } as any
    },

    // 8. DAMAGE - Severe with repair tracking
    {
      id: 'damage-1',
      vehicle_id: 'test',
      type: 'damage',
      timestamp: new Date('2025-01-09T09:45:00'),
      mileage: 77000,
      photo_url: 'https://placehold.co/800x600/ef4444/white?text=Damage+Report',
      thumbnail_url: 'https://placehold.co/400x300/ef4444/white?text=Damage',
      notes: 'Collision damage - front end',
      created_at: new Date(),
      updated_at: new Date(),
      extracted_data: {
        damage_type: 'Collision',
        damage_location: 'Front bumper',
        severity: 'severe',
        damage_description: 'Front bumper impact with significant paint damage and minor structural denting',
        cost: 2450.00,
        repair_status: 'Pending quote',
        insurance_claim: '#INS-2024-1234',
        repair_shop: 'Downtown Collision Center',
        ai_summary: 'Significant front end damage requiring bumper replacement and paint work. Get multiple quotes.',
        ai_confidence: 'high',
        extraction_quality: {
          level: 'high',
          fields_extracted: 7,
          fields_missing: 0,
          image_quality: 90
        }
      } as any
    },

    // 9. PARKING - Enhanced with reminder
    {
      id: 'parking-1',
      vehicle_id: 'test',
      type: 'parking',
      timestamp: new Date('2025-01-09T16:20:00'),
      photo_url: 'https://placehold.co/800x600/3b82f6/white?text=Parking+Spot',
      thumbnail_url: 'https://placehold.co/400x300/3b82f6/white?text=Spot+B-47',
      notes: 'Parked at airport long-term',
      created_at: new Date(),
      updated_at: new Date(),
      extracted_data: {
        lot_name: 'Airport Long-Term Lot B',
        level: 'Level 3',
        spot_number: 'B-47',
        reminder_time: new Date('2025-01-12T18:00:00'),
        ai_summary: 'Vehicle parked in long-term lot. Return pickup scheduled for January 12th.',
        ai_confidence: 'high',
        extraction_quality: {
          level: 'high',
          fields_extracted: 4,
          fields_missing: 0,
          image_quality: 88
        }
      } as any
    },

    // 10. DOCUMENT (insurance) - Enhanced
    {
      id: 'doc-1',
      vehicle_id: 'test',
      type: 'document',
      timestamp: new Date('2025-01-01T00:00:00'),
      photo_url: 'https://placehold.co/800x600/10b981/white?text=Insurance+Policy',
      thumbnail_url: 'https://placehold.co/400x300/10b981/white?text=Policy',
      notes: 'Insurance policy document',
      created_at: new Date(),
      updated_at: new Date(),
      extracted_data: {
        document_type: 'Insurance Policy',
        provider: 'State Farm Auto',
        policy_number: 'AUTO-123456789',
        expiration_date: new Date('2025-12-31'),
        coverage_type: 'Full Coverage',
        premium: 1200.00,
        ai_summary: 'Full coverage policy expires December 31, 2025. Consider shopping for quotes 60 days before renewal.',
        ai_confidence: 'high',
        extraction_quality: {
          level: 'high',
          fields_extracted: 5,
          fields_missing: 0,
          image_quality: 95
        }
      } as any
    },

    // 11. INSPECTION - Enhanced with pass status
    {
      id: 'inspection-1',
      vehicle_id: 'test',
      type: 'inspection',
      timestamp: new Date('2025-01-05T10:30:00'),
      mileage: 77000,
      photo_url: 'https://placehold.co/800x600/10b981/white?text=Inspection+Certificate',
      thumbnail_url: 'https://placehold.co/400x300/10b981/white?text=PASSED',
      notes: 'Annual state inspection - passed',
      created_at: new Date(),
      updated_at: new Date(),
      extracted_data: {
        inspection_type: 'Safety + Emissions',
        result: 'Pass',
        expiration_date: new Date('2026-01-15'),
        station_name: 'Quick Check Inspection Center',
        certificate_number: 'INS-2025-12345',
        cost: 35.00,
        ai_summary: 'Vehicle passed both safety and emissions inspection. Next inspection due January 2026.',
        ai_confidence: 'high',
        extraction_quality: {
          level: 'high',
          fields_extracted: 6,
          fields_missing: 0,
          image_quality: 92
        }
      } as any
    },

    // 12. RECALL - Enhanced with urgency
    {
      id: 'recall-1',
      vehicle_id: 'test',
      type: 'recall',
      timestamp: new Date('2025-01-03T00:00:00'),
      photo_url: 'https://placehold.co/800x600/ef4444/white?text=Recall+Notice',
      thumbnail_url: 'https://placehold.co/400x300/ef4444/white?text=Safety+Recall',
      notes: 'Safety recall issued by manufacturer',
      created_at: new Date(),
      updated_at: new Date(),
      extracted_data: {
        recall_id: 'NHTSA-2024-001',
        nhtsa_number: '24V-123',
        severity: 'Safety Critical',
        affected_component: 'Airbag inflator',
        status: 'Open - Action Required',
        manufacturer: 'Honda',
        resolution_deadline: new Date('2025-06-30'),
        description: 'Airbag inflator may rupture in certain conditions causing injury',
        ai_summary: 'Safety-critical recall affecting airbag system. Schedule dealer appointment immediately. Repair is free of charge.',
        ai_confidence: 'high',
        extraction_quality: {
          level: 'high',
          fields_extracted: 7,
          fields_missing: 0,
          image_quality: 90
        }
      } as any
    },

    // 13. MANUAL NOTE
    {
      id: 'manual-1',
      vehicle_id: 'test',
      type: 'manual',
      timestamp: new Date('2025-01-09T12:00:00'),
      mileage: 77145,
      notes: 'Noticed slight pulling to the right when braking. Need to check brake alignment at next service appointment. Also heard a squeaking noise from front left wheel.',
      created_at: new Date(),
      updated_at: new Date(),
      extracted_data: {
        title: 'Brake Issue Noticed',
        description: 'Vehicle pulls right when braking, front left squeaking'
      } as any
    },

    // 14. MODIFICATION (NEW!) - Performance upgrade
    {
      id: 'mod-1',
      vehicle_id: 'test',
      type: 'modification',
      timestamp: new Date('2025-01-08T15:00:00'),
      mileage: 77000,
      photo_url: 'https://placehold.co/800x600/8b5cf6/white?text=K%26N+Intake',
      thumbnail_url: 'https://placehold.co/400x300/8b5cf6/white?text=Mod',
      notes: 'Installed cold air intake',
      created_at: new Date(),
      updated_at: new Date(),
      extracted_data: {
        modification_type: 'performance',
        part_name: 'K&N Cold Air Intake',
        brand: 'K&N',
        cost: 350.00,
        installer: 'DIY',
        warranty: '1 year',
        description: 'Installed K&N cold air intake for improved airflow',
        ai_summary: 'Performance modification installed. Expected 5-10 HP gain and slight MPG improvement.',
        ai_confidence: 'high',
        extraction_quality: {
          level: 'high',
          fields_extracted: 6,
          fields_missing: 0,
          image_quality: 88
        }
      } as any
    },

    // 15. CAR WASH (NEW!) - Detail service
    {
      id: 'wash-1',
      vehicle_id: 'test',
      type: 'car_wash',
      timestamp: new Date('2025-01-07T11:00:00'),
      mileage: 77000,
      photo_url: 'https://placehold.co/800x600/06b6d4/white?text=Detail+Service',
      thumbnail_url: 'https://placehold.co/400x300/06b6d4/white?text=Clean',
      notes: 'Full detail service',
      created_at: new Date(),
      updated_at: new Date(),
      extracted_data: {
        service_type: 'detail',
        provider: 'Premier Auto Spa',
        cost: 150.00,
        services_included: ['Exterior wash', 'Clay bar', 'Wax', 'Interior vacuum', 'Leather conditioning'],
        ai_summary: 'Full detail service completed. Paint protected with ceramic coating. Next wash recommended in 30 days.',
        ai_confidence: 'high',
        extraction_quality: {
          level: 'high',
          fields_extracted: 4,
          fields_missing: 0,
          image_quality: 90
        }
      } as any
    },

    // 16. TRIP (NEW!) - Business trip
    {
      id: 'trip-1',
      vehicle_id: 'test',
      type: 'trip',
      timestamp: new Date('2025-01-06T08:00:00'),
      mileage: 77000,
      notes: 'Business trip to Chicago',
      created_at: new Date(),
      updated_at: new Date(),
      extracted_data: {
        trip_type: 'business',
        destination: 'Chicago, IL',
        purpose: 'Client meeting',
        distance_miles: 580,
        start_mileage: 76420,
        end_mileage: 77000,
        route: 'I-90 via Toledo',
        ai_summary: 'Round trip to Chicago for business. Route via I-90. Average 28 MPG highway. Tax deductible.',
        ai_confidence: 'high'
      } as any
    },

    // 17. EXPENSE (NEW!) - Toll expense
    {
      id: 'expense-1',
      vehicle_id: 'test',
      type: 'expense',
      timestamp: new Date('2025-01-04T14:30:00'),
      mileage: 76500,
      photo_url: 'https://placehold.co/800x600/f59e0b/white?text=Toll+Receipt',
      thumbnail_url: 'https://placehold.co/400x300/f59e0b/white?text=Receipt',
      notes: 'Toll charges',
      created_at: new Date(),
      updated_at: new Date(),
      extracted_data: {
        expense_type: 'toll',
        amount: 24.50,
        vendor: 'E-ZPass',
        description: 'Highway tolls for Chicago trip',
        tax_deductible: true,
        receipt_number: 'EZP-2025-0104-789',
        ai_summary: 'Toll expenses for business travel. Tax deductible as business expense.',
        ai_confidence: 'high',
        extraction_quality: {
          level: 'high',
          fields_extracted: 5,
          fields_missing: 0,
          image_quality: 85
        }
      } as any
    }
  ]

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-100 to-blue-100">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="text-center py-20">
            <p className="text-lg text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-100 to-blue-100">
      <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="space-y-12">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-4xl font-bold text-gray-900">
              Event Card Showcase
            </h1>
            <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold rounded-full">
              ELITE TIER ✨
            </span>
          </div>
          <p className="text-lg text-gray-600 mb-2">
            All event card types with <strong>elite-tier features</strong>:
          </p>
          <ul className="text-sm text-gray-600 mb-6 space-y-1">
            <li>• <strong>●●●●○ Quality Dots</strong> - Extraction confidence at a glance</li>
            <li>• <strong>📷 Source Images</strong> - Thumbnails with click-to-expand lightbox</li>
            <li>• <strong>✨ AI Summaries</strong> - Contextual insights from OpenAI Vision</li>
            <li>• <strong>📊 Flexible Layout</strong> - Auto-adaptive 1-2 column display with dividers</li>
            <li>• <strong>🎯 Smart Badges</strong> - Only shown for noteworthy events</li>
          </ul>
          
          {/* Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setUseMockData(!useMockData)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                useMockData 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {useMockData ? '✓ Elite Mock Data' : 'Real Data'}
            </button>
            <p className="text-sm text-gray-500">
              {useMockData 
                ? 'Showing enhanced mock data with all elite-tier features' 
                : 'Showing real data (if available)'}
            </p>
          </div>
        </div>

        {/* Event Cards Grid */}
        {useMockData && (
          <div className="space-y-12">
            {/* FUEL */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                1. Fuel Fill-Up ⛽
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                ●●●●● High quality • 2-column grid • Exceptional efficiency badge
              </p>
              <TimelineItemCompact
                item={mockEvents[0]}
                onExpand={(id) => console.log('Expand:', id)}
                onEdit={(item) => console.log('Edit:', item)}
                onDelete={(item) => console.log('Delete:', item)}
              />
            </div>

            {/* SERVICE */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                2. Service/Maintenance 🔧
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                ●●●●● High quality • 2-column grid • Parts tracking
              </p>
              <TimelineItemCompact
                item={mockEvents[1]}
                onExpand={(id) => console.log('Expand:', id)}
                onEdit={(item) => console.log('Edit:', item)}
              />
            </div>

            {/* ODOMETER */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                3. Odometer Reading 📏
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                ●●●●● High quality • Milestone badge • Enhanced with avg daily miles
              </p>
              <TimelineItemCompact
                item={mockEvents[2]}
                onExpand={(id) => console.log('Expand:', id)}
                onEdit={(item) => console.log('Edit:', item)}
              />
            </div>

            {/* DASHBOARD WARNING */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                4. Dashboard Warning ⚠️
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                ●●●○○ Medium quality • Red accent • AlertBox • Diagnostic codes • Systems chips
              </p>
              <TimelineItemCompact
                item={mockEvents[3]}
                onExpand={(id) => console.log('Expand:', id)}
                onEdit={(item) => console.log('Edit:', item)}
              />
            </div>

            {/* DASHBOARD SNAPSHOT */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                5. Dashboard Snapshot (Healthy) ✓
              </h3>
              <TimelineItemCompact
                item={mockEvents[4]}
                onExpand={(id) => console.log('Expand:', id)}
                onEdit={(item) => console.log('Edit:', item)}
              />
            </div>

            {/* TIRE TREAD */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                6. Tire Tread Check 🛞
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                ●●●●● High quality • Per-tire readings • Low tread warning
              </p>
              <TimelineItemCompact
                item={mockEvents[5]}
                onExpand={(id) => console.log('Expand:', id)}
                onEdit={(item) => console.log('Edit:', item)}
              />
            </div>

            {/* TIRE PRESSURE */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                7. Tire Pressure Check 🛞
              </h3>
              <TimelineItemCompact
                item={mockEvents[6]}
                onExpand={(id) => console.log('Expand:', id)}
                onEdit={(item) => console.log('Edit:', item)}
              />
            </div>

            {/* DAMAGE */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                8. Damage Report 🚗
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                ●●●●● High quality • Red accent (severe) • 7 data fields • Repair tracking
              </p>
              <TimelineItemCompact
                item={mockEvents[7]}
                onExpand={(id) => console.log('Expand:', id)}
                onEdit={(item) => console.log('Edit:', item)}
              />
            </div>

            {/* PARKING */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                9. Parking Location 🅿️
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                ●●●●● High quality • Location tracking • Reminder set • Airport long-term lot
              </p>
              <TimelineItemCompact
                item={mockEvents[8]}
                onExpand={(id) => console.log('Expand:', id)}
                onEdit={(item) => console.log('Edit:', item)}
              />
            </div>

            {/* DOCUMENT */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                10. Document (Insurance) 📄
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                ●●●●● High quality • Insurance policy • Expiration tracking • Full coverage
              </p>
              <TimelineItemCompact
                item={mockEvents[9]}
                onExpand={(id) => console.log('Expand:', id)}
                onEdit={(item) => console.log('Edit:', item)}
              />
            </div>

            {/* INSPECTION */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                11. Inspection (Safety + Emissions) ✅
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                ●●●●● High quality • Passed • Certificate tracking • Expires Jan 2026
              </p>
              <TimelineItemCompact
                item={mockEvents[10]}
                onExpand={(id) => console.log('Expand:', id)}
                onEdit={(item) => console.log('Edit:', item)}
              />
            </div>

            {/* RECALL */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                12. Recall Notice 🔔
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                ●●●●● High quality • Safety-critical • Airbag recall • Action required
              </p>
              <TimelineItemCompact
                item={mockEvents[11]}
                onExpand={(id) => console.log('Expand:', id)}
                onEdit={(item) => console.log('Edit:', item)}
              />
            </div>

            {/* MANUAL NOTE */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                13. Manual Note 📝
              </h3>
              <TimelineItemCompact
                item={mockEvents[12]}
                onExpand={(id) => console.log('Expand:', id)}
                onEdit={(item) => console.log('Edit:', item)}
              />
            </div>

            {/* MODIFICATION - NEW! */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                14. Modification 🔩 <span className="text-lg text-purple-600">NEW!</span>
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                ●●●●● High quality • Performance mod • Warranty tracking • Cost $350
              </p>
              <TimelineItemCompact
                item={mockEvents[13]}
                onExpand={(id) => console.log('Expand:', id)}
                onEdit={(item) => console.log('Edit:', item)}
              />
            </div>

            {/* CAR WASH - NEW! */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                15. Car Wash 🧼 <span className="text-lg text-cyan-600">NEW!</span>
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                ●●●●● High quality • Full detail • 5 services • "Full Detail" badge
              </p>
              <TimelineItemCompact
                item={mockEvents[14]}
                onExpand={(id) => console.log('Expand:', id)}
                onEdit={(item) => console.log('Edit:', item)}
              />
            </div>

            {/* TRIP - NEW! */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                16. Trip 🗺️ <span className="text-lg text-blue-600">NEW!</span>
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                580 mile business trip • Tax deductible • "Business Trip" badge
              </p>
              <TimelineItemCompact
                item={mockEvents[15]}
                onExpand={(id) => console.log('Expand:', id)}
                onEdit={(item) => console.log('Edit:', item)}
              />
            </div>

            {/* EXPENSE - NEW! */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                17. Expense 💰 <span className="text-lg text-amber-600">NEW!</span>
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                ●●●●● High quality • Toll expense • Tax deductible • "Tax Deductible" badge
              </p>
              <TimelineItemCompact
                item={mockEvents[16]}
                onExpand={(id) => console.log('Expand:', id)}
                onEdit={(item) => console.log('Edit:', item)}
              />
            </div>
          </div>
        )}

        {!useMockData && (
          <div className="py-20 text-center">
            <p className="text-lg text-gray-600">
              Real data integration coming soon. Toggle to "Mock Data" to see all card types.
            </p>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
