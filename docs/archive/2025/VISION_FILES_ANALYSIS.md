# 🔍 VISION FILES STRUCTURE ANALYSIS

Generated: 2025-09-29T01:01:29.543Z

## 📁 process.ts

**Size:** 57KB (1688 lines)
**Functions:** 19
**Complexity:** 106 total

**Largest Functions:**
- `generateEnhancedFields` (176 lines, complexity: 13)
- `tagServicesV1` (103 lines, complexity: 8)
- `extractVendorWithPrecedence` (102 lines, complexity: 23)
- `normalizeVendorName` (59 lines, complexity: 6)
- `extractServices` (55 lines, complexity: 15)

**🎯 Recommended Splits:**

### process-service-processor.ts
- **Purpose:** service-processing
- **Functions:** extractServices, categorizeService, calculateNextService, normalizeServices, tagServicesV1, serviceNames, serviceList
- **Size:** ~241 lines
- **Complexity:** 39

### process-data-extractor.ts
- **Purpose:** data-extraction
- **Functions:** extractVendorWithPrecedence, normalizeVendorName, extractMileageWithPatterns, parseOpenAIResponse, normalizeFuelStation
- **Size:** ~305 lines
- **Complexity:** 42

### process-utils.ts
- **Purpose:** utilities
- **Functions:** itemsText, classifyDocument, generateEnhancedFields
- **Size:** ~186 lines
- **Complexity:** 13

**Reasoning:**
- Original file has 1688 lines (57KB)
- Contains 19 functions with varying complexity
- Recommended 3 module splits for better maintainability

---

## 📁 processImage.ts

**Size:** 26KB (778 lines)
**Functions:** 0
**Complexity:** 0 total

**Reasoning:**
- Original file has 778 lines (26KB)
- Contains 0 functions with varying complexity
- Recommended 0 module splits for better maintainability

---

