'use client'

import React from 'react'
import { 
  VINScanner, 
  LicensePlateScanner, 
  OdometerReader, 
  DocumentScanner,
  VINData,
  LicensePlateData,
  OdometerData,
  DocumentData
} from './index'

// Example component showing how to use all vision components
export function VisionExamples() {
  const [activeScanner, setActiveScanner] = React.useState<string | null>(null)
  const [results, setResults] = React.useState<any[]>([])

  const addResult = (type: string, data: any) => {
    setResults(prev => [...prev, { type, data, timestamp: new Date().toISOString() }])
    setActiveScanner(null)
  }

  const handleVINDetected = (vinData: VINData) => {
    console.log('VIN detected:', vinData)
    addResult('VIN', vinData)
    
    // Example: Auto-populate vehicle form with VIN
    // You could call a VIN decoder API here to get vehicle details
  }

  const handlePlateDetected = (plateData: LicensePlateData) => {
    console.log('License plate detected:', plateData)
    addResult('License Plate', plateData)
    
    // Example: Look up vehicle by license plate
    // You could search your database for existing vehicles
  }

  const handleMileageRead = (odometerData: OdometerData) => {
    console.log('Odometer read:', odometerData)
    addResult('Odometer', odometerData)
    
    // Example: Update vehicle mileage
    // You could automatically update the vehicle's current mileage
  }

  const handleDocumentProcessed = (documentData: DocumentData) => {
    console.log('Document processed:', documentData)
    addResult('Document', documentData)
    
    // Example: Process based on document type
    switch (documentData.type) {
      case 'fuel':
        // Add fuel record
        break
      case 'service_invoice':
        // Add maintenance record
        break
      case 'registration':
        // Update vehicle registration info
        break
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Unified Vision System Examples</h1>
      
      {/* Scanner Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => setActiveScanner('vin')}
          className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Scan VIN
        </button>
        
        <button
          onClick={() => setActiveScanner('plate')}
          className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Scan License Plate
        </button>
        
        <button
          onClick={() => setActiveScanner('odometer')}
          className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Read Odometer
        </button>
        
        <button
          onClick={() => setActiveScanner('document')}
          className="p-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          Scan Document
        </button>
      </div>

      {/* Results Display */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Scan Results</h2>
        {results.length === 0 ? (
          <p className="text-gray-500">No scans yet. Try one of the buttons above!</p>
        ) : (
          results.map((result, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{result.type}</h3>
                <span className="text-xs text-gray-500">
                  {new Date(result.timestamp).toLocaleString()}
                </span>
              </div>
              <pre className="text-sm bg-white p-2 rounded overflow-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          ))
        )}
      </div>

      {/* Active Scanners */}
      {activeScanner === 'vin' && (
        <VINScanner
          onVINDetected={handleVINDetected}
          onCancel={() => setActiveScanner(null)}
          title="Scan Vehicle VIN"
        />
      )}

      {activeScanner === 'plate' && (
        <LicensePlateScanner
          onPlateDetected={handlePlateDetected}
          onCancel={() => setActiveScanner(null)}
          title="Scan License Plate"
        />
      )}

      {activeScanner === 'odometer' && (
        <OdometerReader
          onMileageRead={handleMileageRead}
          onCancel={() => setActiveScanner(null)}
          title="Read Vehicle Odometer"
        />
      )}

      {activeScanner === 'document' && (
        <DocumentScanner
          onDocumentProcessed={handleDocumentProcessed}
          onCancel={() => setActiveScanner(null)}
          title="Scan Vehicle Document"
        />
      )}
    </div>
  )
}

// Example of integrating VIN Scanner with vehicle creation
export function VehicleCreationWithVIN() {
  const [showVINScanner, setShowVINScanner] = React.useState(false)
  const [vehicleData, setVehicleData] = React.useState({
    vin: '',
    year: '',
    make: '',
    model: '',
    // ... other fields
  })

  const handleVINDetected = async (vinData: VINData) => {
    // Update form with VIN
    setVehicleData(prev => ({ ...prev, vin: vinData.vin }))
    
    // Optional: Decode VIN to get vehicle details
    try {
      const response = await fetch('/api/decode-vin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin: vinData.vin })
      })
      
      if (response.ok) {
        const decodedData = await response.json()
        setVehicleData(prev => ({
          ...prev,
          year: decodedData.year,
          make: decodedData.make,
          model: decodedData.model
        }))
      }
    } catch (error) {
      console.error('VIN decoding failed:', error)
    }
    
    setShowVINScanner(false)
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Add New Vehicle</h2>
      
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">VIN</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={vehicleData.vin}
              onChange={(e) => setVehicleData(prev => ({ ...prev, vin: e.target.value }))}
              className="flex-1 px-3 py-2 border rounded-lg"
              placeholder="Enter VIN manually or scan"
            />
            <button
              type="button"
              onClick={() => setShowVINScanner(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Scan VIN
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Year</label>
            <input
              type="number"
              value={vehicleData.year}
              onChange={(e) => setVehicleData(prev => ({ ...prev, year: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Make</label>
            <input
              type="text"
              value={vehicleData.make}
              onChange={(e) => setVehicleData(prev => ({ ...prev, make: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Model</label>
            <input
              type="text"
              value={vehicleData.model}
              onChange={(e) => setVehicleData(prev => ({ ...prev, model: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Add Vehicle
        </button>
      </form>

      {showVINScanner && (
        <VINScanner
          onVINDetected={handleVINDetected}
          onCancel={() => setShowVINScanner(false)}
          title="Scan Vehicle VIN"
        />
      )}
    </div>
  )
}
