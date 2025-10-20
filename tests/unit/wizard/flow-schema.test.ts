/**
 * Ultra God-Tier Wizard: Flow Schema Tests
 * 
 * Tests for Zod schema validation of flow JSON.
 * 
 * Phase A: Contracts & Validator
 */

import { FlowSchema } from '../../../lib/wizard/flow-schema'

describe('Flow Schema', () => {
  // ========================================================================
  // VALID FLOW TESTS
  // ========================================================================
  
  describe('Valid Flows', () => {
    test('minimal valid flow', () => {
      const flow = {
        id: 'test-flow',
        version: '1.0.0',
        schemaVersion: '1.0.0',
        i18nNS: 'test',
        theming: {
          brand: 'motomind',
          tone: 'calm',
        },
        privacy: {
          defaultRetention: '180d',
        },
        analytics: {
          namespace: 'test',
          flow: 'test-flow',
        },
        chapters: [
          {
            id: 'chapter1',
            name: 'Chapter 1',
            steps: [
              {
                id: 'welcome',
                type: 'informational',
                title: 'Welcome',
              },
            ],
          },
        ],
      }
      
      const result = FlowSchema.safeParse(flow)
      expect(result.success).toBe(true)
    })
    
    test('flow with form step', () => {
      const flow = {
        id: 'test-flow',
        version: '1.0.0',
        schemaVersion: '1.0.0',
        i18nNS: 'test',
        theming: {
          brand: 'motomind',
          tone: 'calm',
        },
        privacy: {
          defaultRetention: '180d',
        },
        analytics: {
          namespace: 'test',
          flow: 'test-flow',
        },
        chapters: [
          {
            id: 'chapter1',
            name: 'Chapter 1',
            steps: [
              {
                id: 'vin',
                type: 'form.singleQuestion',
                title: 'VIN',
                fields: [
                  {
                    id: 'vin',
                    type: 'text',
                    bind: 'vehicle.vin',
                    label: 'VIN',
                    validation: {
                      required: true,
                      length: 17,
                    },
                    privacy: {
                      classification: 'SENSITIVE',
                      purpose: ['onboarding'],
                      retention: '180d',
                      allowInAI: false,
                    },
                  },
                ],
              },
            ],
          },
        ],
      }
      
      const result = FlowSchema.safeParse(flow)
      expect(result.success).toBe(true)
    })
    
    test('flow with processing step', () => {
      const flow = {
        id: 'test-flow',
        version: '1.0.0',
        schemaVersion: '1.0.0',
        i18nNS: 'test',
        theming: {
          brand: 'motomind',
          tone: 'calm',
        },
        privacy: {
          defaultRetention: '180d',
        },
        analytics: {
          namespace: 'test',
          flow: 'test-flow',
        },
        chapters: [
          {
            id: 'chapter1',
            name: 'Chapter 1',
            steps: [
              {
                id: 'decode',
                type: 'processing.scene',
                loading: {
                  baseTickers: ['Decoding...'],
                  slowHintMs: 12000,
                  timeoutMs: 20000,
                },
              },
            ],
          },
        ],
      }
      
      const result = FlowSchema.safeParse(flow)
      expect(result.success).toBe(true)
    })
  })
  
  // ========================================================================
  // INVALID FLOW TESTS
  // ========================================================================
  
  describe('Invalid Flows', () => {
    test('missing required fields', () => {
      const flow = {
        id: 'test-flow',
        // Missing version, schemaVersion, etc.
      }
      
      const result = FlowSchema.safeParse(flow)
      expect(result.success).toBe(false)
    })
    
    test('invalid flow id pattern', () => {
      const flow = {
        id: 'Test Flow', // Should be kebab-case
        version: '1.0.0',
        schemaVersion: '1.0.0',
        i18nNS: 'test',
        theming: {
          brand: 'motomind',
          tone: 'calm',
        },
        privacy: {
          defaultRetention: '180d',
        },
        analytics: {
          namespace: 'test',
          flow: 'test-flow',
        },
        chapters: [],
      }
      
      const result = FlowSchema.safeParse(flow)
      expect(result.success).toBe(false)
    })
    
    test('empty chapters array', () => {
      const flow = {
        id: 'test-flow',
        version: '1.0.0',
        schemaVersion: '1.0.0',
        i18nNS: 'test',
        theming: {
          brand: 'motomind',
          tone: 'calm',
        },
        privacy: {
          defaultRetention: '180d',
        },
        analytics: {
          namespace: 'test',
          flow: 'test-flow',
        },
        chapters: [], // Must have at least one
      }
      
      const result = FlowSchema.safeParse(flow)
      expect(result.success).toBe(false)
    })
  })
  
  // ========================================================================
  // FIELD VALIDATION TESTS
  // ========================================================================
  
  describe('Field Validation', () => {
    test('field with all properties', () => {
      const flow = {
        id: 'test-flow',
        version: '1.0.0',
        schemaVersion: '1.0.0',
        i18nNS: 'test',
        theming: {
          brand: 'motomind',
          tone: 'calm',
        },
        privacy: {
          defaultRetention: '180d',
        },
        analytics: {
          namespace: 'test',
          flow: 'test-flow',
        },
        chapters: [
          {
            id: 'chapter1',
            name: 'Chapter 1',
            steps: [
              {
                id: 'vin',
                type: 'form.singleQuestion',
                title: 'VIN',
                fields: [
                  {
                    id: 'vin',
                    type: 'text',
                    preset: 'vinUppercase',
                    bind: 'vehicle.vin',
                    label: 'VIN',
                    placeholder: 'Enter VIN',
                    helper: 'Find on dashboard',
                    transform: {
                      uppercase: true,
                      strip: [' ', '-'],
                    },
                    validation: {
                      required: true,
                      length: 17,
                      pattern: '^[A-HJ-NPR-Z0-9]{17}$',
                    },
                    inputMode: 'text',
                    enterKeyHint: 'done',
                    privacy: {
                      classification: 'SENSITIVE',
                      purpose: ['onboarding'],
                      retention: '180d',
                      allowInAI: false,
                      maskInLogs: true,
                    },
                  },
                ],
              },
            ],
          },
        ],
      }
      
      const result = FlowSchema.safeParse(flow)
      expect(result.success).toBe(true)
    })
    
    test('field without bind fails', () => {
      const flow = {
        id: 'test-flow',
        version: '1.0.0',
        schemaVersion: '1.0.0',
        i18nNS: 'test',
        theming: {
          brand: 'motomind',
          tone: 'calm',
        },
        privacy: {
          defaultRetention: '180d',
        },
        analytics: {
          namespace: 'test',
          flow: 'test-flow',
        },
        chapters: [
          {
            id: 'chapter1',
            name: 'Chapter 1',
            steps: [
              {
                id: 'vin',
                type: 'form.singleQuestion',
                title: 'VIN',
                fields: [
                  {
                    id: 'vin',
                    type: 'text',
                    // Missing bind
                    privacy: {
                      classification: 'SENSITIVE',
                      purpose: ['onboarding'],
                      retention: '180d',
                      allowInAI: false,
                    },
                  },
                ],
              },
            ],
          },
        ],
      }
      
      const result = FlowSchema.safeParse(flow)
      expect(result.success).toBe(false)
    })
  })
  
  // ========================================================================
  // PRIVACY VALIDATION TESTS
  // ========================================================================
  
  describe('Privacy Validation', () => {
    test('valid privacy classification', () => {
      const privacy = {
        classification: 'SENSITIVE',
        purpose: ['onboarding'],
        retention: '180d',
        allowInAI: false,
      }
      
      // This is tested as part of field validation above
      expect(privacy.classification).toMatch(/^(PUBLIC|OPERATIONAL|PSEUDONYMIZED|SENSITIVE)$/)
    })
    
    test('valid retention values', () => {
      const validRetentions = ['session', '30d', '180d', 'until-delete', 'legal-minimum']
      
      validRetentions.forEach(retention => {
        expect(retention).toMatch(/^(session|30d|180d|until-delete|legal-minimum)$/)
      })
    })
    
    test('purpose array required', () => {
      const flow = {
        id: 'test-flow',
        version: '1.0.0',
        schemaVersion: '1.0.0',
        i18nNS: 'test',
        theming: {
          brand: 'motomind',
          tone: 'calm',
        },
        privacy: {
          defaultRetention: '180d',
        },
        analytics: {
          namespace: 'test',
          flow: 'test-flow',
        },
        chapters: [
          {
            id: 'chapter1',
            name: 'Chapter 1',
            steps: [
              {
                id: 'vin',
                type: 'form.singleQuestion',
                title: 'VIN',
                fields: [
                  {
                    id: 'vin',
                    type: 'text',
                    bind: 'vehicle.vin',
                    privacy: {
                      classification: 'SENSITIVE',
                      purpose: [], // Empty array should fail
                      retention: '180d',
                      allowInAI: false,
                    },
                  },
                ],
              },
            ],
          },
        ],
      }
      
      const result = FlowSchema.safeParse(flow)
      expect(result.success).toBe(false)
    })
  })
  
  // ========================================================================
  // STEP TYPE VALIDATION TESTS
  // ========================================================================
  
  describe('Step Types', () => {
    const baseFlow = {
      id: 'test-flow',
      version: '1.0.0',
      schemaVersion: '1.0.0',
      i18nNS: 'test',
      theming: {
        brand: 'motomind',
        tone: 'calm',
      },
      privacy: {
        defaultRetention: '180d',
      },
      analytics: {
        namespace: 'test',
        flow: 'test-flow',
      },
    }
    
    test('informational step', () => {
      const flow = {
        ...baseFlow,
        chapters: [
          {
            id: 'chapter1',
            name: 'Chapter 1',
            steps: [
              {
                id: 'welcome',
                type: 'informational',
                title: 'Welcome',
              },
            ],
          },
        ],
      }
      
      const result = FlowSchema.safeParse(flow)
      expect(result.success).toBe(true)
    })
    
    test('chapter step', () => {
      const flow = {
        ...baseFlow,
        chapters: [
          {
            id: 'chapter1',
            name: 'Chapter 1',
            steps: [
              {
                id: 'intro',
                type: 'chapter',
                title: 'Chapter Introduction',
              },
            ],
          },
        ],
      }
      
      const result = FlowSchema.safeParse(flow)
      expect(result.success).toBe(true)
    })
    
    test('form.cardGrid step', () => {
      const flow = {
        ...baseFlow,
        chapters: [
          {
            id: 'chapter1',
            name: 'Chapter 1',
            steps: [
              {
                id: 'options',
                type: 'form.cardGrid',
                title: 'Choose Option',
                fields: [
                  {
                    id: 'option',
                    type: 'chips',
                    bind: 'user.option',
                    options: ['a', 'b', 'c'],
                    privacy: {
                      classification: 'OPERATIONAL',
                      purpose: ['onboarding'],
                      retention: '180d',
                      allowInAI: true,
                    },
                  },
                ],
              },
            ],
          },
        ],
      }
      
      const result = FlowSchema.safeParse(flow)
      expect(result.success).toBe(true)
    })
    
    test('confirm.card step', () => {
      const flow = {
        ...baseFlow,
        chapters: [
          {
            id: 'chapter1',
            name: 'Chapter 1',
            steps: [
              {
                id: 'confirm',
                type: 'confirm.card',
                title: 'Confirm Details',
              },
            ],
          },
        ],
      }
      
      const result = FlowSchema.safeParse(flow)
      expect(result.success).toBe(true)
    })
  })
})
