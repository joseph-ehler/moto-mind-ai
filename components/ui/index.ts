/**
 * shadcn/ui Components - Complete Export Index
 * 
 * ALL shadcn/ui components available for import
 * Updated: Oct 16, 2025
 * 
 * Usage:
 * import { Button, Card, Dialog } from '@/components/ui'
 */

// ============================================================================
// FORM COMPONENTS
// ============================================================================

export { Button, buttonVariants } from './button'
export { ButtonGroup } from './button-group'
export { Input } from './input'
export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from './input-otp'
export { InputGroup } from './input-group'
export { Label } from './label'
export { Textarea } from './textarea'
export { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton
} from './select'
export { Checkbox } from './checkbox'
export { RadioGroup, RadioGroupItem } from './radio-group'
export { Switch } from './switch'
export { Slider } from './slider'
export { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField
} from './form'
export { Field } from './field'
export { Calendar } from './calendar'

// ============================================================================
// LAYOUT COMPONENTS
// ============================================================================

export { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from './card'
export { Separator } from './separator'
export { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from './tabs'
export { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from './accordion'
export { AspectRatio } from './aspect-ratio'
export { ScrollArea, ScrollBar } from './scroll-area'
export { 
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from './resizable'
export { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible'

// ============================================================================
// FEEDBACK COMPONENTS
// ============================================================================

export { Progress } from './progress'
export { Badge, badgeVariants } from './badge'
export { Alert, AlertDescription, AlertTitle } from './alert'
export { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from './alert-dialog'
export { Skeleton } from './skeleton'
export { Spinner } from './spinner'
export { toast } from 'sonner'
export { Toaster } from './sonner'
export { Empty } from './empty'
export { Kbd } from './kbd'

// ============================================================================
// OVERLAY COMPONENTS
// ============================================================================

export { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from './dialog'
export { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay
} from './sheet'
export { 
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger
} from './drawer'
export { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger
} from './dropdown-menu'
export { 
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger
} from './context-menu'
export { 
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger
} from './menubar'
export { 
  Popover, 
  PopoverAnchor,
  PopoverContent, 
  PopoverTrigger 
} from './popover'
export { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from './tooltip'
export { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card'

// ============================================================================
// NAVIGATION COMPONENTS
// ============================================================================

export { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  navigationMenuTriggerStyle
} from './navigation-menu'
export { 
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from './breadcrumb'
export { 
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut
} from './command'
export { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from './pagination'
export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarInput,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar
} from './sidebar'

// ============================================================================
// DATA DISPLAY COMPONENTS
// ============================================================================

export { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from './table'
export { Avatar, AvatarFallback, AvatarImage } from './avatar'
export { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from './carousel'
export { 
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent
} from './chart'

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

export { Toggle, toggleVariants } from './toggle'
export { ToggleGroup, ToggleGroupItem } from './toggle-group'
export { Item } from './item'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export { cn } from '@/lib/utils/cn'

// ============================================================================
// HOOKS
// ============================================================================

export { useIsMobile } from '@/hooks/use-mobile'
