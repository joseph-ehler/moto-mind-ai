#!/usr/bin/env node

/**
 * Migration Organization Tool
 * 
 * Organizes SQL migrations into numbered, chronological order
 * Based on analysis from analyze-migrations.js
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rootDir = path.join(__dirname, '..')
const migrationsDir = path.join(rootDir, 'migrations')

async function organizeMigrations() {
  console.log('🚀 Migration Organization Tool\n')
  
  // Check if analysis exists
  const analysisPath = path.join(rootDir, 'docs', 'architecture', 'MIGRATION_ANALYSIS.json')
  if (!fs.existsSync(analysisPath)) {
    console.error('❌ Migration analysis not found!')
    console.error('Run "node scripts/analyze-migrations.js" first\n')
    process.exit(1)
  }
  
  const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'))
  
  console.log(`Found ${analysis.totalFiles} migrations to organize\n`)
  
  // Confirm action
  const confirmed = await confirm('This will reorganize your SQL files. Continue? (y/n): ')
  
  if (!confirmed) {
    console.log('❌ Cancelled')
    process.exit(0)
  }
  
  // Create migration directories
  console.log('\n📁 Creating migration structure...')
  fs.mkdirSync(path.join(migrationsDir, 'applied'), { recursive: true })
  fs.mkdirSync(path.join(migrationsDir, 'rollback'), { recursive: true })
  fs.mkdirSync(path.join(migrationsDir, 'seeds'), { recursive: true })
  fs.mkdirSync(path.join(migrationsDir, 'archive'), { recursive: true })
  
  // Organize migrations
  console.log('📦 Organizing migrations...\n')
  
  let organized = 0
  let skipped = 0
  
  analysis.chronologicalOrder.forEach(migration => {
    const number = String(migration.number).padStart(3, '0')
    const category = categorizeFromFeatures(migration)
    const sanitized = sanitizeFileName(migration.fileName)
    const newName = `${number}_${category}_${sanitized}.sql`
    
    const oldPath = path.join(rootDir, migration.fileName)
    
    // Check if file exists (might have been moved already)
    if (!fs.existsSync(oldPath)) {
      // Search in subdirectories
      const found = findFile(rootDir, migration.fileName)
      if (!found) {
        console.log(`⚠️  Skipped: ${migration.fileName} (not found)`)
        skipped++
        return
      }
      migration.filePath = found
    }
    
    const newPath = path.join(migrationsDir, newName)
    
    try {
      // Copy file (don't delete original yet)
      fs.copyFileSync(migration.filePath || oldPath, newPath)
      console.log(`✅ ${number}. ${category.padEnd(12)} ${sanitized}`)
      organized++
    } catch (error) {
      console.error(`❌ Failed: ${migration.fileName}`, error.message)
      skipped++
    }
  })
  
  console.log(`\n✅ Organized ${organized} migrations`)
  if (skipped > 0) {
    console.log(`⚠️  Skipped ${skipped} files`)
  }
  
  // Create migration tracker
  console.log('\n📝 Creating migration tracker...')
  const trackerContent = `# Migration Tracker
# Format: migration_number | applied_date | applied_by | notes
# Example: 001 | 2025-01-13 | admin | Initial schema

# Add entries as you apply migrations to production
# This helps track what's been deployed

# Applied Migrations:
# (none yet)
`
  
  fs.writeFileSync(path.join(migrationsDir, 'applied', 'production.txt'), trackerContent)
  fs.writeFileSync(path.join(migrationsDir, 'applied', 'staging.txt'), trackerContent)
  
  // Create README
  const readme = `# Database Migrations

## Directory Structure

\`\`\`
migrations/
├── 001_schema_initial.sql           # Numbered migrations (run in order)
├── 002_vehicle_add_fuel_level.sql
├── 003_ai_chat_threads.sql
├── ...
│
├── applied/                          # Track which migrations have been applied
│   ├── production.txt                # Production environment
│   └── staging.txt                   # Staging environment
│
├── rollback/                         # Rollback scripts (optional)
│   ├── 002_rollback.sql
│   └── 003_rollback.sql
│
├── seeds/                            # Test data seeds
│   ├── dev_vehicles.sql
│   └── demo_users.sql
│
└── archive/                          # Old migrations (reference only)
    └── unsorted/
\`\`\`

## Usage

### Apply migrations

\`\`\`bash
# Run all pending migrations
npm run db:migrate

# Apply specific migration
psql $DATABASE_URL -f migrations/001_schema_initial.sql
\`\`\`

### Track applied migrations

After applying a migration to production, add an entry to \`applied/production.txt\`:

\`\`\`
001 | 2025-01-13 | admin | Initial schema
002 | 2025-01-15 | admin | Added fuel level tracking
\`\`\`

### Rollback

\`\`\`bash
# Run rollback script
psql $DATABASE_URL -f migrations/rollback/002_rollback.sql

# Update tracker
# Remove the entry from applied/production.txt
\`\`\`

## Creating New Migrations

1. **Find the highest number**
   \`\`\`bash
   ls migrations/*.sql | tail -1
   # 027_feature_analytics.sql
   \`\`\`

2. **Create next migration**
   \`\`\`bash
   touch migrations/028_feature_notifications.sql
   \`\`\`

3. **Write SQL**
   \`\`\`sql
   -- Migration: Add notifications system
   -- Created: 2025-01-15
   -- Author: admin
   
   CREATE TABLE notifications (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id),
     type TEXT NOT NULL,
     message TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   \`\`\`

4. **Create rollback script** (optional)
   \`\`\`sql
   -- migrations/rollback/028_rollback.sql
   DROP TABLE IF EXISTS notifications;
   \`\`\`

5. **Test locally**
   \`\`\`bash
   npm run db:migrate
   \`\`\`

6. **Deploy to staging**
   \`\`\`bash
   # Apply to staging DB
   psql $STAGING_DATABASE_URL -f migrations/028_feature_notifications.sql
   
   # Track in staging
   echo "028 | $(date +%Y-%m-%d) | admin | Notifications system" >> migrations/applied/staging.txt
   \`\`\`

7. **Deploy to production**
   \`\`\`bash
   # Apply to production DB
   psql $PRODUCTION_DATABASE_URL -f migrations/028_feature_notifications.sql
   
   # Track in production
   echo "028 | $(date +%Y-%m-%d) | admin | Notifications system" >> migrations/applied/production.txt
   \`\`\`

## Best Practices

1. **Never modify existing migrations** - Always create a new one
2. **Test on staging first** - Never apply untested migrations to production
3. **Keep migrations small** - One logical change per migration
4. **Write rollback scripts** - For critical migrations
5. **Document everything** - Add comments explaining the change
6. **Track applied migrations** - Update \`applied/*.txt\` after each deploy

## Troubleshooting

### Migration failed midway

\`\`\`bash
# Check what was applied
psql $DATABASE_URL -c "\\dt"

# Fix the issue
# Re-run the migration or run rollback
\`\`\`

### Migrations out of order

\`\`\`bash
# Check applied migrations
cat migrations/applied/production.txt

# Re-run missing migrations in order
\`\`\`
`
  
  fs.writeFileSync(path.join(migrationsDir, 'README.md'), readme)
  
  console.log('\n✅ Migration structure complete!')
  console.log(`\n📍 Migrations organized in: ${migrationsDir}`)
  console.log('📖 Read migrations/README.md for usage instructions')
  
  // Ask about archiving old files
  const archive = await confirm('\nArchive original SQL files? (y/n): ')
  
  if (archive) {
    console.log('\n📦 Archiving original files...')
    
    const archiveDir = path.join(rootDir, 'archive', 'sql', 'unsorted')
    fs.mkdirSync(archiveDir, { recursive: true })
    
    analysis.chronologicalOrder.forEach(migration => {
      const oldPath = findFile(rootDir, migration.fileName)
      if (oldPath && !oldPath.includes('/migrations/') && !oldPath.includes('/archive/')) {
        const destPath = path.join(archiveDir, migration.fileName)
        try {
          fs.renameSync(oldPath, destPath)
          console.log(`  📦 ${migration.fileName}`)
        } catch (error) {
          console.error(`  ❌ Failed to archive ${migration.fileName}`)
        }
      }
    })
    
    console.log('\n✅ Original files archived')
  }
  
  console.log('\n🎉 Migration organization complete!\n')
  console.log('Next steps:')
  console.log('  1. Review migrations/ directory')
  console.log('  2. Test migrations on fresh database')
  console.log('  3. Update applied/*.txt with current state')
  console.log('  4. Commit to git\n')
}

function categorizeFromFeatures(migration) {
  if (migration.features.includes('ai-chat')) return 'ai_chat'
  if (migration.features.includes('vision')) return 'vision'
  if (migration.features.includes('fuel')) return 'fuel'
  if (migration.features.includes('maintenance')) return 'maintenance'
  if (migration.features.includes('vehicle')) return 'vehicle'
  if (migration.features.includes('garage')) return 'garage'
  if (migration.features.includes('location')) return 'location'
  if (migration.features.includes('analytics')) return 'analytics'
  if (migration.features.includes('notification')) return 'notification'
  if (migration.changes.creates > 0) return 'schema'
  if (migration.changes.inserts > 0) return 'seed'
  if (migration.changes.alters > 0) return 'alter'
  return 'misc'
}

function sanitizeFileName(fileName) {
  return fileName
    .replace(/\.sql$/i, '')
    .replace(/^(ADD|FIX|CREATE|UPDATE|DELETE|ENABLE|DISABLE|CORRECT|FINAL|WORKING|COMPLETE|SIMPLE|ENHANCED|IMPROVED|FIXED|CORRECTED|MIGRATION|SCHEMA)-/gi, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .substring(0, 40)
}

function findFile(dir, fileName, maxDepth = 3, currentDepth = 0) {
  if (currentDepth > maxDepth) return null
  
  const items = fs.readdirSync(dir)
  
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (item === fileName) {
      return fullPath
    }
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'migrations') {
      const found = findFile(fullPath, fileName, maxDepth, currentDepth + 1)
      if (found) return found
    }
  }
  
  return null
}

function confirm(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

// Run
organizeMigrations().catch(console.error)
