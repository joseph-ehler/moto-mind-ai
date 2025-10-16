# Multi-Document Capture Testing Guide

## Critical Questions to Answer

### 1. Vision API Behavior with Similar Documents
**Question**: Does OpenAI Vision extract different data from page 1 (summary) vs page 2 (itemized charges) of the same invoice?

**Test Scenario**:
- Page 1: Service summary with total $755.81
- Page 2: Itemized breakdown with individual line items
- Page 3: Warranty terms with coverage details

**Expected Behavior**:
- Page 1 should extract: total_amount, shop_name, service_date, high-level services
- Page 2 should extract: detailed line items, labor breakdown, parts costs
- Page 3 should extract: warranty_months, coverage terms, conditions

**Console Logs to Watch**:
```
📄 EXTRACTED DATA from document 1: { total_amount: 755.81, shop_name: "Buick GMC", services: "Maintenance" }
📄 EXTRACTED DATA from document 2: { labor_cost: 494, parts_cost: 261.81, line_items: [...] }
📄 EXTRACTED DATA from document 3: { warranty_months: 12, coverage: "Powertrain" }
```

### 2. Data Format Consistency
**Question**: Do camera captures (base64) and file uploads (File objects) get processed consistently?

**Test Scenario**:
- Document 1: Take photo with camera
- Document 2: Upload file from gallery
- Document 3: Take another photo

**Console Logs to Watch**:
```
📋 VISION API RESPONSE for document 1: (camera capture)
📋 FILE UPLOAD VISION API RESPONSE for document 2: (file upload)
📋 VISION API RESPONSE for document 3: (camera capture)
```

**Expected**: All should return same data structure regardless of input method.

### 3. Merge Conflict Resolution
**Question**: If document 1 shows $100 and document 2 shows $105, which wins?

**Test Scenario**:
- Upload documents with conflicting totals
- Check merge conflict logging

**Console Logs to Watch**:
```
⚠️ CONFLICT in total_amount: 100 vs 105 - using later value
⚠️ MERGE CONFLICTS DETECTED: [
  { field: "extracted_data.total_amount", document1: 100, document2: 105, resolution: "using_document2" }
]
```

**Current Resolution**: Later document wins (could be enhanced with smarter logic)

### 4. Cost Analysis
**Question**: Is 3 Vision API calls ($0.30+) acceptable for multi-page invoices?

**Cost Breakdown**:
- OpenAI Vision API: ~$0.10 per image
- 3-page service invoice: ~$0.30 per upload
- Monthly volume estimate needed

**Alternatives to Consider**:
- Batch processing (combine images before Vision API)
- Smart page detection (skip duplicate/similar pages)
- User choice (process all vs summary only)

## Testing Checklist

### Basic Multi-Document Flow
- [ ] Photo → Add Another → Photo → Save
- [ ] Upload → Add Another → Upload → Save  
- [ ] Photo → Add Another → Upload → Save (mixed mode)

### Vision API Processing
- [ ] All documents get processed (check API call count)
- [ ] Different data extracted from each document
- [ ] No duplicate/redundant extractions
- [ ] Confidence scores vary appropriately

### Data Merging
- [ ] All extracted data appears in final result
- [ ] Conflicts detected and logged
- [ ] Merge metadata added (multi_document: true, document_count: N)
- [ ] No data loss during merge

### Storage Format
- [ ] documentImages array contains all base64 strings
- [ ] documentDataArray contains all Vision API responses
- [ ] Final merged data sent to save API
- [ ] additional_images array populated correctly

### Error Scenarios
- [ ] Vision API failure on document 2 (does document 1 data persist?)
- [ ] Network failure during multi-document flow
- [ ] User cancels mid-flow (state cleanup)

## Real-World Test Cases

### Service Invoice (3 pages)
1. **Summary Page**: Total cost, shop, date, vehicle info
2. **Itemized Page**: Labor breakdown, parts list, tax details  
3. **Warranty Page**: Coverage terms, expiration, conditions

### Insurance Card
1. **Front**: Policy number, coverage dates, company info
2. **Back**: Emergency contacts, claim procedures, fine print

### Accident Report
1. **Damage Photo**: Vehicle damage assessment
2. **License Plate**: Vehicle identification
3. **Police Report**: Official documentation

## Success Criteria

### Functional Requirements
- ✅ All documents processed with Vision API
- ✅ Comprehensive data extraction from each document
- ✅ Intelligent merging without data loss
- ✅ Conflict detection and resolution
- ✅ Consistent behavior across camera/upload modes

### Performance Requirements
- ✅ Processing time reasonable (<30s for 3 documents)
- ✅ Memory usage acceptable (base64 storage)
- ✅ Network requests optimized (parallel processing?)

### Cost Requirements
- ✅ Vision API costs justified by value
- ✅ No unnecessary duplicate processing
- ✅ User awareness of multi-document costs

## Implementation Status

### ✅ Completed
- All documents processed with Vision API
- Smart data merging with conflict detection
- Comprehensive logging for debugging
- Multi-modal support (camera + file upload)

### 🔄 Needs Testing
- Real multi-page service invoice processing
- Vision API behavior with similar documents
- Data format consistency verification
- Merge conflict scenarios

### 📋 Future Enhancements
- Smarter conflict resolution (user choice, confidence-based)
- Batch Vision API processing for cost optimization
- Page similarity detection to avoid redundant processing
- User preview of merged data before save
