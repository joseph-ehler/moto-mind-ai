# Viewport Height - Quick Reference

## 🎯 TL;DR

**All modals automatically fit any device viewport through:**
1. Responsive `max-h` (90vh mobile, 85vh desktop)
2. Fixed header + scrollable content + fixed footer
3. Overflow handling built-in

**You don't need to do anything special. Just use the modal components!**

---

## 📐 Visual Breakdown

### iPhone (Small)
```
┌───────────────┐ ← Browser chrome
│ 🔵 Header     │ ← 80px fixed
├───────────────┤
│ Content       │
│ scrollable    │ ← ~440px (90vh - chrome)
│ if needed     │   Auto-scrolls if taller
│ ...           │
├───────────────┤
│ [Cancel][Save]│ ← 84px fixed
└───────────────┘
Total: 667px viewport
Modal: 600px (90vh)
Content: ~440px scrollable
```

### iPad (Medium)
```
┌─────────────────────┐
│ 🔵 Header           │ ← 80px fixed
├─────────────────────┤
│ Content             │
│ More space          │ ← ~840px (85vh - chrome)
│ available           │   Rarely needs scroll
│ ...                 │
├─────────────────────┤
│ [Cancel]      [Save]│ ← 84px fixed
└─────────────────────┘
Total: 1180px viewport
Modal: 1003px (85vh)
Content: ~840px scrollable
```

### Desktop (Large)
```
┌─────────────────────────────┐
│ 🔵 Header                   │ ← 80px fixed
├─────────────────────────────┤
│ Content                     │
│ Plenty of vertical space    │ ← ~748px (85vh - chrome)
│ Almost never scrolls        │
│ ...                         │
├─────────────────────────────┤
│ [Cancel]            [Save]  │ ← 84px fixed
└─────────────────────────────┘
Total: 1080px viewport
Modal: 918px (85vh)
Content: ~748px scrollable
```

---

## 🔧 How It Works

### CSS Classes Applied
```tsx
// BaseModal container
<div className="fixed inset-0 p-4 sm:p-6">
  {/* Responsive padding: 4 mobile, 6 desktop */}
  
  <div className="max-h-[90vh] sm:max-h-[85vh] flex flex-col">
    {/* max-h prevents overflow, flex-col stacks sections */}
    
    <ModalHeader className="flex-shrink-0" />
    {/* Won't shrink, always visible */}
    
    <ModalContent className="flex-1 overflow-y-auto" />
    {/* Grows to fill space, scrolls if needed */}
    
    <ModalFooter className="flex-shrink-0" />
    {/* Won't shrink, always visible */}
  </div>
</div>
```

---

## 📱 Device Measurements

| Device | Viewport Height | Modal Max-Height | Available Content |
|--------|----------------|------------------|-------------------|
| **iPhone SE** | 667px | 600px (90vh) | ~440px |
| **iPhone 13** | 844px | 760px (90vh) | ~595px |
| **iPhone 13 Pro Max** | 926px | 833px (90vh) | ~670px |
| **iPad Mini** | 1024px | 870px (85vh) | ~705px |
| **iPad Air** | 1180px | 1003px (85vh) | ~840px |
| **MacBook 13"** | 800px | 680px (85vh) | ~515px |
| **Desktop 1080p** | 1080px | 918px (85vh) | ~748px |

**Content = Modal Height - Header (~80px) - Footer (~84px) - Padding**

---

## 🎨 Modal Size Impact

Modal **width** doesn't affect height handling:

```tsx
// All sizes use same height strategy
<SimpleFormModal size="md" />   // 448px wide, same height logic
<CardFormModal size="lg" />     // 672px wide, same height logic
<FullWidthModal size="xl" />    // 896px wide, same height logic
```

---

## 🧪 Testing

### Quick Device Tests

**Mobile:**
```bash
# Chrome DevTools
1. Press Cmd+Shift+M (device mode)
2. Select "iPhone SE" (smallest common)
3. Open any modal
4. ✅ Should fit with scrolling if needed
```

**Landscape:**
```bash
1. Rotate device icon in DevTools
2. ✅ Modal should adjust to less vertical space
3. ✅ Content should scroll smoothly
```

**Keyboard:**
```bash
1. Focus an input field
2. ✅ Modal adjusts automatically
3. ✅ Can scroll to see all fields
```

---

## ⚠️ Common Issues (and Non-Issues)

### ❌ "Modal is cut off on mobile!"
**Solution:** Already handled. Modal is `max-h-[90vh]`, can't be cut off.

### ❌ "Content hidden under footer!"
**Solution:** Already handled. Content has `pb-24` when footer present.

### ❌ "Can't scroll to bottom input!"
**Solution:** Already handled. Browser auto-scrolls to focused input.

### ❌ "Different on iPhone vs Android!"
**Solution:** Already handled. Uses viewport-relative units, works everywhere.

---

## 🚀 Usage Examples

### Simple Modal (Usually fits)
```tsx
<SimpleFormModal>
  <div>
    <Label>Name</Label>
    <Input className="h-12" />
  </div>
  <div>
    <Label>Email</Label>
    <Input className="h-12" />
  </div>
</SimpleFormModal>
```
**Result:** Likely fits without scrolling. If not, scrolls smoothly.

---

### Card Modal (Often needs scroll)
```tsx
<CardFormModal sections={[
  { id: '1', title: 'Section 1', content: <Fields1 /> },
  { id: '2', title: 'Section 2', content: <Fields2 /> },
  { id: '3', title: 'Section 3', content: <Fields3 /> },
]} />
```
**Result:** Header/footer visible, content scrolls between them.

---

### Full Width Modal (Definitely scrolls)
```tsx
<FullWidthModal>
  <div className="grid grid-cols-2 gap-8">
    <div>
      <img src="..." className="h-[400px]" />
    </div>
    <div className="space-y-6">
      {/* Many fields */}
    </div>
  </div>
</FullWidthModal>
```
**Result:** Large content scrolls smoothly, header/footer always visible.

---

## 🎯 Key Takeaway

**You don't need to think about viewport height!**

Our modal system:
- ✅ Automatically fits any device
- ✅ Scrolls content when needed
- ✅ Keeps header/footer visible
- ✅ Handles keyboard appearance
- ✅ Works in any orientation
- ✅ Adapts to dynamic browser chrome

**Just build your modal content and it will work everywhere.** 🚀

---

**For deep dive:** See [RESPONSIVE_DESIGN.md](./RESPONSIVE_DESIGN.md)
