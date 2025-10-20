# 🔄 CI/CD Integration Guide

**Phase 5: Automated Schema Validation**

---

## 🎯 OVERVIEW

Integrate Phase 5 preflight checks into your CI/CD pipeline to catch schema issues before they reach production.

**Benefits:**
- ✅ Automatic validation on every PR
- ✅ Block merges with schema issues
- ✅ Generate reports for review
- ✅ Track schema changes over time

---

## 🚀 GITHUB ACTIONS

### Complete Workflow

Create `.github/workflows/schema-validation.yml`:

```yaml
name: Schema Validation

on:
  pull_request:
    paths:
      - 'database/migrations/**'
      - 'database/supabase/migrations/**'
      - 'lib/database/**'

jobs:
  validate-schema:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup environment
        run: |
          echo "DATABASE_URL=${{ secrets.DATABASE_URL }}" >> $GITHUB_ENV
          echo "OPENAI_API_KEY=${{ secrets.OPENAI_API_KEY }}" >> $GITHUB_ENV
      
      - name: Sync Registry
        run: npm run db registry:sync
      
      - name: Run AI Preflight
        id: preflight
        run: |
          npm run db ai:preflight \
            --feature "${{ github.event.pull_request.title }}" \
            --output preflight-result.json
        continue-on-error: true
      
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: preflight-results
          path: preflight-result.json
      
      - name: Parse Results
        id: parse
        run: |
          STATUS=$(jq -r '.status' preflight-result.json)
          SUMMARY=$(jq -r '.summary' preflight-result.json)
          BLOCKERS=$(jq -r '.lint_results.blockers // 0' preflight-result.json)
          DUPLICATES=$(jq -r '.duplicates.count // 0' preflight-result.json)
          
          echo "status=$STATUS" >> $GITHUB_OUTPUT
          echo "summary=$SUMMARY" >> $GITHUB_OUTPUT
          echo "blockers=$BLOCKERS" >> $GITHUB_OUTPUT
          echo "duplicates=$DUPLICATES" >> $GITHUB_OUTPUT
      
      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('preflight-result.json', 'utf8'));
            
            let emoji = '✅';
            if (results.status === 'blocked') emoji = '❌';
            else if (results.status === 'needs_review') emoji = '⚠️';
            
            let body = `## ${emoji} Schema Validation Results\n\n`;
            body += `**Status:** ${results.status.toUpperCase()}\n\n`;
            body += `**Summary:** ${results.summary}\n\n`;
            
            if (results.duplicates.found) {
              body += `### ⚠️ Similar Tables Found\n\n`;
              results.duplicates.matches.slice(0, 3).forEach(match => {
                const similarity = (match.similarity * 100).toFixed(1);
                body += `- ${match.schema}.${match.table} (${similarity}% match)\n`;
              });
              body += '\n';
            }
            
            if (results.lint_results && results.lint_results.blockers > 0) {
              body += `### ❌ Linting Blockers (${results.lint_results.blockers})\n\n`;
              results.lint_results.issues
                .filter(i => i.severity === 'error')
                .slice(0, 5)
                .forEach(issue => {
                  body += `- ${issue.message}\n`;
                  if (issue.fix) {
                    body += `  \`\`\`\n  ${issue.fix}\n  \`\`\`\n`;
                  }
                });
              body += '\n';
            }
            
            if (results.actions.length > 0) {
              body += `### 📋 Recommended Actions\n\n`;
              results.actions.forEach((action, i) => {
                const icon = action.priority === 'critical' ? '🔴' : 
                             action.priority === 'high' ? '🟡' : '🟢';
                body += `${i + 1}. ${icon} **[${action.priority.toUpperCase()}]** ${action.message}\n`;
                if (action.command) {
                  body += `   \`${action.command}\`\n`;
                }
              });
            }
            
            body += `\n---\n📄 Full report available in workflow artifacts`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });
      
      - name: Fail if Blocked
        if: steps.parse.outputs.status == 'blocked'
        run: |
          echo "❌ Schema validation blocked - fix issues before merging"
          echo "Blockers: ${{ steps.parse.outputs.blockers }}"
          exit 1
```

---

## 🪝 PRE-COMMIT HOOKS

### Setup Husky

```bash
npm install --save-dev husky
npx husky install
```

### Create Hook

`.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Only run if migration files changed
MIGRATIONS=$(git diff --cached --name-only --diff-filter=ACM | grep -E "migrations/.*\.sql$")

if [ -n "$MIGRATIONS" ]; then
  echo "🔍 Migration files changed, running schema validation..."
  
  # Extract table name from migration (if present)
  TABLE=$(echo "$MIGRATIONS" | head -1 | grep -oP '(?<=_)[a-z_]+(?=\.sql)' || echo "")
  
  if [ -n "$TABLE" ]; then
    echo "📋 Linting table: $TABLE"
    npm run db schema:lint --table "$TABLE"
    
    if [ $? -ne 0 ]; then
      echo ""
      echo "❌ Schema linting failed!"
      echo "Fix issues before committing or use --no-verify to skip"
      exit 1
    fi
  fi
  
  echo "✅ Schema validation passed"
fi
```

Make executable:

```bash
chmod +x .husky/pre-commit
```

---

## 🔧 GITLAB CI/CD

`.gitlab-ci.yml`:

```yaml
schema-validation:
  stage: test
  image: node:20
  
  only:
    changes:
      - database/migrations/**
      - lib/database/**
  
  before_script:
    - npm ci
    - export DATABASE_URL=$DATABASE_URL
    - export OPENAI_API_KEY=$OPENAI_API_KEY
  
  script:
    - npm run db registry:sync
    - npm run db ai:preflight --feature "$CI_COMMIT_TITLE" --output preflight-result.json
    - |
      STATUS=$(jq -r '.status' preflight-result.json)
      if [ "$STATUS" = "blocked" ]; then
        echo "❌ Schema validation failed"
        jq '.summary' preflight-result.json
        exit 1
      fi
  
  artifacts:
    paths:
      - preflight-result.json
    expire_in: 30 days
    when: always
```

---

## 🌊 BITBUCKET PIPELINES

`bitbucket-pipelines.yml`:

```yaml
pipelines:
  pull-requests:
    '**':
      - step:
          name: Schema Validation
          image: node:20
          script:
            - npm ci
            - npm run db registry:sync
            - npm run db ai:preflight --feature "$BITBUCKET_PR_TITLE" --output result.json
            - |
              if [ "$(jq -r '.status' result.json)" = "blocked" ]; then
                echo "❌ Schema validation failed"
                exit 1
              fi
          artifacts:
            - result.json
```

---

## 🎯 JENKINS

`Jenkinsfile`:

```groovy
pipeline {
    agent any
    
    environment {
        DATABASE_URL = credentials('database-url')
        OPENAI_API_KEY = credentials('openai-key')
    }
    
    stages {
        stage('Setup') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Schema Validation') {
            when {
                changeset "database/migrations/**"
            }
            steps {
                sh 'npm run db registry:sync'
                sh 'npm run db ai:preflight --feature "${env.CHANGE_TITLE}" --output preflight.json'
                
                script {
                    def results = readJSON file: 'preflight.json'
                    if (results.status == 'blocked') {
                        error "Schema validation failed: ${results.summary}"
                    }
                }
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: 'preflight.json', allowEmptyArchive: true
        }
    }
}
```

---

## 📊 TRACKING METRICS

### Store Results in Database

```sql
CREATE TABLE ci_preflight_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_number INTEGER,
  commit_sha TEXT,
  status TEXT,
  blockers INTEGER,
  warnings INTEGER,
  duplicates_found INTEGER,
  results JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### GitHub Action Addition

```yaml
- name: Store Results
  run: |
    npm run db query "
      INSERT INTO ci_preflight_results (pr_number, commit_sha, status, blockers, warnings, duplicates_found, results)
      VALUES (
        ${{ github.event.pull_request.number }},
        '${{ github.sha }}',
        '$(jq -r '.status' preflight-result.json)',
        $(jq -r '.lint_results.blockers // 0' preflight-result.json),
        $(jq -r '.lint_results.warnings // 0' preflight-result.json),
        $(jq -r '.duplicates.count // 0' preflight-result.json),
        '$(cat preflight-result.json)'::jsonb
      )
    "
```

### Query Metrics

```sql
-- Success rate over time
SELECT 
  DATE_TRUNC('week', created_at) as week,
  COUNT(*) as total_checks,
  SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed,
  ROUND(100.0 * SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) / COUNT(*), 1) as success_rate
FROM ci_preflight_results
GROUP BY week
ORDER BY week DESC;

-- Most common blockers
SELECT 
  jsonb_array_elements(results->'lint_results'->'issues')->>'category' as issue_category,
  COUNT(*) as occurrences
FROM ci_preflight_results
WHERE status = 'blocked'
GROUP BY issue_category
ORDER BY occurrences DESC;
```

---

## 🚦 STATUS BADGES

Add to README.md:

```markdown
![Schema Validation](https://github.com/username/repo/workflows/Schema%20Validation/badge.svg)
```

---

## 💡 BEST PRACTICES

### 1. Run on Changed Files Only

```yaml
on:
  pull_request:
    paths:
      - 'database/migrations/**'  # Only run when migrations change
```

### 2. Cache Dependencies

```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'  # Cache node_modules
```

### 3. Fail Fast

```yaml
- name: Quick Lint
  run: npm run db schema:lint --table $TABLE
  # Fails immediately if blockers found
```

### 4. Archive Results

```yaml
artifacts:
  paths:
    - preflight-result.json
  expire_in: 30 days  # Keep for audit trail
```

### 5. Notify Team

```yaml
- name: Slack Notification
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: '❌ Schema validation failed on PR #${{ github.event.pull_request.number }}'
```

---

## 🔒 SECURITY

### Protect Secrets

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

**Never:**
- ❌ Hardcode credentials
- ❌ Log sensitive data
- ❌ Expose in PR comments

### Use Read-Only DB Connection

For CI, use a read-only database user:

```sql
CREATE USER ci_readonly WITH PASSWORD 'xxx';
GRANT CONNECT ON DATABASE postgres TO ci_readonly;
GRANT USAGE ON SCHEMA public TO ci_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ci_readonly;
```

---

## 📈 OPTIMIZATION

### 1. Parallel Jobs

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - run: npm run db schema:lint
  
  similarity:
    runs-on: ubuntu-latest
    steps:
      - run: npm run db registry:similar -- --text "$TITLE"
```

### 2. Skip if No Changes

```yaml
- name: Check Changes
  id: changes
  run: |
    if git diff --name-only ${{ github.event.before }} ${{ github.sha }} | grep -q "migrations/"; then
      echo "run=true" >> $GITHUB_OUTPUT
    else
      echo "run=false" >> $GITHUB_OUTPUT
    fi

- name: Run Preflight
  if: steps.changes.outputs.run == 'true'
  run: npm run db ai:preflight
```

### 3. Incremental Checks

Only check changed tables:

```bash
CHANGED_FILES=$(git diff --name-only HEAD~1)
TABLES=$(echo "$CHANGED_FILES" | grep -oP '(?<=_)[a-z_]+(?=\.sql)' | sort -u)

for TABLE in $TABLES; do
  npm run db schema:lint --table "$TABLE"
done
```

---

## 🎊 EXAMPLE PR COMMENT

When validation runs, PRs get comments like:

```markdown
## ✅ Schema Validation Results

**Status:** NEEDS_REVIEW

**Summary:** ⚠️ NEEDS REVIEW: 1 similar table(s) found, 1 suggestion(s)

### ⚠️ Similar Tables Found

- public.user_maintenance_preferences (50.4% match)

### 📋 Recommended Actions

1. 🟡 **[HIGH]** Consider reusing existing table "user_maintenance_preferences" (50.4% match)
   `npm run db registry:similar -- --text "vehicle notes"`

---
📄 Full report available in workflow artifacts
```

---

## 🆘 TROUBLESHOOTING

### CI Fails: "DATABASE_URL not set"

**Solution:** Add secrets in GitHub Settings → Secrets → Actions

### CI Fails: "OpenAI API rate limit"

**Solution:** Use separate API key for CI with higher limits

### Slow CI Runs

**Solution:** 
- Enable npm caching
- Run only on changed files
- Use parallel jobs

---

## 📚 RESOURCES

- GitHub Actions Docs: https://docs.github.com/actions
- GitLab CI Docs: https://docs.gitlab.com/ee/ci/
- Husky Docs: https://typicode.github.io/husky/

---

**Integrate once, prevent bugs forever! 🚀**
