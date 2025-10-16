# MotoMind AI - Directory Structure

## 📁 Organized Project Structure

### `/pages` - Application Routes
```
pages/
├── app/                    # Main application pages
│   ├── garage.tsx         # Vehicle garage dashboard
│   └── onboard.tsx        # Vehicle onboarding flow
├── tools/                 # Utility tools
│   └── capture/           # Photo/receipt capture tools
├── admin/                 # Admin interface
├── api/                   # API routes (organized)
├── garage.tsx             # → Redirect to app/garage
├── onboard.tsx            # → Redirect to app/onboard
├── capture.tsx            # → Redirect to tools/capture
└── index.tsx              # → Redirect to garage
```

### `/pages/api` - API Endpoints (Organized)
```
api/
├── core/                  # Core business logic
│   ├── vehicles.ts        # Vehicle CRUD operations
│   ├── garages.ts         # Garage management
│   ├── uploads.ts         # File upload handling
│   ├── upload-vehicle-photo.ts
│   ├── manual-events.ts   # Manual event logging
│   ├── metrics.ts         # Vehicle metrics
│   ├── explain.ts         # AI explanations
│   └── explain-with-guardrails.ts
├── integrations/          # External service integrations
│   ├── decode-vin.ts      # VIN decoding service
│   ├── extract-vin.ts     # VIN extraction from images
│   ├── vision-ocr.ts      # OCR processing
│   └── process-receipt.ts # Receipt processing
├── utilities/             # Helper utilities
│   ├── health.ts          # Health check endpoint
│   ├── demo-reset.ts      # Demo data reset
│   ├── demo-seed.ts       # Demo data seeding
│   ├── pdf-export.ts      # PDF generation
│   └── generate-pdf-report.ts
├── vehicles/              # Vehicle-specific APIs
│   ├── [id]/
│   │   └── images.ts      # Vehicle image management
└── admin/                 # Admin APIs
```

### `/components` - React Components
```
components/
├── vehicle/               # Vehicle-related components
│   ├── onboarding/        # Onboarding flow components
│   └── management/        # Vehicle management components
├── capture/               # Photo/receipt capture components
├── ui/                    # Reusable UI components
├── layout/                # Layout components
├── explain/               # AI explanation components
├── fleet/                 # Fleet management components
└── insights/              # Analytics components
```

## 🎯 Key Working Routes

### Main Application
- **`/`** → Redirects to garage
- **`/garage`** → Vehicle garage dashboard (WORKING ✅)
- **`/onboard`** → Vehicle onboarding flow (WORKING ✅)
- **`/capture`** → Photo/receipt capture tools

### API Endpoints (All Working ✅)
- **`/api/vehicles`** → Vehicle CRUD
- **`/api/garages`** → Garage management  
- **`/api/decode-vin`** → VIN decoding
- **`/api/upload-vehicle-photo`** → Photo uploads
- **`/api/vehicles/[id]/images`** → Vehicle image management

## 🔧 Organization Benefits

### ✅ **Clean Structure**
- Logical grouping of related functionality
- Clear separation of concerns
- Easy to navigate and understand

### ✅ **Backward Compatibility**  
- All existing routes still work via redirects
- No breaking changes to working functionality
- Photo upload system intact

### ✅ **Scalable Architecture**
- Easy to add new features in appropriate directories
- Clear patterns for future development
- Organized API endpoints by purpose

### ✅ **No More File Bugs**
- Eliminated problematic `/vehicles` directory
- Clean, simple routing structure
- No more numbered file conflicts

## 🚀 Photo Upload System Status

**WORKING PERFECTLY ✅**
- Onboarding photo upload: `/onboard` 
- Photo persistence: useRef fix implemented
- Image display: `/garage` shows primary images
- Vehicle creation: API creates vehicle_images records
- Primary image system: Fully functional

The photo upload functionality we fixed is preserved and working in the organized structure!
