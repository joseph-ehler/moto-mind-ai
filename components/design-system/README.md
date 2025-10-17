# MotoMind Design System

A comprehensive, production-ready design system built on shadcn/ui + Tailwind CSS with mobile-first responsive components.

## 🏗️ Architecture

See [CARD_ARCHITECTURE.md](./CARD_ARCHITECTURE.md) for details on the Card component layering and why we have a single, enhanced Card pattern.

**Key Principle:** Single Source of Truth
- Base primitives from shadcn/ui
- Enhanced patterns with design system features
- Clear, documented responsibility for each layer

---

## 📏 Naming Standards

All files follow **consistent PascalCase naming**:
- ✅ `OverlayTypes.ts` (not `overlay-types.ts`)
- ✅ `Heroes.tsx` (plural for multiple components)
- ✅ `Button.tsx` (singular for single component)
- ✅ `AdvancedTypography.tsx` (descriptive, not "Elite")

See [NAMING_STANDARDS.md](./NAMING_STANDARDS.md) for complete guidelines.

---

## 📁 Organization

The design system is organized into **5 main categories**:

### **1. `primitives/`** - Foundational Building Blocks
Core layout and UI primitives that everything else builds upon.

- **Layout** - Container, Grid, Stack, Flex, Section
- **Typography** - Heading, Text, Display (Elite Typography)
- **Surfaces** - Card, BaseCard, ColoredBox
- **Button** - Button, ButtonGroup

### **2. `patterns/`** - Composed Components
Higher-level components composed from primitives.

- **Heroes** - MarketingHero, PageHero, DashboardHero, EntityHero, FeatureHero, EmptyStateHero
- **Navigation** - Navbar, Sidebar, Tabs, Breadcrumbs, Pagination
- **Cards** - StatsCard, MetricCard, ActionCard
- **DataDisplay** - Tables, Lists, Badges, Avatars
- **SectionHeaders** - Various section header patterns
- **EmptyStates** - Empty state patterns
- **AdvancedLayout** - Complex layout patterns

### **3. `forms/`** - Form Components
All form-related inputs and controls.

- FormFields, FormSection
- CheckboxRadio, SwitchSlider
- DatePicker, TimePicker, ColorPicker
- PasswordInput, PhoneInput, NumberInput, OTPInput
- Rating, Combobox
- Calendar (advanced)

### **4. `feedback/`** - User Feedback Components
Components for showing feedback, loading states, and overlays.

- **Modals** - Modal, Dialog, Drawer
- **Notifications** - Toast, Alert, Banner
- **Overlays** - Popover, Tooltip, Dropdown
- **LoadingStates** - Spinner, Skeleton, ProgressBar

### **5. `utilities/`** - Specialized Utilities
Complex, specialized components.

- **FileUpload** - Drag & drop file uploads
- **FilePreview** - File preview with AI vision
- **Search** - Advanced search components
- **ActionBars** - Command bars, bottom action bars

---

## 🚀 Usage

All components are exported from the main barrel export for backward compatibility:

```tsx
import {
  // Primitives
  Container, Stack, Flex, Grid, Section,
  Button, Heading, Text, Card,
  
  // Patterns
  EntityHero, PageHero, DashboardHero,
  SectionHeader, StatsCard,
  
  // Forms
  Input, Textarea, Checkbox, DatePicker,
  
  // Feedback
  Modal, Toast, LoadingSpinner,
  
  // Utilities
  FileUpload, Search
} from '@/components/design-system'
```

**No import changes needed!** All existing imports continue to work.

---

## 📚 Documentation

Each category contains markdown documentation:

- `patterns/HEROES_GUIDE.md` - Hero component patterns
- `patterns/CARDS_GUIDE.md` - Card component patterns
- `patterns/SECTION_HEADERS_GUIDE.md` - Section header patterns
- `feedback/MODALS_GUIDE.md` - Modal system guide
- `utilities/FILEPREVIEW_*.md` - File preview documentation

---

## 🎯 Design Principles

### **Mobile-First**
All components are responsive and touch-optimized by default.

### **Accessible**
WCAG 2.1 AA compliant with proper ARIA labels and keyboard navigation.

### **Composable**
Build complex UIs by composing simple primitives.

### **Type-Safe**
Full TypeScript support with comprehensive prop types.

### **Layout System**
Follows the MotoMind Layout System rules:
- Use `Container` for max-width constraints
- Use `Stack` for vertical spacing
- Use `Grid`/`Flex` for layouts
- Use `Section` for page sections

---

## 🔄 Phase 1 Complete (Current State)

✅ Categorical folder structure created  
✅ All components moved to appropriate folders  
✅ All imports updated (backward compatible)  
✅ Documentation organized by category  

### **Next Steps (Phase 2)**

When ready, we can decompose the large monoliths:

1. **Navigation.tsx** (82KB) → Split into Navbar, Sidebar, Tabs, etc.
2. **Heroes.tsx** (42KB) → Split into separate hero components
3. **DataDisplay.tsx** (36KB) → Split into Table, List, Badge, etc.
4. **StatsCards.tsx** (49KB) → Split into metric card components

This will be done gradually to avoid breaking changes.

---

## 📦 Bundle Impact

The new organization has **zero bundle size impact** because:
- All exports go through the same barrel (`index.tsx`)
- Tree-shaking works identically
- No runtime overhead
- Backward compatible imports

---

## 🛠️ Development

### Adding New Components

1. **Choose the right category:**
   - Foundational? → `primitives/`
   - Composed UI? → `patterns/`
   - Form input? → `forms/`
   - Feedback/loading? → `feedback/`
   - Specialized tool? → `utilities/`

2. **Create the component file** in the appropriate folder

3. **Export from** `index.tsx`:
```tsx
export { MyComponent } from './category/MyComponent'
export type { MyComponentProps } from './category/MyComponent'
```

4. **Add documentation** if the component is complex

---

## 📊 Statistics

- **7 Categories** (including Calendar, FilePreview)
- **50+ Components** organized
- **100% Backward Compatible**
- **0 Breaking Changes**

---

Built with ❤️ for MotoMind
