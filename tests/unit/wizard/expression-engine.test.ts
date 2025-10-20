/**
 * Ultra God-Tier Wizard: Expression Engine Tests
 * 
 * Comprehensive tests for safe expression evaluation.
 * 
 * Phase B-2: Expression Engine
 */

import {
  evaluateExpression,
  validateExpression,
  getDependencies,
  type ExpressionContext,
} from '../../../lib/wizard/expression-engine'

describe('Expression Engine', () => {
  // ========================================================================
  // BASIC OPERATIONS
  // ========================================================================
  
  describe('Comparison Operators', () => {
    const context: ExpressionContext = {
      ctx: { vehicle: { mileage: 150000 } },
      fields: {},
    }
    
    test('greater than', () => {
      const result = evaluateExpression('ctx.vehicle.mileage > 100000', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
    
    test('less than', () => {
      const result = evaluateExpression('ctx.vehicle.mileage < 200000', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
    
    test('greater than or equal', () => {
      const result = evaluateExpression('ctx.vehicle.mileage >= 150000', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
    
    test('less than or equal', () => {
      const result = evaluateExpression('ctx.vehicle.mileage <= 150000', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
  })
  
  describe('Equality Operators', () => {
    const context: ExpressionContext = {
      ctx: { state: { level: 'active' } },
      fields: {},
    }
    
    test('loose equality', () => {
      const result = evaluateExpression('ctx.state.level == "active"', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
    
    test('loose inequality', () => {
      const result = evaluateExpression('ctx.state.level != "inactive"', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
    
    test('strict equality', () => {
      const result = evaluateExpression('ctx.state.level === "active"', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
    
    test('strict inequality', () => {
      const result = evaluateExpression('ctx.state.level !== "inactive"', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
  })
  
  describe('Logical Operators', () => {
    const context: ExpressionContext = {
      ctx: {
        vehicle: { mileage: 150000 },
        state: { level: 'active' },
      },
      fields: {},
    }
    
    test('AND operator', () => {
      const result = evaluateExpression(
        'ctx.vehicle.mileage > 100000 && ctx.state.level == "active"',
        context
      )
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
    
    test('OR operator', () => {
      const result = evaluateExpression(
        'ctx.vehicle.mileage > 200000 || ctx.state.level == "active"',
        context
      )
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
    
    test('NOT operator', () => {
      const result = evaluateExpression('!empty(ctx.state.level)', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
  })
  
  // ========================================================================
  // FIELD STATE
  // ========================================================================
  
  describe('Field State Access', () => {
    const context: ExpressionContext = {
      ctx: {},
      fields: {
        vin: { value: 'ABC123', valid: true },
        make: { value: '', valid: false, error: 'Required' },
      },
    }
    
    test('access field value', () => {
      const result = evaluateExpression('fields.vin.value === "ABC123"', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
    
    test('access field valid', () => {
      const result = evaluateExpression('fields.vin.valid', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
    
    test('combine field checks', () => {
      const result = evaluateExpression(
        'fields.vin.valid && !empty(fields.vin.value)',
        context
      )
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
  })
  
  // ========================================================================
  // BUILT-IN FUNCTIONS
  // ========================================================================
  
  describe('empty() function', () => {
    test('empty string', () => {
      const context: ExpressionContext = {
        ctx: {},
        fields: { vin: { value: '', valid: false } },
      }
      
      const result = evaluateExpression('empty(fields.vin.value)', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
    
    test('non-empty string', () => {
      const context: ExpressionContext = {
        ctx: {},
        fields: { vin: { value: 'ABC', valid: true } },
      }
      
      const result = evaluateExpression('empty(fields.vin.value)', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(false)
    })
    
    test('empty array', () => {
      const context: ExpressionContext = {
        ctx: { items: [] },
        fields: {},
      }
      
      const result = evaluateExpression('empty(ctx.items)', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
    
    test('null value', () => {
      const context: ExpressionContext = {
        ctx: { value: null },
        fields: {},
      }
      
      const result = evaluateExpression('empty(ctx.value)', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
  })
  
  describe('in() function', () => {
    test('value in array', () => {
      const context: ExpressionContext = {
        ctx: { options: ['a', 'b', 'c'] },
        fields: {},
      }
      
      const result = evaluateExpression('in("b", ctx.options)', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
    
    test('value not in array', () => {
      const context: ExpressionContext = {
        ctx: { options: ['a', 'b', 'c'] },
        fields: {},
      }
      
      const result = evaluateExpression('in("d", ctx.options)', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(false)
    })
  })
  
  describe('has() function', () => {
    test('value exists', () => {
      const context: ExpressionContext = {
        ctx: { vehicle: { vin: 'ABC' } },
        fields: {},
      }
      
      const result = evaluateExpression('has(ctx.vehicle.vin)', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
    
    test('value is null', () => {
      const context: ExpressionContext = {
        ctx: { vehicle: { vin: null } },
        fields: {},
      }
      
      const result = evaluateExpression('has(ctx.vehicle.vin)', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(false)
    })
    
    test('value is undefined', () => {
      const context: ExpressionContext = {
        ctx: { vehicle: {} },
        fields: {},
      }
      
      const result = evaluateExpression('has(ctx.vehicle.vin)', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(false)
    })
  })
  
  describe('length() function', () => {
    test('string length', () => {
      const context: ExpressionContext = {
        ctx: {},
        fields: { vin: { value: 'ABC123', valid: true } },
      }
      
      const result = evaluateExpression('length(fields.vin.value) === 6', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
    
    test('array length', () => {
      const context: ExpressionContext = {
        ctx: { items: [1, 2, 3] },
        fields: {},
      }
      
      const result = evaluateExpression('length(ctx.items) > 2', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
  })
  
  // ========================================================================
  // COMPLEX EXPRESSIONS
  // ========================================================================
  
  describe('Complex Expressions', () => {
    test('nested conditions', () => {
      const context: ExpressionContext = {
        ctx: {
          vehicle: { mileage: 150000 },
          state: { level: 'active', warningLights: true },
        },
        fields: {},
      }
      
      const result = evaluateExpression(
        'ctx.state.level == "active" && ctx.state.warningLights == true && ctx.vehicle.mileage > 100000',
        context
      )
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
    
    test('parentheses precedence', () => {
      const context: ExpressionContext = {
        ctx: { a: 5, b: 10, c: 15 },
        fields: {},
      }
      
      const result = evaluateExpression(
        '(ctx.a > 3 && ctx.b < 12) || ctx.c > 20',
        context
      )
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
    
    test('form validation expression', () => {
      const context: ExpressionContext = {
        ctx: {},
        fields: {
          vin: { value: 'ABC123DEF456GHI78', valid: true },
          make: { value: 'Toyota', valid: true },
        },
      }
      
      const result = evaluateExpression(
        'fields.vin.valid && !empty(fields.vin.value) && fields.make.valid',
        context
      )
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
  })
  
  // ========================================================================
  // EDGE CASES
  // ========================================================================
  
  describe('Edge Cases', () => {
    test('empty expression defaults to true', () => {
      const result = evaluateExpression('', { ctx: {}, fields: {} })
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
    
    test('whitespace-only expression defaults to true', () => {
      const result = evaluateExpression('   ', { ctx: {}, fields: {} })
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
    
    test('undefined path returns undefined', () => {
      const context: ExpressionContext = {
        ctx: {},
        fields: {},
      }
      
      const result = evaluateExpression('ctx.nonexistent.path', context)
      expect(result.success).toBe(true)
      expect(result.value).toBeUndefined()
    })
    
    test('comparison with undefined', () => {
      const context: ExpressionContext = {
        ctx: {},
        fields: {},
      }
      
      const result = evaluateExpression('ctx.nonexistent == null', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
  })
  
  // ========================================================================
  // ERROR HANDLING
  // ========================================================================
  
  describe('Error Handling', () => {
    test('invalid syntax returns safe default', () => {
      const result = evaluateExpression('ctx.value &&& ctx.other', { ctx: {}, fields: {} })
      expect(result.success).toBe(false)
      expect(result.value).toBe(false) // Safe default
      expect(result.error).toBeDefined()
    })
    
    test('unterminated string returns error', () => {
      const result = evaluateExpression('ctx.value == "test', { ctx: {}, fields: {} })
      expect(result.success).toBe(false)
      expect(result.value).toBe(false)
      expect(result.error).toContain('Unterminated')
    })
    
    test('unknown function returns error', () => {
      const result = evaluateExpression('unknown(ctx.value)', { ctx: { value: 'test' }, fields: {} })
      expect(result.success).toBe(false)
      expect(result.value).toBe(false)
      expect(result.error).toContain('Unknown function')
    })
    
    test('unexpected token returns error', () => {
      const result = evaluateExpression('ctx.value @@@ 5', { ctx: {}, fields: {} })
      expect(result.success).toBe(false)
      expect(result.value).toBe(false)
    })
  })
  
  // ========================================================================
  // VALIDATION
  // ========================================================================
  
  describe('Expression Validation', () => {
    test('valid expression', () => {
      const result = validateExpression('ctx.vehicle.mileage > 100000')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })
    
    test('invalid syntax', () => {
      const result = validateExpression('ctx.value &&& ctx.other')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })
    
    test('empty expression is valid', () => {
      const result = validateExpression('')
      expect(result.valid).toBe(true)
    })
    
    test('complex valid expression', () => {
      const result = validateExpression(
        '(fields.vin.valid && !empty(fields.vin.value)) || ctx.state.skipValidation'
      )
      expect(result.valid).toBe(true)
    })
  })
  
  // ========================================================================
  // REAL-WORLD USE CASES
  // ========================================================================
  
  describe('Real-World Use Cases', () => {
    test('shouldExistWhen: high mileage vehicles', () => {
      const context: ExpressionContext = {
        ctx: { vehicle: { mileage: 150000 } },
        fields: {},
      }
      
      const result = evaluateExpression('ctx.vehicle.mileage > 100000', context)
      expect(result.value).toBe(true) // Step should exist
    })
    
    test('continueEnabledWhen: form validation', () => {
      const context: ExpressionContext = {
        ctx: {},
        fields: {
          vin: { value: 'ABC123', valid: true },
          make: { value: 'Toyota', valid: true },
          model: { value: 'Camry', valid: true },
        },
      }
      
      const result = evaluateExpression(
        'fields.vin.valid && fields.make.valid && fields.model.valid',
        context
      )
      expect(result.value).toBe(true) // Can continue
    })
    
    test('computed default: first time user', () => {
      const context: ExpressionContext = {
        ctx: { user: { completedFlows: [] } },
        fields: {},
      }
      
      const result = evaluateExpression('empty(ctx.user.completedFlows)', context)
      expect(result.value).toBe(true) // Show tutorial
    })
    
    test('privacy consent gate', () => {
      const context: ExpressionContext = {
        ctx: {},
        fields: {
          shareData: { value: true, valid: true },
          acceptedTerms: { value: true, valid: true },
        },
      }
      
      const result = evaluateExpression(
        'fields.shareData.value === true && fields.acceptedTerms.value === true',
        context
      )
      expect(result.value).toBe(true) // Can proceed with data collection
    })
  })
  
  // ========================================================================
  // GOD-TIER ENHANCEMENTS
  // ========================================================================
  
  describe('Dependency Tracking', () => {
    test('extracts simple dependency', () => {
      const deps = getDependencies('ctx.vehicle.mileage > 100000')
      expect(deps).toEqual(['ctx.vehicle.mileage'])
    })
    
    test('extracts multiple dependencies', () => {
      const deps = getDependencies('ctx.vehicle.mileage > 100000 && ctx.state.level == "active"')
      expect(deps).toEqual(['ctx.state.level', 'ctx.vehicle.mileage'])
    })
    
    test('extracts field dependencies', () => {
      const deps = getDependencies('fields.vin.valid && !empty(fields.vin.value)')
      expect(deps).toEqual(['fields.vin.valid', 'fields.vin.value'])
    })
    
    test('deduplicates dependencies', () => {
      const deps = getDependencies('ctx.vehicle.mileage > 100000 && ctx.vehicle.mileage < 200000')
      expect(deps).toEqual(['ctx.vehicle.mileage'])
    })
    
    test('extracts from function arguments', () => {
      const deps = getDependencies('empty(ctx.user.name) && in(ctx.state.level, ctx.allowedLevels)')
      expect(deps).toEqual(['ctx.allowedLevels', 'ctx.state.level', 'ctx.user.name'])
    })
    
    test('handles nested expressions', () => {
      const deps = getDependencies('(fields.vin.valid && ctx.state.ready) || ctx.flags.skipValidation')
      expect(deps).toEqual(['ctx.flags.skipValidation', 'ctx.state.ready', 'fields.vin.valid'])
    })
    
    test('returns empty array for literals only', () => {
      const deps = getDependencies('true && false')
      expect(deps).toEqual([])
    })
    
    test('returns empty array for invalid expressions', () => {
      const deps = getDependencies('ctx.value &&& ctx.other')
      expect(deps).toEqual([])
    })
  })
  
  describe('Helper Aliases', () => {
    test('present() helper', () => {
      const context: ExpressionContext = {
        ctx: {},
        fields: { vin: { value: 'ABC123', valid: true } },
      }
      
      const result = evaluateExpression('present(fields.vin.value)', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
    
    test('present() is opposite of empty()', () => {
      const context: ExpressionContext = {
        ctx: {},
        fields: { vin: { value: '', valid: false } },
      }
      
      const emptyResult = evaluateExpression('empty(fields.vin.value)', context)
      const presentResult = evaluateExpression('present(fields.vin.value)', context)
      
      expect(emptyResult.value).toBe(true)
      expect(presentResult.value).toBe(false)
    })
    
    test('oneOf() helper', () => {
      const context: ExpressionContext = {
        ctx: { options: ['a', 'b', 'c'] },
        fields: {},
      }
      
      const result = evaluateExpression('oneOf("b", ctx.options)', context)
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
    
    test('readable form validation with aliases', () => {
      const context: ExpressionContext = {
        ctx: {},
        fields: {
          vin: { value: 'ABC123', valid: true },
          make: { value: 'Toyota', valid: true },
        },
      }
      
      const result = evaluateExpression(
        'present(fields.vin.value) && present(fields.make.value)',
        context
      )
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })
  })
})
