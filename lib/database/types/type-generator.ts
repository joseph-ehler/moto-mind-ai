/**
 * Type Generator
 * 
 * Generates TypeScript types from database schema
 * Uses Supabase CLI under the hood for reliability
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as crypto from 'crypto'

const execAsync = promisify(exec)

export interface TypeGenerationOptions {
  outputPath?: string
  projectId?: string
  dbUrl?: string
  schemaHash?: boolean
}

export interface TypeGenerationResult {
  success: boolean
  outputPath: string
  schemaHash?: string
  changed: boolean
  error?: string
}

export class TypeGenerator {
  private projectRoot: string

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot
  }

  /**
   * Generate types from database schema
   */
  async generate(options: TypeGenerationOptions = {}): Promise<TypeGenerationResult> {
    const outputPath = options.outputPath || path.join(this.projectRoot, 'types/supabase.ts')
    const outputDir = path.dirname(outputPath)

    try {
      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true })

      // Check if previous types exist
      let previousHash: string | undefined
      try {
        const existing = await fs.readFile(outputPath, 'utf-8')
        previousHash = this.extractSchemaHash(existing)
      } catch {
        // No previous file
      }

      // Generate types using Supabase CLI
      const types = await this.generateTypes(options)

      // Calculate schema hash
      const schemaHash = this.calculateSchemaHash(types)

      // Add header with metadata
      const output = this.addHeader(types, schemaHash)

      // Write atomically (tmp file + rename)
      const tmpPath = `${outputPath}.tmp`
      await fs.writeFile(tmpPath, output, 'utf-8')
      await fs.rename(tmpPath, outputPath)

      return {
        success: true,
        outputPath,
        schemaHash,
        changed: previousHash !== schemaHash
      }
    } catch (error) {
      return {
        success: false,
        outputPath,
        changed: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Validate that types are up-to-date
   */
  async validate(options: TypeGenerationOptions = {}): Promise<boolean> {
    const outputPath = options.outputPath || path.join(this.projectRoot, 'types/supabase.ts')

    try {
      // Read existing types
      const existing = await fs.readFile(outputPath, 'utf-8')
      const existingHash = this.extractSchemaHash(existing)

      if (!existingHash) {
        console.log('⚠️  No schema hash found in types file')
        return false
      }

      // Generate new types
      const types = await this.generateTypes(options)
      const currentHash = this.calculateSchemaHash(types)

      return existingHash === currentHash
    } catch (error) {
      console.error('❌ Validation failed:', error instanceof Error ? error.message : error)
      return false
    }
  }

  /**
   * Generate types using Supabase CLI remote (Docker-free!)
   */
  private async generateTypes(options: TypeGenerationOptions): Promise<string> {
    // Extract project ID from Supabase URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL

    if (!supabaseUrl) {
      throw new Error(
        'Missing required environment variable:\n' +
        '  NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)\n\n' +
        'Add this to your .env.local file'
      )
    }

    // Extract project ID from URL: https://PROJECT_ID.supabase.co
    const projectIdMatch = supabaseUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)
    if (!projectIdMatch) {
      throw new Error(
        `Invalid Supabase URL format: ${supabaseUrl}\n` +
        'Expected format: https://PROJECT_ID.supabase.co'
      )
    }

    const projectId = projectIdMatch[1]

    try {
      // Use Supabase CLI in remote mode (no Docker needed!)
      const { stdout } = await execAsync(
        `npx supabase gen types typescript --project-id ${projectId} --schema public`,
        { 
          cwd: this.projectRoot,
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large schemas
          env: {
            ...process.env,
            // Supabase CLI uses service role key if available
            SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
          }
        }
      )

      return stdout
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Provide helpful error messages
      if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
        throw new Error(
          'Unauthorized: Invalid Supabase credentials\n\n' +
          'Make sure SUPABASE_SERVICE_ROLE_KEY is set correctly in .env.local'
        )
      }
      
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        throw new Error(
          `Project not found: ${projectId}\n\n` +
          'Check that NEXT_PUBLIC_SUPABASE_URL is correct'
        )
      }

      throw new Error(
        `Failed to generate types:\n${errorMessage}\n\n` +
        'Make sure you have access to the Supabase project'
      )
    }
  }

  /**
   * Calculate hash of schema structure (ignore comments/whitespace)
   */
  private calculateSchemaHash(types: string): string {
    // Extract just the type definitions (ignore comments)
    const typeDefinitions = types
      .split('\n')
      .filter(line => !line.trim().startsWith('//') && !line.trim().startsWith('/*'))
      .join('\n')
      .replace(/\s+/g, ' ')
      .trim()

    return crypto.createHash('sha256').update(typeDefinitions).digest('hex').substring(0, 12)
  }

  /**
   * Extract schema hash from existing types file
   */
  private extractSchemaHash(content: string): string | undefined {
    const match = content.match(/Schema Hash: ([a-f0-9]{12})/)
    return match ? match[1] : undefined
  }

  /**
   * Add header with metadata
   */
  private addHeader(types: string, schemaHash: string): string {
    const timestamp = new Date().toISOString()
    const header = `/**
 * Database Types
 * 
 * Auto-generated from database schema
 * DO NOT EDIT MANUALLY
 * 
 * Generated: ${timestamp}
 * Schema Hash: ${schemaHash}
 * 
 * To regenerate: npm run db types:generate
 */

`
    return header + types
  }

  /**
   * Generate helper type utilities
   */
  async generateHelpers(outputPath?: string): Promise<void> {
    const helpersPath = outputPath || path.join(this.projectRoot, 'types/database-helpers.ts')

    const helpers = `/**
 * Database Type Helpers
 * 
 * Convenience types for working with database tables
 */

import type { Database } from './supabase'

// Table row types
export type Tables = Database['public']['Tables']
export type TableName = keyof Tables

export type Row<T extends TableName> = Tables[T]['Row']
export type Insert<T extends TableName> = Tables[T]['Insert']
export type Update<T extends TableName> = Tables[T]['Update']

// View types
export type Views = Database['public']['Views']
export type ViewName = keyof Views
export type ViewRow<T extends ViewName> = Views[T]['Row']

// Enum types
export type Enums = Database['public']['Enums']
export type EnumName = keyof Enums
export type Enum<T extends EnumName> = Enums[T]

// Function types
export type Functions = Database['public']['Functions']
export type FunctionName = keyof Functions
export type FunctionArgs<T extends FunctionName> = Functions[T]['Args']
export type FunctionReturn<T extends FunctionName> = Functions[T]['Returns']

// Example usage:
// type Vehicle = Row<'vehicles'>
// type VehicleInsert = Insert<'vehicles'>
// type VehicleUpdate = Update<'vehicles'>
`

    await fs.writeFile(helpersPath, helpers, 'utf-8')
  }
}
