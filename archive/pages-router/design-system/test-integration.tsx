import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface TestEvent {
  vehicle_id: string
  type: 'fuel' | 'maintenance' | 'odometer' | 'document' | 'reminder' | 'inspection'
  date: string
  miles?: number
  payload: Record<string, any>
  notes?: string
}

interface ApiResponse {
  success: boolean
  event?: any
  message?: string
  error?: string
}

export default function TestIntegration() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ApiResponse | null>(null)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(false)

  const [formData, setFormData] = useState<TestEvent>({
    vehicle_id: '',
    type: 'odometer',
    date: new Date().toISOString().split('T')[0], // Today's date
    miles: undefined,
    payload: {},
    notes: ''
  })

  // Load vehicles for testing
  const loadVehicles = async () => {
    setLoadingVehicles(true)
    try {
      const response = await fetch('/api/vehicles')
      const data = await response.json()
      
      if (data.success && data.vehicles) {
        setVehicles(data.vehicles)
      } else {
        console.error('Failed to load vehicles:', data)
      }
    } catch (error) {
      console.error('Error loading vehicles:', error)
    } finally {
      setLoadingVehicles(false)
    }
  }

  // Test saving an event
  const testSaveEvent = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/events/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  // Test loading events for a vehicle
  const testLoadEvents = async () => {
    if (!formData.vehicle_id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/vehicles/${formData.vehicle_id}/events`)
      const data = await response.json()
      
      setResult({
        success: true,
        message: `Loaded ${data.events?.length || 0} events`,
        event: data.events
      })
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Frontend-Backend Integration Test</h1>
        <p className="text-muted-foreground">
          Test the new unified vehicle_events schema with the updated APIs
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Test Form */}
        <Card>
          <CardHeader>
            <CardTitle>Test Event Creation</CardTitle>
            <CardDescription>
              Create a test event in the unified vehicle_events table
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Load Vehicles */}
            <div>
              <Button 
                onClick={loadVehicles} 
                disabled={loadingVehicles}
                variant="outline"
                className="w-full mb-2"
              >
                {loadingVehicles && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Load Vehicles
              </Button>
            </div>

            {/* Vehicle Selection */}
            <div>
              <Label htmlFor="vehicle">Vehicle</Label>
              <Select 
                value={formData.vehicle_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, vehicle_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.display_name || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Event Type */}
            <div>
              <Label htmlFor="type">Event Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="odometer">Odometer Reading</SelectItem>
                  <SelectItem value="fuel">Fuel Purchase</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            {/* Miles */}
            <div>
              <Label htmlFor="miles">Miles (optional)</Label>
              <Input
                id="miles"
                type="number"
                placeholder="Enter mileage"
                value={formData.miles || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  miles: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Enter any notes..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={testSaveEvent} 
                disabled={loading || !formData.vehicle_id}
                className="flex-1"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Event
              </Button>
              
              <Button 
                onClick={testLoadEvents} 
                disabled={loading || !formData.vehicle_id}
                variant="outline"
                className="flex-1"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Load Events
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              API responses and integration status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                      {result.success ? 'Success!' : 'Error'}
                    </AlertDescription>
                  </div>
                </Alert>

                {result.message && (
                  <div>
                    <h4 className="font-medium mb-2">Message:</h4>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                  </div>
                )}

                {result.error && (
                  <div>
                    <h4 className="font-medium mb-2 text-red-600">Error:</h4>
                    <p className="text-sm text-red-600">{result.error}</p>
                  </div>
                )}

                {result.event && (
                  <div>
                    <h4 className="font-medium mb-2">Response Data:</h4>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-64">
                      {JSON.stringify(result.event, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No test results yet. Run a test to see the results.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Updated vehicles API to use unified vehicle_events table</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Created events API endpoints for timeline functionality</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Created save API for processed documents</span>
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              <span>Testing frontend-backend integration (current step)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
