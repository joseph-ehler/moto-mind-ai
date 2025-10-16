# Modal System - Usage Examples

Quick reference examples for implementing each modal type in your components.

## 🎯 SimpleFormModal - Quick Note Add

```tsx
import { useState } from 'react'
import { SimpleFormModal } from '@/components/modals'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Pencil } from 'lucide-react'

function AddNoteButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [note, setNote] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        body: JSON.stringify({ note }),
      })
      
      if (!response.ok) throw new Error('Failed to save')
      
      setIsOpen(false)
      setNote('')
    } catch (err) {
      setError('Failed to save note')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Add Note</button>
      
      <SimpleFormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        title="Add Quick Note"
        description="Add a note to this vehicle"
        icon={<Pencil className="w-6 h-6 text-blue-600" />}
        submitLabel="Save Note"
        isLoading={isLoading}
        error={error}
      >
        <div>
          <Label htmlFor="note">Note</Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Enter your note..."
            rows={4}
            className="mt-2"
          />
        </div>
      </SimpleFormModal>
    </>
  )
}
```

---

## 🎯 CardFormModal - Edit Vehicle (Multi-Section)

```tsx
import { useState } from 'react'
import { CardFormModal, ModalSection } from '@/components/modals'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Car } from 'lucide-react'

function EditVehicleButton({ vehicle }) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    vin: vehicle.vin,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    nickname: vehicle.nickname || '',
    garageId: vehicle.garage_id || '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await fetch(`/api/vehicles/${vehicle.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      })
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  const sections: ModalSection[] = [
    {
      id: 'basic-info',
      title: 'Vehicle Information',
      description: 'Basic vehicle details',
      content: (
        <>
          <div>
            <Label>VIN</Label>
            <Input value={formData.vin} onChange={...} className="h-12 rounded-xl" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Year</Label>
              <Input type="number" value={formData.year} className="h-12 rounded-xl" />
            </div>
            <div>
              <Label>Make</Label>
              <Input value={formData.make} className="h-12 rounded-xl" />
            </div>
            <div>
              <Label>Model</Label>
              <Input value={formData.model} className="h-12 rounded-xl" />
            </div>
          </div>
        </>
      ),
    },
    {
      id: 'customization',
      title: 'Customization',
      description: 'Personalize your vehicle',
      content: (
        <div>
          <Label>Nickname</Label>
          <Input 
            value={formData.nickname} 
            placeholder="Family Car, Work Truck..."
            className="h-12 rounded-xl"
          />
        </div>
      ),
    },
  ]

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Edit Vehicle</button>
      
      <CardFormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        title="Edit Vehicle Details"
        description="Update your vehicle information"
        icon={<Car className="w-6 h-6 text-blue-600" />}
        sections={sections}
        isLoading={isLoading}
      />
    </>
  )
}
```

---

## 🎯 FullWidthModal - Image Processing

```tsx
import { useState } from 'react'
import { FullWidthModal } from '@/components/modals'
import { Camera } from 'lucide-react'

function ProcessImageButton({ imageUrl }) {
  const [isOpen, setIsOpen] = useState(false)
  const [extractedData, setExtractedData] = useState({})
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    
    try {
      await fetch('/api/process-image', {
        method: 'POST',
        body: JSON.stringify(extractedData),
      })
      setIsOpen(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRetry = () => {
    // Reprocess image logic
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Process Image</button>
      
      <FullWidthModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        title="Process Dashboard Image"
        description="Review and confirm extracted data"
        icon={<Camera className="w-6 h-6 text-blue-600" />}
        submitLabel="Confirm & Save"
        secondaryAction={{
          label: 'Retry Scan',
          onClick: handleRetry,
        }}
        isLoading={isProcessing}
      >
        <div className="grid grid-cols-2 gap-8">
          {/* Left: Image Preview */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Captured Image</h3>
            <img 
              src={imageUrl} 
              alt="Dashboard" 
              className="w-full rounded-xl border border-gray-200"
            />
          </div>
          
          {/* Right: Extracted Data Form */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Extracted Data</h3>
            <div className="space-y-4">
              <div>
                <Label>Odometer Reading</Label>
                <Input 
                  type="number"
                  value={extractedData.miles}
                  className="h-12 rounded-xl"
                />
              </div>
              <div>
                <Label>Fuel Level</Label>
                <Input 
                  type="number"
                  value={extractedData.fuelLevel}
                  className="h-12 rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </FullWidthModal>
    </>
  )
}
```

---

## 🎯 AlertModal - Delete Confirmation

```tsx
import { useState } from 'react'
import { AlertModal } from '@/components/modals'

function DeleteVehicleButton({ vehicleId, vehicleName }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
      })
      // Navigate away or refresh
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <button onClick={() => setShowConfirm(true)} className="text-red-600">
        Delete Vehicle
      </button>
      
      <AlertModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Vehicle?"
        description={`This will permanently delete "${vehicleName}" and all its history. This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isLoading={isDeleting}
      />
    </>
  )
}
```

**Other Variants:**

```tsx
// Info Alert
<AlertModal
  variant="info"
  title="New Feature Available"
  description="Check out the new fleet management dashboard!"
  confirmLabel="Show Me"
/>

// Warning Alert
<AlertModal
  variant="warning"
  title="Unsaved Changes"
  description="You have unsaved changes. Do you want to discard them?"
  confirmLabel="Discard"
/>

// Success Alert
<AlertModal
  variant="success"
  title="Vehicle Added!"
  description="Your new vehicle has been successfully added to your garage."
  confirmLabel="View Vehicle"
/>
```

---

## 🎯 Conditional Sections in CardFormModal

```tsx
const sections: ModalSection[] = [
  {
    id: 'always-visible',
    title: 'Required Information',
    content: <RequiredFields />,
  },
  {
    id: 'optional-section',
    title: 'Optional Details',
    content: <OptionalFields />,
    show: showOptionalFields, // Only renders if true
  },
  {
    id: 'fuel-specific',
    title: 'Fuel Details',
    content: <FuelFields />,
    show: eventType === 'fuel', // Conditional based on state
  },
]

<CardFormModal
  isOpen={isOpen}
  onClose={onClose}
  onSubmit={handleSubmit}
  title="Edit Event"
  sections={sections}
/>
```

---

## 🎯 Custom BaseModal (Advanced)

For unique layouts not covered by standard types:

```tsx
import { BaseModal, ModalHeader, ModalContent, ModalFooter } from '@/components/modals'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

function CustomModal() {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalHeader
        title="Custom Layout Modal"
        description="Build anything you need"
        icon={<Sparkles className="w-6 h-6 text-blue-600" />}
        onClose={onClose}
      />
      
      <ModalContent variant="standard">
        {/* Your completely custom content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Custom layout here */}
        </div>
      </ModalContent>
      
      <ModalFooter>
        <div className="flex justify-between w-full">
          <Button variant="ghost">Help</Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button>Save</Button>
          </div>
        </div>
      </ModalFooter>
    </BaseModal>
  )
}
```

---

## 📐 Size Reference

```tsx
// Small - Alerts, simple confirmations
<SimpleFormModal size="sm" ... />  // max-w-sm (384px)

// Medium - Quick forms
<SimpleFormModal size="md" ... />  // max-w-md (448px)

// Large - Standard multi-section forms
<CardFormModal size="lg" ... />    // max-w-2xl (672px)

// Extra Large - Rich content, split layouts
<FullWidthModal size="xl" ... />   // max-w-4xl (896px)

// Full - Max width
<BaseModal size="full" ... />      // max-w-5xl (1024px)
```

---

## 🎨 Styling Inputs Consistently

All inputs should follow this pattern:

```tsx
<Input 
  className="mt-2 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
/>

<Textarea
  className="mt-2 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
  rows={3}
/>
```

---

## 🔧 Best Practices Checklist

- ✅ Always provide an icon for visual context
- ✅ Use descriptive titles and descriptions
- ✅ Handle loading states to prevent double submission
- ✅ Show error messages clearly
- ✅ Group related fields logically
- ✅ Use appropriate modal size for content
- ✅ Disable overlay close during processing
- ✅ Test keyboard navigation (ESC key)
- ✅ Reset form state when modal closes
- ✅ Use `h-12` for input heights
- ✅ Use `rounded-xl` for input borders
- ✅ Use `space-y-6` for field spacing
