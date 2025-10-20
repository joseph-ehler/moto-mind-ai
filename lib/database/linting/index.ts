/**
 * Schema Linting & Fixing
 * 
 * Validates database schema against defined rules
 * Automatically generates fixes for violations
 */

export { SchemaLinter } from './schema-linter'
export type { LintRule, LintResult } from './schema-linter'

export { SchemaFixer } from './schema-fixer'
export type { FixMigration, FixResult } from './schema-fixer'
