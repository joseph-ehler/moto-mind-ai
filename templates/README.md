# 📋 templates/ Directory

**Purpose:** Code generation templates and scaffolding for rapid development.

---

## 🎯 What Goes Here

**Use `templates/` for:**
- ✅ **Component templates** for UI scaffolding
- ✅ **Feature templates** for new feature creation
- ✅ **File templates** for consistent code structure
- ✅ **Boilerplate code** that's frequently reused

---

## 📁 Current Structure

```
templates/
└── design-system-page.tsx    # Template for design system pages
```

---

## 🚀 Available Templates

### **1. Design System Page Template**

**File:** `design-system-page.tsx`

**Purpose:** Create new design system showcase pages

**Usage:**
```bash
# Copy template
cp templates/design-system-page.tsx app/design-system/[new-page]/page.tsx

# Customize for your component
# Update title, description, examples
```

**When to Use:**
- Adding new design system component
- Creating component documentation
- Building component showcases

---

## 📋 Template Categories

### **Component Templates**
```
Purpose: Scaffold new UI components
Examples:
- React component with TypeScript
- Component with tests
- Component with Storybook
```

### **Feature Templates**
```
Purpose: Create new feature structure
Examples:
- Feature with domain/data/ui folders
- Feature with complete structure
- Minimal feature template
```

### **Page Templates**
```
Purpose: Create new pages/routes
Examples:
- Dashboard page
- Form page
- List/detail pages
```

### **API Templates**
```
Purpose: Create API endpoints
Examples:
- GET/POST route
- Protected route
- CRUD operations
```

---

## 🔧 Creating New Templates

### **1. Identify Common Pattern**

Look for code you've written 3+ times:
```typescript
// If you're copy-pasting this pattern
// It should be a template!
```

### **2. Extract to Template**

```bash
# Create template file
touch templates/my-template.tsx

# Add boilerplate with placeholders
# Use {{PLACEHOLDER}} for customizable parts
```

### **3. Document Usage**

```typescript
/**
 * TEMPLATE: My Template
 * 
 * Purpose: [What this template does]
 * 
 * Usage:
 * 1. Copy this file to [location]
 * 2. Replace {{NAME}} with actual name
 * 3. Replace {{DESCRIPTION}} with description
 * 4. Customize [specific parts]
 * 
 * Example:
 * cp templates/my-template.tsx features/my-feature/ui/MyComponent.tsx
 */
```

### **4. Add to This README**

Update this file with the new template.

---

## 📖 Template Best Practices

### **Use Placeholders**

```typescript
// ✅ Good - Clear placeholders
export function {{COMPONENT_NAME}}(props: {{COMPONENT_NAME}}Props) {
  return <div>{{COMPONENT_NAME}} content</div>
}

// ❌ Bad - Requires manual find/replace
export function MyComponent(props: MyComponentProps) {
  return <div>MyComponent content</div>
}
```

### **Include Comments**

```typescript
// ✅ Good - Helpful comments
// TODO: Update this description for your component
export function {{COMPONENT_NAME}}() {
  // TODO: Add your component logic here
  return <div />
}

// ❌ Bad - No guidance
export function {{COMPONENT_NAME}}() {
  return <div />
}
```

### **Provide Examples**

```typescript
/**
 * Example Usage:
 * 
 * ```tsx
 * <MyComponent 
 *   title="Example"
 *   onAction={() => console.log('action')}
 * />
 * ```
 */
```

### **Follow Standards**

```typescript
// ✅ Templates should follow all naming conventions
// ✅ Templates should use design system
// ✅ Templates should include TypeScript types
// ✅ Templates should have error handling
```

---

## 🎯 Common Templates Needed

### **Feature Template**

```
features/{{FEATURE_NAME}}/
├── domain/
│   └── types.ts
├── data/
│   ├── api.ts
│   └── queries.ts
├── hooks/
│   └── use{{FeatureName}}.ts
├── ui/
│   └── {{FeatureName}}View.tsx
└── README.md
```

### **Component Template**

```typescript
import { Container, Heading, Text } from '@/components/design-system'

interface {{COMPONENT_NAME}}Props {
  // TODO: Add props
}

/**
 * {{COMPONENT_NAME}}
 * 
 * TODO: Add component description
 */
export function {{COMPONENT_NAME}}(props: {{COMPONENT_NAME}}Props) {
  return (
    <Container>
      <Heading>{{COMPONENT_NAME}}</Heading>
      <Text>TODO: Add content</Text>
    </Container>
  )
}
```

### **API Route Template**

```typescript
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/{{ROUTE}}
 * 
 * TODO: Add route description
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Implement GET logic
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### **Hook Template**

```typescript
import { useState, useEffect } from 'react'

/**
 * use{{HOOK_NAME}}
 * 
 * TODO: Add hook description
 */
export function use{{HOOK_NAME}}() {
  // TODO: Add hook logic
  
  return {
    // TODO: Return hook values
  }
}
```

---

## 🤖 Code Generation

### **Manual Method**

```bash
# 1. Copy template
cp templates/my-template.tsx path/to/new-file.tsx

# 2. Replace placeholders
sed -i '' 's/{{NAME}}/ActualName/g' path/to/new-file.tsx

# 3. Customize
# Edit file manually for specific needs
```

### **Script Method**

```bash
# Create a generator script
scripts/generate-component.sh MyComponent

# Script handles:
# - Copying template
# - Replacing placeholders
# - Creating test files
# - Updating exports
```

### **Future: CLI Tool**

```bash
# Potential future tool
npm run generate component MyComponent
npm run generate feature my-feature
npm run generate api my-endpoint
```

---

## 🚫 What NOT to Put Here

### **DON'T put in templates/:**

**Actual Code:**
```
❌ templates/UserProfile.tsx     (actual component)
✅ templates/component.tsx       (template with {{NAME}})
```

**Configuration:**
```
❌ templates/next.config.js      (config files go in root)
```

**Documentation:**
```
❌ templates/README.md           (docs go in docs/)
```

**Tests:**
```
❌ templates/component.test.tsx  (tests go in tests/)
```

---

## 📚 Related Documentation

- [Folder Structure Guide](../docs/architecture/FOLDER_STRUCTURE.md)
- [Naming Conventions](../docs/architecture/NAMING_CONVENTIONS.md)
- [Feature Development Guide](../docs/development/FEATURE_DEVELOPMENT.md)

---

## 💡 Template Development Tips

1. **Start Simple** - Basic template, add complexity later
2. **Use Comments** - Guide the developer
3. **Include Examples** - Show expected usage
4. **Test Templates** - Use them yourself first
5. **Keep Updated** - Update when patterns change
6. **Document Well** - Explain when and how to use

---

## 🎯 Template Maintenance

### **Review Regularly**

```
Monthly: Check if templates are still relevant
Quarterly: Update for new patterns
Yearly: Remove unused templates
```

### **Update When:**

- Design system changes
- Architecture patterns change
- New best practices emerge
- Framework updates require changes

---

## ❓ Questions?

**"Should I create a template?"**
→ Have you written this 3+ times? → Yes
→ First or second time? → Not yet

**"Template vs generator script?"**
→ Simple copy-paste → Template
→ Complex setup → Generator script

**"Where do I use this template?"**
→ See template documentation
→ Follow folder structure guide

---

**Maintained By:** Engineering Team  
**Questions?** See [CONTRIBUTING.md](../CONTRIBUTING.md)
