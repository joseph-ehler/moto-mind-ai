/**
 * Mock Timeline Data
 * 
 * Sample timeline items for development and testing
 */

import { TimelineItem } from '@/types/timeline'

export const mockTimelineItems: TimelineItem[] = [
  // Today - Odometer reading
  {
    id: '1',
    vehicle_id: '123',
    type: 'odometer',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
    photo_url: '/uploads/odometer-85234.jpg',
    mileage: 85234,
    extracted_data: {
      reading: 85234,
      confidence: 0.98,
      change_since_last: 12
    },
    created_at: new Date(),
    updated_at: new Date()
  },

  // Sep 15 - Oil Change
  {
    id: '2',
    vehicle_id: '123',
    type: 'service',
    timestamp: new Date('2024-09-15T10:30:00'),
    photo_url: '/uploads/receipt-oil-change.jpg',
    mileage: 85034,
    extracted_data: {
      service_type: 'Oil Change',
      vendor_name: "Joe's Auto Shop",
      cost: 45.00,
      parts_replaced: ['Oil Filter', 'Synthetic Oil 5W-30'],
      warranty: false
    },
    notes: 'Mechanic mentioned brake pads look good for another 10k miles',
    created_at: new Date('2024-09-15'),
    updated_at: new Date('2024-09-15')
  },

  // Sep 10 - Dashboard Warning (no photo - shows placeholder)
  {
    id: '3',
    vehicle_id: '123',
    type: 'dashboard_warning',
    timestamp: new Date('2024-09-10T08:15:00'),
    mileage: 84980,
    extracted_data: {
      warning_type: ['Low Tire Pressure'],
      severity: 'medium',
      resolved: true,
      resolved_date: new Date('2024-09-12'),
      description: 'TPMS warning light - front left tire'
    },
    created_at: new Date('2024-09-10'),
    updated_at: new Date('2024-09-12')
  },

  // Sep 5 - Fuel Fill-Up
  {
    id: '4',
    vehicle_id: '123',
    type: 'fuel',
    timestamp: new Date('2024-09-05T14:20:00'),
    photo_url: '/uploads/receipt-fuel-sep5.jpg',
    mileage: 84850,
    extracted_data: {
      gallons: 12.4,
      cost: 43.96,
      price_per_gallon: 3.55,
      station_name: 'Shell Station',
      fuel_type: 'Regular 87',
      mpg_calculated: 31.2
    },
    created_at: new Date('2024-09-05'),
    updated_at: new Date('2024-09-05')
  },

  // Aug 20 - Tire Tread Check (no photo - shows placeholder)
  {
    id: '5',
    vehicle_id: '123',
    type: 'tire_tread',
    timestamp: new Date('2024-08-20T11:00:00'),
    mileage: 84120,
    extracted_data: {
      position: 'front_left',
      depth_32nds: 6,
      condition: 'good'
    },
    notes: 'All tires measured - all showing 6/32" depth',
    created_at: new Date('2024-08-20'),
    updated_at: new Date('2024-08-20')
  },

  // Aug 15 - Fuel Fill-Up
  {
    id: '6',
    vehicle_id: '123',
    type: 'fuel',
    timestamp: new Date('2024-08-15T09:30:00'),
    photo_url: '/uploads/receipt-fuel-aug15.jpg',
    mileage: 83750,
    extracted_data: {
      gallons: 11.8,
      cost: 42.54,
      price_per_gallon: 3.60,
      station_name: 'Chevron',
      fuel_type: 'Regular 87',
      mpg_calculated: 30.8
    },
    created_at: new Date('2024-08-15'),
    updated_at: new Date('2024-08-15')
  },

  // Aug 1 - Minor Damage Documentation
  {
    id: '7',
    vehicle_id: '123',
    type: 'damage',
    timestamp: new Date('2024-08-01T16:45:00'),
    photo_url: '/uploads/damage-door-ding.jpg',
    mileage: 83200,
    extracted_data: {
      severity: 'minor',
      location: 'Passenger door',
      estimated_cost: 150,
      repair_status: 'pending',
      insurance_claim: false
    },
    notes: 'Small door ding from parking lot. Planning to get paintless dent repair.',
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: 'Safeway Parking Lot, Market St'
    },
    created_at: new Date('2024-08-01'),
    updated_at: new Date('2024-08-01')
  },

  // July 20 - Odometer
  {
    id: '8',
    vehicle_id: '123',
    type: 'odometer',
    timestamp: new Date('2024-07-20T07:00:00'),
    photo_url: '/uploads/odometer-82800.jpg',
    mileage: 82800,
    extracted_data: {
      reading: 82800,
      confidence: 0.95,
      change_since_last: 450
    },
    created_at: new Date('2024-07-20'),
    updated_at: new Date('2024-07-20')
  },

  // July 10 - Tire Rotation
  {
    id: '9',
    vehicle_id: '123',
    type: 'service',
    timestamp: new Date('2024-07-10T13:15:00'),
    photo_url: '/uploads/receipt-tire-rotation.jpg',
    mileage: 82350,
    extracted_data: {
      service_type: 'Tire Rotation',
      vendor_name: 'Discount Tire',
      cost: 0, // Free with purchase
      parts_replaced: [],
      warranty: false
    },
    notes: 'Free rotation with tire purchase last year',
    created_at: new Date('2024-07-10'),
    updated_at: new Date('2024-07-10')
  },

  // June 28 - Parking Documentation
  {
    id: '10',
    vehicle_id: '123',
    type: 'parking',
    timestamp: new Date('2024-06-28T18:30:00'),
    photo_url: '/uploads/parking-airport.jpg',
    mileage: 81900,
    extracted_data: {
      lot_name: 'SFO Long-Term Parking',
      level: 'Level 3',
      spot_number: 'C-47',
      reminder_time: new Date('2024-07-02T12:00:00')
    },
    notes: 'Week-long vacation parking',
    location: {
      latitude: 37.6213,
      longitude: -122.3790,
      address: 'SFO Airport, Long-Term Lot C'
    },
    created_at: new Date('2024-06-28'),
    updated_at: new Date('2024-06-28')
  },

  // June 15 - Fuel Fill-Up
  {
    id: '11',
    vehicle_id: '123',
    type: 'fuel',
    timestamp: new Date('2024-06-15T12:00:00'),
    photo_url: '/uploads/receipt-fuel-june15.jpg',
    mileage: 81200,
    extracted_data: {
      gallons: 12.1,
      cost: 45.12,
      price_per_gallon: 3.73,
      station_name: '76 Gas',
      fuel_type: 'Regular 87',
      mpg_calculated: 29.5
    },
    created_at: new Date('2024-06-15'),
    updated_at: new Date('2024-06-15')
  },

  // May 5 - Tire Rotation (from earlier service history)
  {
    id: '12',
    vehicle_id: '123',
    type: 'service',
    timestamp: new Date('2024-05-05T10:00:00'),
    photo_url: '/uploads/receipt-tire-rotation-may.jpg',
    mileage: 79800,
    extracted_data: {
      service_type: 'Tire Rotation',
      vendor_name: 'Discount Tire',
      cost: 0,
      parts_replaced: [],
      warranty: false
    },
    created_at: new Date('2024-05-05'),
    updated_at: new Date('2024-05-05')
  }
]

// Helper to get items by vehicle ID
export function getTimelineForVehicle(vehicleId: string): TimelineItem[] {
  return mockTimelineItems
    .filter(item => item.vehicle_id === vehicleId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// Helper to get recent items
export function getRecentTimelineItems(vehicleId: string, count: number = 5): TimelineItem[] {
  return getTimelineForVehicle(vehicleId).slice(0, count)
}
