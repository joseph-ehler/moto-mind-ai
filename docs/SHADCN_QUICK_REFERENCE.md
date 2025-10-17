# 🚀 **shadcn/ui Quick Reference**

**One-page reference for MotoMind developers**

---

## 📦 **IMPORT PATTERN**

```tsx
// ✅ ALWAYS import from barrel
import { Button, Card, Dialog, Input, Table } from '@/components/ui'

// ✅ Also available
import { useIsMobile } from '@/components/ui'
import { cn } from '@/components/ui'
import { toast } from '@/components/ui'
```

---

## 🎨 **MOST USED COMPONENTS**

### **Button**
```tsx
<Button>Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button disabled>Disabled</Button>
```

### **Card**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content here</CardContent>
  <CardFooter>Footer actions</CardFooter>
</Card>
```

### **Dialog**
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    <DialogFooter>
      <Button>Close</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### **Input**
```tsx
<Input type="text" placeholder="Enter text..." />
<Input type="email" />
<Input type="password" />
<Input disabled />
```

### **Select**
```tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Choose..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
    <SelectItem value="2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

### **Table**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Item 1</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

## 🎯 **COMMON PATTERNS**

### **Form with Validation**
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, Input, Button } from '@/components/ui'

const schema = z.object({
  name: z.string().min(2)
})

const form = useForm({ resolver: zodResolver(schema) })

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Name</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button type="submit">Submit</Button>
  </form>
</Form>
```

### **Toast Notifications**
```tsx
import { toast } from '@/components/ui'

toast.success('Success!')
toast.error('Error occurred')
toast.loading('Loading...')
toast('Custom', { description: 'Details here' })
```

### **Dropdown Menu**
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### **Sheet (Slide-over)**
```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button>Open</Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Title</SheetTitle>
    </SheetHeader>
    Content here
  </SheetContent>
</Sheet>
```

---

## 🎨 **STYLING**

### **Using cn() utility**
```tsx
import { cn } from '@/components/ui'

<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  variant === "primary" && "primary-classes"
)} />
```

### **Tailwind Classes**
```tsx
// Spacing
className="p-4 px-6 py-2 m-4 space-y-4 gap-2"

// Colors
className="bg-primary text-primary-foreground"
className="bg-destructive text-destructive-foreground"

// Layout
className="flex items-center justify-between"
className="grid grid-cols-2 gap-4"

// Typography
className="text-lg font-bold"
className="text-sm text-muted-foreground"
```

---

## 📊 **54 COMPONENTS AVAILABLE**

### Forms (13)
Button, ButtonGroup, Input, InputOTP, InputGroup, Label, Textarea, Select, Checkbox, RadioGroup, Switch, Slider, Form, Field, Calendar

### Layout (9)
Card, Separator, Tabs, Accordion, AspectRatio, ScrollArea, Resizable, Collapsible

### Feedback (9)
Progress, Badge, Alert, AlertDialog, Skeleton, Spinner, Toast, Empty, Kbd

### Overlays (13)
Dialog, Sheet, Drawer, DropdownMenu, ContextMenu, Menubar, Popover, Tooltip, HoverCard

### Navigation (5)
NavigationMenu, Breadcrumb, Command, Pagination, Sidebar

### Data (4)
Table, Avatar, Carousel, Chart

### Utility (3)
Toggle, ToggleGroup, Item

---

## 🔧 **ADDING NEW COMPONENTS**

```bash
# Add single component
npx shadcn@latest add [component]

# Update all
npx shadcn@latest add --all --overwrite
```

---

## 📖 **RESOURCES**

- **Docs:** https://ui.shadcn.com
- **Components:** https://ui.shadcn.com/docs/components
- **Icons:** https://lucide.dev

---

## ✅ **QUICK CHECKLIST**

- [ ] Import from `@/components/ui`
- [ ] Use built-in variants
- [ ] Combine with design system
- [ ] Use `cn()` for conditional classes
- [ ] Test responsiveness
- [ ] Follow Tailwind conventions

---

**Updated:** Oct 16, 2025  
**Status:** Production Ready
