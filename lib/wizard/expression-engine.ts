/**
 * Ultra God-Tier Wizard: Expression Engine
 * 
 * Safe, allowlisted expression evaluation for:
 * - shouldExistWhen (conditional step rendering)
 * - continueEnabledWhen (step validation gating)
 * - computed field defaults
 * 
 * Security:
 * - Allowlisted operations only
 * - No eval(), no Function(), no code execution
 * - Readonly context binding
 * - Safe defaults on errors
 * 
 * Phase B-2: Expression Engine
 */

// ============================================================================
// TYPES
// ============================================================================

export type ExpressionContext = {
  ctx: Record<string, any>  // Readonly context (vehicle, state, etc.)
  fields: Record<string, FieldState>  // Field states
}

export type FieldState = {
  value: any
  valid: boolean
  error?: string
  validating?: boolean
}

export type ExpressionResult = {
  success: boolean
  value: any
  error?: string
}

// ============================================================================
// ALLOWLISTED OPERATIONS
// ============================================================================

const ALLOWED_OPS = [
  '==', '!=', '===', '!==',
  '>', '<', '>=', '<=',
  '&&', '||', '!',
] as const

type AllowedOp = typeof ALLOWED_OPS[number]

// ============================================================================
// EXPRESSION ENGINE
// ============================================================================

/**
 * Evaluate expression with safe, allowlisted operations
 * 
 * @example
 * evaluateExpression("ctx.vehicle.mileage > 100000", { ctx: { vehicle: { mileage: 150000 } }, fields: {} })
 * → { success: true, value: true }
 * 
 * @example
 * evaluateExpression("fields.vin.valid && !empty(fields.vin.value)", { ctx: {}, fields: { vin: { value: "ABC", valid: true } } })
 * → { success: true, value: true }
 */
export function evaluateExpression(
  expression: string,
  context: ExpressionContext
): ExpressionResult {
  try {
    // Empty expression → default to true
    if (!expression || expression.trim() === '') {
      return { success: true, value: true }
    }
    
    // Parse and evaluate
    const result = evaluateNode(parseExpression(expression), context)
    
    return {
      success: true,
      value: result,
    }
    
  } catch (error) {
    console.error(`Expression evaluation failed: ${expression}`, error)
    
    return {
      success: false,
      value: false, // Safe default
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// PARSER (Simple recursive descent)
// ============================================================================

type ASTNode = 
  | { type: 'literal', value: any }
  | { type: 'identifier', path: string[] }
  | { type: 'unary', op: '!', operand: ASTNode }
  | { type: 'binary', op: AllowedOp, left: ASTNode, right: ASTNode }
  | { type: 'function', name: string, args: ASTNode[] }

function parseExpression(expr: string): ASTNode {
  const tokens = tokenize(expr)
  let pos = 0
  
  function peek(): string | undefined {
    return tokens[pos]
  }
  
  function consume(): string {
    return tokens[pos++]
  }
  
  function parseOr(): ASTNode {
    let left = parseAnd()
    
    while (peek() === '||') {
      consume() // ||
      const right = parseAnd()
      left = { type: 'binary', op: '||', left, right }
    }
    
    return left
  }
  
  function parseAnd(): ASTNode {
    let left = parseEquality()
    
    while (peek() === '&&') {
      consume() // &&
      const right = parseEquality()
      left = { type: 'binary', op: '&&', left, right }
    }
    
    return left
  }
  
  function parseEquality(): ASTNode {
    let left = parseComparison()
    
    while (peek() === '==' || peek() === '!=' || peek() === '===' || peek() === '!==') {
      const op = consume() as AllowedOp
      const right = parseComparison()
      left = { type: 'binary', op, left, right }
    }
    
    return left
  }
  
  function parseComparison(): ASTNode {
    let left = parseUnary()
    
    while (peek() === '>' || peek() === '<' || peek() === '>=' || peek() === '<=') {
      const op = consume() as AllowedOp
      const right = parseUnary()
      left = { type: 'binary', op, left, right }
    }
    
    return left
  }
  
  function parseUnary(): ASTNode {
    if (peek() === '!') {
      consume() // !
      const operand = parseUnary()
      return { type: 'unary', op: '!', operand }
    }
    
    return parsePrimary()
  }
  
  function parsePrimary(): ASTNode {
    const token = peek()
    
    if (!token) {
      throw new Error('Unexpected end of expression')
    }
    
    // Parentheses
    if (token === '(') {
      consume() // (
      const node = parseOr()
      if (consume() !== ')') {
        throw new Error('Expected closing parenthesis')
      }
      return node
    }
    
    // Boolean literal (MUST be before identifier check!)
    if (token === 'true') {
      consume()
      return { type: 'literal', value: true }
    }
    if (token === 'false') {
      consume()
      return { type: 'literal', value: false }
    }
    
    // null literal (MUST be before identifier check!)
    if (token === 'null') {
      consume()
      return { type: 'literal', value: null }
    }
    
    // Function call
    if (token.match(/^[a-z_][a-z0-9_]*$/i) && tokens[pos + 1] === '(') {
      const name = consume()
      consume() // (
      
      const args: ASTNode[] = []
      if (peek() !== ')') {
        args.push(parseOr())
        while (peek() === ',') {
          consume() // ,
          args.push(parseOr())
        }
      }
      
      if (consume() !== ')') {
        throw new Error('Expected closing parenthesis')
      }
      
      return { type: 'function', name, args }
    }
    
    // Identifier (ctx.vehicle.vin, fields.vin.valid)
    if (token.match(/^[a-z_][a-z0-9_]*$/i)) {
      const parts = [consume()]
      
      while (peek() === '.') {
        consume() // .
        const next = consume()
        if (!next.match(/^[a-z_][a-z0-9_]*$/i)) {
          throw new Error(`Invalid identifier: ${next}`)
        }
        parts.push(next)
      }
      
      return { type: 'identifier', path: parts }
    }
    
    // Number literal
    if (token.match(/^-?\d+(\.\d+)?$/)) {
      return { type: 'literal', value: parseFloat(consume()) }
    }
    
    // String literal
    if (token.startsWith('"') || token.startsWith("'")) {
      const str = consume()
      return { type: 'literal', value: str.slice(1, -1) }
    }
    
    throw new Error(`Unexpected token: ${token}`)
  }
  
  const ast = parseOr()
  
  if (pos < tokens.length) {
    throw new Error(`Unexpected token after expression: ${tokens[pos]}`)
  }
  
  return ast
}

// ============================================================================
// TOKENIZER
// ============================================================================

function tokenize(expr: string): string[] {
  const tokens: string[] = []
  let i = 0
  
  while (i < expr.length) {
    const char = expr[i]
    
    // Whitespace
    if (char.match(/\s/)) {
      i++
      continue
    }
    
    // String literal
    if (char === '"' || char === "'") {
      const quote = char
      let str = char
      i++
      
      while (i < expr.length && expr[i] !== quote) {
        str += expr[i]
        i++
      }
      
      if (i >= expr.length) {
        throw new Error('Unterminated string literal')
      }
      
      str += expr[i] // Closing quote
      i++
      tokens.push(str)
      continue
    }
    
    // Multi-char operators (check triple BEFORE two!)
    // Triple char FIRST (===, !==)
    if (i + 2 < expr.length) {
      const threeChar = expr.slice(i, i + 3)
      if (['===', '!=='].includes(threeChar)) {
        tokens.push(threeChar)
        i += 3
        continue
      }
    }
    
    // Two char SECOND (==, !=, <=, >=, &&, ||)
    if (i + 1 < expr.length) {
      const twoChar = expr.slice(i, i + 2)
      if (['==', '!=', '<=', '>=', '&&', '||'].includes(twoChar)) {
        tokens.push(twoChar)
        i += 2
        continue
      }
    }
    
    // Single-char operators
    if (['(', ')', ',', '.', '!', '>', '<'].includes(char)) {
      tokens.push(char)
      i++
      continue
    }
    
    // Identifier or number
    if (char.match(/[a-z_0-9]/i)) {
      let token = char
      i++
      
      while (i < expr.length && expr[i].match(/[a-z_0-9]/i)) {
        token += expr[i]
        i++
      }
      
      tokens.push(token)
      continue
    }
    
    throw new Error(`Unexpected character: ${char}`)
  }
  
  return tokens
}

// ============================================================================
// EVALUATOR
// ============================================================================

function evaluateNode(node: ASTNode, context: ExpressionContext): any {
  switch (node.type) {
    case 'literal':
      return node.value
      
    case 'identifier':
      return resolveIdentifier(node.path, context)
      
    case 'unary':
      const operand = evaluateNode(node.operand, context)
      switch (node.op) {
        case '!':
          return !operand
        default:
          // Exhaustive check - this should never be reached
          throw new Error(`Unknown unary operator`)
      }
      
    case 'binary':
      const left = evaluateNode(node.left, context)
      const right = evaluateNode(node.right, context)
      
      switch (node.op) {
        case '==': return left == right
        case '!=': return left != right
        case '===': return left === right
        case '!==': return left !== right
        case '>': return left > right
        case '<': return left < right
        case '>=': return left >= right
        case '<=': return left <= right
        case '&&': return left && right
        case '||': return left || right
        default:
          // Exhaustive check - this should never be reached
          throw new Error(`Unknown binary operator`)
      }
      
    case 'function':
      return evaluateFunction(node.name, node.args, context)
      
    default:
      throw new Error(`Unknown node type: ${(node as any).type}`)
  }
}

function resolveIdentifier(path: string[], context: ExpressionContext): any {
  // Start with context root
  let value: any = context
  
  for (const key of path) {
    if (value === null || value === undefined) {
      return undefined
    }
    
    value = value[key]
  }
  
  return value
}

// ============================================================================
// BUILT-IN FUNCTIONS
// ============================================================================

const BUILT_IN_FUNCTIONS: Record<string, (args: any[]) => any> = {
  // Check if value is empty (null, undefined, '', [], {})
  empty: (args) => {
    const val = args[0]
    if (val === null || val === undefined || val === '') return true
    if (Array.isArray(val) && val.length === 0) return true
    if (typeof val === 'object' && Object.keys(val).length === 0) return true
    return false
  },
  
  // Check if array/object has key/value
  in: (args) => {
    const needle = args[0]
    const haystack = args[1]
    
    if (Array.isArray(haystack)) {
      return haystack.includes(needle)
    }
    
    if (typeof haystack === 'object' && haystack !== null) {
      return needle in haystack
    }
    
    return false
  },
  
  // Check if value exists (not null/undefined)
  has: (args) => {
    const val = args[0]
    return val !== null && val !== undefined
  },
  
  // Get length of array/string
  length: (args) => {
    const val = args[0]
    if (typeof val === 'string' || Array.isArray(val)) {
      return val.length
    }
    return 0
  },
}

function evaluateFunction(
  name: string,
  argNodes: ASTNode[],
  context: ExpressionContext
): any {
  const fn = BUILT_IN_FUNCTIONS[name]
  
  if (!fn) {
    throw new Error(`Unknown function: ${name}`)
  }
  
  // Evaluate arguments
  const args = argNodes.map(arg => evaluateNode(arg, context))
  
  return fn(args)
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate expression syntax without evaluating
 */
export function validateExpression(expression: string): {
  valid: boolean
  error?: string
} {
  try {
    if (!expression || expression.trim() === '') {
      return { valid: true }
    }
    
    parseExpression(expression)
    return { valid: true }
    
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// DEPENDENCY TRACKING (God-Tier Enhancement)
// ============================================================================

/**
 * Walk AST and collect all identifier dependencies
 */
function collectDependencies(node: ASTNode, deps: Set<string>): void {
  switch (node.type) {
    case 'identifier':
      deps.add(node.path.join('.'))
      break
      
    case 'unary':
      collectDependencies(node.operand, deps)
      break
      
    case 'binary':
      collectDependencies(node.left, deps)
      collectDependencies(node.right, deps)
      break
      
    case 'function':
      for (const arg of node.args) {
        collectDependencies(arg, deps)
      }
      break
      
    case 'literal':
      // No dependencies
      break
  }
}

/**
 * Extract all context dependencies from an expression
 * 
 * Used for:
 * - Fine-grained React memoization
 * - Dev playground visualization
 * - Performance optimization
 * 
 * @example
 * getDependencies("ctx.vehicle.mileage > 100000 && ctx.state.level == 'active'")
 * → ['ctx.vehicle.mileage', 'ctx.state.level']
 */
export function getDependencies(expression: string): string[] {
  try {
    const ast = parseExpression(expression)
    const deps = new Set<string>()
    
    collectDependencies(ast, deps)
    return Array.from(deps).sort()
    
  } catch (error) {
    console.warn(`Could not extract dependencies from: ${expression}`, error)
    return []
  }
}

// ============================================================================
// HELPER ALIASES (God-Tier Enhancement)
// ============================================================================

// Add readable aliases for common patterns
BUILT_IN_FUNCTIONS['present'] = (args) => {
  return !BUILT_IN_FUNCTIONS['empty'](args)
}

BUILT_IN_FUNCTIONS['oneOf'] = (args) => {
  return BUILT_IN_FUNCTIONS['in'](args)
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  ALLOWED_OPS,
  BUILT_IN_FUNCTIONS,
}
