# 🏗️ Multi-Document Vision System Architecture

## Overview
Scalable architecture for scanning multiple document types (VIN, license plates, driver's licenses, insurance cards, etc.) with shared infrastructure and type-specific optimizations.

---

## 🎯 Design Philosophy

### **Hybrid Architecture: Unified Base + Specialized Wrappers**

**Why Hybrid?**
- ✅ **DRY Principle** - Shared UI, camera, upload logic
- ✅ **Type Safety** - Specific types for each document
- ✅ **Optimization** - Custom OCR prompts per type
- ✅ **Maintainability** - Single source of truth
- ✅ **Extensibility** - Easy to add new document types

---

## 📐 Architecture Layers

### **Layer 1: Base Component** (`DocumentScanner`)
**Purpose:** Universal scanning interface

```tsx
<DocumentScanner
  type="vin" | "license-plate" | "drivers-license" | "insurance"
  mode="single" | "batch"
  onComplete={(results) => void}
  plugins={[...]}
  config={typeConfig}
/>
```

**Responsibilities:**
- Camera/gallery UI
- File handling & validation
- Batch processing queue
- Progress tracking
- Result aggregation
- Error handling

---

### **Layer 2: Type-Specific Wrappers**
**Purpose:** Ergonomic, pre-configured scanners

```tsx
// VIN Scanner
<VINScanner
  onComplete={(vehicles) => void}
  enrichWithNHTSA={true}
  validateCheckDigit={true}
/>

// License Plate Scanner  
<LicensePlateScanner
  onComplete={(plates) => void}
  stateValidation={true}
  format="US" | "CA" | "MX"
/>

// Driver's License Scanner
<DriversLicenseScanner
  onComplete={(licenses) => void}
  extractPhoto={true}
  validateExpiration={true}
/>

// Insurance Card Scanner
<InsuranceCardScanner
  onComplete={(policies) => void}
  verifyCarrier={true}
  extractDates={true}
/>
```

**Benefits:**
- Pre-configured OCR prompts
- Type-specific validation
- Optimized UI overlays
- Domain-specific plugins
- Better TypeScript types

---

### **Layer 3: Processing Service** (`DocumentProcessingService`)
**Purpose:** Unified processing pipeline with type routing

```typescript
class DocumentProcessingService {
  async process(image: File, type: DocumentType): Promise<Result> {
    // 1. Preprocess image
    const preprocessed = await this.preprocess(image)
    
    // 2. OCR with type-specific prompt
    const prompt = this.getPrompt(type)
    const rawData = await this.ocr(preprocessed, prompt)
    
    // 3. Parse with type-specific parser
    const parsed = this.parsers[type].parse(rawData)
    
    // 4. Validate with type-specific rules
    const validated = this.validators[type].validate(parsed)
    
    // 5. Enrich with external APIs
    const enriched = await this.enrichers[type].enrich(validated)
    
    return enriched
  }
}
```

---

### **Layer 4: Type-Specific Processors**

#### **VIN Processor**
```typescript
export const vinProcessor: DocumentProcessor = {
  type: 'vin',
  
  prompt: `Extract VIN (17 characters, excludes I/O/Q)...`,
  
  parse: (text) => {
    const vin = text.match(/[A-HJ-NPR-Z0-9]{17}/i)?.[0]
    return { vin: vin?.toUpperCase() }
  },
  
  validate: (data) => {
    return {
      valid: validateCheckDigit(data.vin),
      errors: []
    }
  },
  
  enrich: async (data) => {
    const vehicle = await decodeVIN(data.vin)
    return { ...data, ...vehicle }
  }
}
```

#### **License Plate Processor**
```typescript
export const licensePlateProcessor: DocumentProcessor = {
  type: 'license-plate',
  
  prompt: `Extract license plate number and state...`,
  
  parse: (text) => {
    const match = text.match(/([A-Z0-9]+)\s+([A-Z]{2})/i)
    return {
      plate: match?.[1],
      state: match?.[2]
    }
  },
  
  validate: (data) => {
    return {
      valid: isValidPlateFormat(data.plate, data.state),
      errors: []
    }
  },
  
  enrich: async (data) => {
    // Optional: DMV lookup if available
    return data
  }
}
```

#### **Driver's License Processor**
```typescript
export const driversLicenseProcessor: DocumentProcessor = {
  type: 'drivers-license',
  
  prompt: `Extract driver's license information:
  - Full name
  - License number
  - Date of birth
  - Address
  - Issue date
  - Expiration date
  - State/Province
  Return as structured JSON.`,
  
  parse: (text) => {
    // Parse JSON response from OpenAI
    const data = JSON.parse(text)
    return {
      licenseNumber: data.license_number,
      firstName: data.first_name,
      lastName: data.last_name,
      dob: data.date_of_birth,
      address: data.address,
      state: data.state,
      issueDate: data.issue_date,
      expirationDate: data.expiration_date
    }
  },
  
  validate: (data) => {
    const errors = []
    if (!data.licenseNumber) errors.push('Missing license number')
    if (new Date(data.expirationDate) < new Date()) {
      errors.push('License expired')
    }
    return { valid: errors.length === 0, errors }
  },
  
  enrich: async (data) => {
    // Calculate age, validate address format, etc.
    const age = calculateAge(data.dob)
    return { ...data, age }
  }
}
```

#### **Insurance Card Processor**
```typescript
export const insuranceCardProcessor: DocumentProcessor = {
  type: 'insurance',
  
  prompt: `Extract insurance card information:
  - Policy number
  - Insurance company/carrier
  - Policyholder name
  - Effective date
  - Expiration date
  - Vehicle VIN (if present)
  - Coverage type
  Return as structured JSON.`,
  
  parse: (text) => {
    const data = JSON.parse(text)
    return {
      policyNumber: data.policy_number,
      carrier: data.carrier,
      policyholderName: data.policyholder_name,
      effectiveDate: data.effective_date,
      expirationDate: data.expiration_date,
      vin: data.vin,
      coverageType: data.coverage_type
    }
  },
  
  validate: (data) => {
    const errors = []
    if (!data.policyNumber) errors.push('Missing policy number')
    if (new Date(data.expirationDate) < new Date()) {
      errors.push('Policy expired')
    }
    return { valid: errors.length === 0, errors }
  },
  
  enrich: async (data) => {
    // Optional: Verify carrier, cross-reference VIN
    if (data.vin) {
      const vehicle = await decodeVIN(data.vin)
      return { ...data, vehicle }
    }
    return data
  }
}
```

---

## 🔌 Plugin Architecture

### **Type-Specific Plugins**

```typescript
// VIN Plugins
const vinPlugins = [
  vinValidation({ validateCheckDigit: true }),
  vinDecoding({ apiProvider: 'nhtsa' }),
  confidenceScoring({ minConfidence: 0.90 })
]

// License Plate Plugins
const platePlugins = [
  plateFormatValidation({ country: 'US' }),
  stateValidation({ allowedStates: ['CA', 'TX', 'NY'] }),
  confidenceScoring({ minConfidence: 0.85 })
]

// Driver's License Plugins
const licensePlugins = [
  expirationCheck({ warnDays: 30 }),
  ageVerification({ minAge: 16 }),
  addressValidation({ requireZip: true }),
  confidenceScoring({ minConfidence: 0.90 })
]

// Insurance Card Plugins
const insurancePlugins = [
  expirationCheck({ warnDays: 30 }),
  carrierValidation({ verifyAgainstList: true }),
  vinCrossReference({ validateAgainstVehicle: true }),
  confidenceScoring({ minConfidence: 0.85 })
]
```

---

## 📁 File Structure

```
vision/
├── core/
│   ├── DocumentScanner.tsx           # Base unified scanner
│   ├── UnifiedCameraCapture.tsx      # Camera component
│   └── FileUpload.tsx                # Upload component
│
├── scanners/
│   ├── VINScanner.tsx                # VIN-specific wrapper
│   ├── LicensePlateScanner.tsx       # Plate-specific wrapper
│   ├── DriversLicenseScanner.tsx     # License-specific wrapper
│   ├── InsuranceCardScanner.tsx      # Insurance-specific wrapper
│   └── index.ts                      # Exports
│
├── services/
│   ├── DocumentProcessingService.ts  # Unified processor
│   ├── processors/
│   │   ├── vin.ts                    # VIN processor
│   │   ├── license-plate.ts          # Plate processor
│   │   ├── drivers-license.ts        # License processor
│   │   └── insurance.ts              # Insurance processor
│   └── index.ts
│
├── plugins/
│   ├── vin/
│   │   ├── validation.ts
│   │   ├── decoding.ts
│   │   └── enrichment.ts
│   ├── license-plate/
│   │   ├── format-validation.ts
│   │   └── state-validation.ts
│   ├── drivers-license/
│   │   ├── expiration-check.ts
│   │   ├── age-verification.ts
│   │   └── address-validation.ts
│   └── insurance/
│       ├── expiration-check.ts
│       ├── carrier-validation.ts
│       └── vin-cross-reference.ts
│
└── types/
    ├── document.ts                   # Base types
    ├── vin.ts                        # VIN types
    ├── license-plate.ts              # Plate types
    ├── drivers-license.ts            # License types
    └── insurance.ts                  # Insurance types
```

---

## 🚀 Implementation Phases

### **Phase 1: Foundation** (Already Complete ✅)
- [x] Base `DocumentScanner` (as `BatchVisionScanner`)
- [x] `UnifiedCameraCapture`
- [x] `FileUpload`
- [x] `VisionProcessingService`
- [x] Plugin architecture
- [x] VIN processor with NHTSA integration

### **Phase 2: Type System** (Next Steps)
1. Create `DocumentProcessor` interface
2. Refactor VIN logic into processor
3. Add processor registry
4. Update API endpoint to route by type

### **Phase 3: Additional Scanners** (Expanding)
1. **License Plate Scanner**
   - OCR prompt for plates
   - State format validation
   - Optional DMV integration
   
2. **Driver's License Scanner**
   - Structured JSON extraction
   - Expiration validation
   - Age verification
   
3. **Insurance Card Scanner**
   - Policy data extraction
   - Carrier validation
   - VIN cross-reference

### **Phase 4: UI Components** (Polish)
1. Type-specific overlays
2. Real-time validation feedback
3. Guided capture modes
4. Result templates per type

### **Phase 5: Advanced Features** (Optional)
1. Auto-detection (scan any document, detect type)
2. Multi-document batch (mix types)
3. Document verification (fake detection)
4. Export templates per type

---

## 💡 Usage Examples

### **Single-Purpose Scanners**

```tsx
// VIN Scanner (Fleet Management)
<VINScanner
  mode="batch"
  maxScans={50}
  onComplete={(vehicles) => {
    // Save to database
    vehicles.forEach(v => db.vehicles.create(v))
  }}
  enrichWithNHTSA={true}
/>

// License Plate Scanner (Parking System)
<LicensePlateScanner
  mode="single"
  onComplete={(plate) => {
    // Check against permit database
    if (hasPermit(plate.number)) {
      openGate()
    }
  }}
  continuousMode={true}
/>

// Driver's License (Onboarding)
<DriversLicenseScanner
  mode="single"
  onComplete={(license) => {
    // Verify age, populate form
    if (license.age >= 18) {
      prefillForm(license)
    }
  }}
  validateExpiration={true}
/>

// Insurance Card (Claims)
<InsuranceCardScanner
  mode="single"
  onComplete={(insurance) => {
    // Verify coverage
    verifyCoverage(insurance.policyNumber)
  }}
  requireActive={true}
/>
```

### **Unified Multi-Document Scanner**

```tsx
// Document Center (Multi-purpose)
<DocumentScanner
  allowedTypes={['vin', 'license-plate', 'drivers-license', 'insurance']}
  autoDetectType={true}
  onComplete={(results) => {
    results.forEach(result => {
      switch (result.type) {
        case 'vin':
          processVehicle(result.data)
          break
        case 'drivers-license':
          processDriver(result.data)
          break
        case 'insurance':
          processInsurance(result.data)
          break
      }
    })
  }}
/>
```

---

## 🎯 Decision Matrix: When to Use What?

| Scenario | Use | Reason |
|----------|-----|--------|
| **Fleet Management** | `VINScanner` | Specialized, batch mode, NHTSA |
| **Parking System** | `LicensePlateScanner` | Fast, continuous, specific |
| **Driver Onboarding** | `DriversLicenseScanner` | Form prefill, validation |
| **Claims Processing** | `InsuranceCardScanner` | Policy verification |
| **Multi-purpose App** | `DocumentScanner` | Flexible, auto-detect |
| **Mobile App** | Specialized scanners | Better UX, focused flow |
| **Admin Dashboard** | `DocumentScanner` | Handle anything |

---

## 🔒 Security & Privacy

### **PII Handling**
- ❌ **Never log** license numbers, SSNs, addresses
- ✅ **Hash** sensitive data in analytics
- ✅ **Encrypt** at rest and in transit
- ✅ **Redact** in error messages

### **Data Retention**
- **Images**: Delete after processing (or 24h max)
- **OCR Text**: Encrypted, deleted after 7 days
- **Structured Data**: User controls retention
- **Logs**: Scrubbed of PII

### **Compliance**
- **GDPR**: Right to deletion, data portability
- **CCPA**: Opt-out, data access
- **HIPAA**: If health insurance cards
- **SOC 2**: Audit trails, access controls

---

## 📊 Cost Optimization

### **OpenAI Vision Pricing**
- **gpt-4o**: $0.00268/image (high quality)
- **gpt-4o-mini**: $0.001/image (fast, good for most)
- **Batch API**: 50% discount (async processing)

### **Recommendations**
- **VIN**: Use `gpt-4o-mini` (simple OCR)
- **License Plate**: Use `gpt-4o-mini` (simple OCR)
- **Driver's License**: Use `gpt-4o` (complex structure)
- **Insurance**: Use `gpt-4o` (complex structure)

### **Optimization Strategies**
1. **Caching**: Cache NHTSA results (1 VIN = many requests)
2. **Preprocessing**: Compress images before upload
3. **Batch Mode**: Group similar documents
4. **Fallback**: Use cheaper models first, retry with expensive
5. **Client-side**: Basic validation before API call

---

## 🚀 Next Steps

1. **Refactor** - Extract VIN logic into processor pattern
2. **License Plate** - Implement next (simplest)
3. **Test** - Comprehensive test suite
4. **Document** - API docs, examples
5. **Deploy** - Production rollout

---

## 📚 Additional Resources

- [NHTSA vPIC API](https://vpic.nhtsa.dot.gov/api/)
- [OpenAI Vision Guide](https://platform.openai.com/docs/guides/vision)
- [Driver's License Standards](https://www.aamva.org/)
- [Insurance Card Formats](https://www.naic.org/)

---

**This architecture is designed to scale from a single use case to a comprehensive document processing platform.** 🎯
