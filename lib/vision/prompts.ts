// Schema-Driven Prompt Generation
// Single source of truth for prompt generation logic

import { DocumentType } from './types'
import { DOCUMENT_SCHEMAS, getOCRExtractionFocus, DocumentSchema } from './schemas'

/**
 * Generates OCR prompts for basic text extraction
 */
export function generateOCRPrompt(documentType?: DocumentType): string {
  const basePrompt = `You are an expert OCR system. Extract all visible text from this image with high accuracy.

Return the text in a structured JSON format:
{
  "extracted_text": "All visible text from the image",
  "confidence": 0.95,
  "text_regions": [
    {
      "text": "Individual text region",
      "position": "top-left|top-right|center|bottom-left|bottom-right",
      "confidence": 0.98
    }
  ]
}

Rules:
- Extract ALL visible text, including small print
- Maintain original formatting and line breaks where possible
- If text is unclear or partially obscured, note it in the confidence score
- Return confidence as a decimal between 0 and 1
- Group text by logical regions (header, body, footer, etc.)
- If no text is visible, return empty extracted_text with confidence 0`

  // Add document-specific guidance from schema
  if (documentType) {
    const focus = getOCRExtractionFocus(documentType)
    if (focus) {
      return basePrompt + `\n\nSpecial focus for ${documentType}:\n` + 
             focus.map((rule: string) => `- ${rule}`).join('\n')
    }
  }

  return basePrompt
}

/**
 * Generates document processing prompts from schema definitions
 */
export function generateDocumentPrompt(documentType: DocumentType): string {
  const schema = DOCUMENT_SCHEMAS[documentType]
  
  if (!schema) {
    return generateGenericDocumentPrompt()
  }

  return buildPromptFromSchema(documentType, schema)
}

/**
 * Builds a structured prompt from a document schema
 */
function buildPromptFromSchema(documentType: DocumentType, schema: DocumentSchema): string {
  const typeLabel = documentType.replace('_', ' ')
  
  let prompt = `You are an expert ${typeLabel} analyzer. Extract structured data from this ${typeLabel}.

Return valid JSON matching this exact schema:
{`

  // Build JSON schema from fields
  const fieldEntries = Object.entries(schema.fields)
  fieldEntries.forEach(([field, type], index) => {
    const isLast = index === fieldEntries.length - 1
    prompt += `\n  "${field}": ${type}${isLast ? '' : ','}`
  })

  prompt += '\n}\n'

  // Add critical notes if present
  if (schema.criticalNotes && schema.criticalNotes.length > 0) {
    prompt += '\nCRITICAL NOTES:\n'
    prompt += schema.criticalNotes.map(note => `- ${note}`).join('\n')
    prompt += '\n'
  }

  // Add extraction rules
  prompt += '\nExtraction Rules:\n'
  prompt += schema.rules.map(rule => `- ${rule}`).join('\n')

  // Add few-shot examples if present
  if (schema.fewShotExamples && schema.fewShotExamples.length > 0) {
    prompt += '\n\nFEW-SHOT EXAMPLES:\n'
    schema.fewShotExamples.forEach((example, i) => {
      prompt += `\nExample ${i + 1} - ${example.scenario}:\n`
      prompt += `✓ CORRECT: ${example.correct}\n`
      if (example.incorrect) {
        prompt += `✗ INCORRECT: ${example.incorrect}\n`
      }
    })
  }

  return prompt
}

/**
 * Generic document processing for unknown types
 */
function generateGenericDocumentPrompt(): string {
  return `You are an expert document analyzer. Extract key information from this automotive-related document.

Return valid JSON matching this schema:
{
  "document_type": "string|null",
  "key_information": {
    "vendor_name": "string|null",
    "date": "YYYY-MM-DD|null",
    "amount": "number|null",
    "vehicle_info": "string|null"
  },
  "extracted_text": "string",
  "confidence": "number 0-1"
}

Extraction Rules:
- Identify document type (invoice, receipt, certificate, etc.)
- Extract key business information
- Parse any monetary amounts
- Note vehicle-related information
- Include full text extraction
- Assess overall confidence in extraction`
}
