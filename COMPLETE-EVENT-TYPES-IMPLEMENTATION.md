# 🎯 Complete Event Types Implementation Plan

## **CURRENT STATUS AUDIT**

### **✅ Working Event Types:**
1. **`odometer`** - Dedicated Vision processing, proper UI confirmation
2. **`document`** - Generic document processing, basic UI
3. **`vin`** - Dedicated processing (onboarding only)

### **❌ Incomplete Event Types:**
1. **`fuel`** - No dedicated Vision processing, falls back to generic
2. **`maintenance`** - No dedicated Vision processing, falls back to generic  
3. **`inspection`** - No dedicated Vision processing, falls back to generic
4. **`reminder`** - Manual entry only (no photo capture needed)

---

## **🎯 IMPLEMENTATION STRATEGY**

### **Phase 1: Add Missing Vision Processors**
Create dedicated Vision API functions for:
- `processFuel()` - Extract gallons, price, station, total
- `processMaintenance()` - Extract services, costs, shop, date
- `processInspection()` - Extract inspection type, results, expiration

### **Phase 2: Update Vision API Router**
Add new capture types to the switch statement:
```typescript
case 'fuel':
  result = await processFuel(base64Image)
  break
case 'maintenance':
case 'service':
  result = await processMaintenance(base64Image)
  break
case 'inspection':
  result = await processInspection(base64Image)
  break
```

### **Phase 3: Enhance SimplePhotoModal**
Update capture type support:
```typescript
captureType?: 'document' | 'odometer' | 'fuel' | 'maintenance' | 'inspection'
```

### **Phase 4: Update Confirmation UI**
Add proper confirmation text for each type:
- **Fuel:** `"$45.67 • 12.5 gal • Shell — Add fuel record"`
- **Maintenance:** `"Oil change • $75 • Joe's Auto — Add service record"`
- **Inspection:** `"Safety inspection • Pass • Expires 2026-09-27 — Add inspection record"`

### **Phase 5: Integration Points**
Update dashboard buttons to use specific capture types:
- **"Add Fuel"** → `captureType="fuel"`
- **"Log Service"** → `captureType="maintenance"`
- **"Update Mileage"** → `captureType="odometer"`

---

## **🔧 TECHNICAL IMPLEMENTATION**

### **1. Fuel Processing Function**
```typescript
async function processFuel(base64Image: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{
      role: "user",
      content: [{
        type: "text",
        text: `Extract fuel purchase information:
        {
          "type": "fuel",
          "total_amount": number,
          "gallons": number,
          "price_per_gallon": number,
          "fuel_type": "string (regular, premium, diesel)",
          "station_name": "string",
          "date": "YYYY-MM-DD",
          "payment_method": "string",
          "confidence": number (0-100)
        }`
      }, {
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${base64Image}` }
      }]
    }],
    max_tokens: 500
  })
  return parseOpenAIResponse(response.choices[0]?.message?.content)
}
```

### **2. Maintenance Processing Function**
```typescript
async function processMaintenance(base64Image: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{
      role: "user", 
      content: [{
        type: "text",
        text: `Extract maintenance/service information:
        {
          "type": "maintenance",
          "services_performed": ["array of services"],
          "total_amount": number,
          "labor_cost": number,
          "parts_cost": number,
          "shop_name": "string",
          "date": "YYYY-MM-DD",
          "odometer_reading": number,
          "next_service_due": "YYYY-MM-DD or mileage",
          "confidence": number (0-100)
        }`
      }, {
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${base64Image}` }
      }]
    }],
    max_tokens: 800
  })
  return parseOpenAIResponse(response.choices[0]?.message?.content)
}
```

### **3. Inspection Processing Function**
```typescript
async function processInspection(base64Image: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{
      role: "user",
      content: [{
        type: "text", 
        text: `Extract inspection information:
        {
          "type": "inspection",
          "inspection_type": "string (safety, emissions, annual)",
          "result": "string (pass, fail, conditional)",
          "inspector": "string",
          "facility": "string", 
          "date": "YYYY-MM-DD",
          "expiration_date": "YYYY-MM-DD",
          "odometer_reading": number,
          "issues_found": ["array of issues if any"],
          "confidence": number (0-100)
        }`
      }, {
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${base64Image}` }
      }]
    }],
    max_tokens: 600
  })
  return parseOpenAIResponse(response.choices[0]?.message?.content)
}
```

---

## **🎯 EXPECTED USER EXPERIENCE**

### **Fuel Capture Flow:**
1. Click "Add Fuel" → SimplePhotoModal opens with `captureType="fuel"`
2. Take photo of gas receipt → Vision API extracts fuel data
3. Confirmation: `"$45.67 • 12.5 gal • Shell — Add fuel record"`
4. Save → Creates fuel event with gallons, price, station

### **Maintenance Capture Flow:**
1. Click "Log Service" → SimplePhotoModal opens with `captureType="maintenance"`
2. Take photo of service invoice → Vision API extracts service data
3. Confirmation: `"Oil change • $75 • Joe's Auto — Add service record"`
4. Save → Creates maintenance event with services, cost, shop

### **Inspection Capture Flow:**
1. Click "Add Inspection" → SimplePhotoModal opens with `captureType="inspection"`
2. Take photo of inspection certificate → Vision API extracts inspection data
3. Confirmation: `"Safety inspection • Pass • Expires 2026-09-27 — Add inspection record"`
4. Save → Creates inspection event with result, expiration

---

## **📋 IMPLEMENTATION CHECKLIST**

### **Backend (Vision API):**
- [ ] Add `processFuel()` function
- [ ] Add `processMaintenance()` function  
- [ ] Add `processInspection()` function
- [ ] Update Vision API router switch statement
- [ ] Test all new processors with sample images

### **Frontend (SimplePhotoModal):**
- [ ] Update `captureType` prop to include all types
- [ ] Update confirmation text for fuel events
- [ ] Update confirmation text for maintenance events
- [ ] Update confirmation text for inspection events
- [ ] Update event icons for all types

### **Integration (Dashboard):**
- [ ] Add "Add Fuel" button with `captureType="fuel"`
- [ ] Add "Log Service" button with `captureType="maintenance"`
- [ ] Add "Add Inspection" button with `captureType="inspection"`
- [ ] Update existing "Update Mileage" to use `captureType="odometer"`

### **Event Processing:**
- [ ] Update event extraction logic for fuel events
- [ ] Update event extraction logic for maintenance events
- [ ] Update event extraction logic for inspection events
- [ ] Ensure all events save to unified `vehicle_events` table

---

## **🚀 SUCCESS CRITERIA**

### **All Event Types Should:**
1. **Have dedicated Vision processing** - No more generic fallbacks
2. **Extract relevant data** - Type-specific fields (gallons, services, results)
3. **Show proper confirmations** - Clear, actionable confirmation text
4. **Save correctly** - Proper event structure in database
5. **Display in timeline** - Chronological order with proper formatting

### **User Experience Goals:**
- **"Snap and done"** - Photo → Process → Confirm → Save (5 seconds)
- **Clear feedback** - Users know exactly what was extracted
- **No guessing** - System confidently identifies document types
- **Consistent flow** - Same interaction pattern for all event types

---

**Status: Ready to implement comprehensive event type support with proper Vision API integration for all capture scenarios.** 🎯
