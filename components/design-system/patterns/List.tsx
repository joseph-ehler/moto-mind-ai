'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Stack, Flex } from '../primitives/Layout'
import { Text } from '../primitives/Typography'
import { useIsMobile, useIsTouch } from '../utilities/Search'
import { ChevronRight, Check, Circle, Loader2 } from 'lucide-react'

// ============================================================================
// LIST - MotoMind Design System
// Beautiful, responsive, mobile-first lists with best practices
// ============================================================================

// ----------------------------------------------------------------------------
// Types & Interfaces
// ----------------------------------------------------------------------------

export type ListVariant = 'default' | 'card' | 'minimal' | 'bordered' | 'striped'
export type ListSize = 'sm' | 'md' | 'lg'
export type ListItemType = 'unordered' | 'ordered' | 'none'

export interface ListProps {
  /** List items - can be strings or ReactNode */
  items?: Array<React.ReactNode | string>
  /** Custom children - overrides items prop */
  children?: React.ReactNode
  /** Visual variant */
  variant?: ListVariant
  /** Size preset */
  size?: ListSize
  /** List type */
  type?: ListItemType
  /** Show dividers between items */
  divided?: boolean
  /** Spacing between items */
  spacing?: 'none' | 'sm' | 'md' | 'lg'
  /** Additional className */
  className?: string
  /** Ordered list starting number */
  start?: number
  /** Loading state */
  loading?: boolean
  /** Empty state message */
  emptyMessage?: string
  /** Empty state icon */
  emptyIcon?: React.ReactNode
  /** ARIA label for accessibility */
  'aria-label'?: string
  /** Role for accessibility */
  role?: string
}

export interface ListItemComponentProps {
  /** Item content */
  children?: React.ReactNode
  /** Leading icon or avatar */
  leading?: React.ReactNode
  /** Trailing content (badge, button, icon) */
  trailing?: React.ReactNode
  /** Item is clickable */
  onClick?: () => void
  /** Item is selected */
  selected?: boolean
  /** Item is disabled */
  disabled?: boolean
  /** Show arrow indicator */
  showArrow?: boolean
  /** Additional className */
  className?: string
  /** Item title (for complex items) */
  title?: string
  /** Item description (for complex items) */
  description?: string
  /** Loading state for this item */
  loading?: boolean
  /** Link href (renders as anchor) */
  href?: string
  /** Link target */
  target?: string
  /** ARIA label */
  'aria-label'?: string
  /** Test ID for testing */
  'data-testid'?: string
}

// ----------------------------------------------------------------------------
// List Component
// ----------------------------------------------------------------------------

/**
 * List - Beautiful, responsive list component
 * 
 * @example
 * // Simple list
 * <List items={['Item 1', 'Item 2', 'Item 3']} />
 * 
 * @example
 * // Complex list with custom items
 * <List variant="card" divided>
 *   <ListItem 
 *     leading={<Avatar />} 
 *     title="John Doe" 
 *     description="Software Engineer"
 *     trailing={<Badge>Pro</Badge>}
 *   />
 * </List>
 */
export function List({
  items,
  children,
  variant = 'default',
  size = 'md',
  type = 'none',
  divided = false,
  spacing = 'md',
  className,
  start = 1,
  loading = false,
  emptyMessage,
  emptyIcon,
  'aria-label': ariaLabel,
  role,
}: ListProps) {
  const isMobile = useIsMobile()
  
  // Mobile-first responsive size classes
  const sizeClasses = {
    sm: cn(
      'text-sm',
      isMobile && 'text-xs' // Smaller on mobile
    ),
    md: cn(
      'text-base',
      isMobile && 'text-sm' // Base on mobile
    ),
    lg: cn(
      'text-lg',
      isMobile && 'text-base' // Large becomes base on mobile
    )
  }

  // Responsive spacing - tighter on mobile
  const spacingClasses = {
    none: 'space-y-0',
    sm: isMobile ? 'space-y-0.5' : 'space-y-1',
    md: isMobile ? 'space-y-1' : 'space-y-2',
    lg: isMobile ? 'space-y-2' : 'space-y-4'
  }

  // Variant classes with mobile optimization
  const variantClasses = {
    default: '',
    card: cn(
      'bg-white rounded-lg border border-slate-200 overflow-hidden',
      isMobile ? 'p-1.5' : 'p-2' // Tighter padding on mobile
    ),
    minimal: '',
    bordered: 'border border-slate-200 rounded-lg overflow-hidden',
    striped: ''
  }

  // Loading state
  if (loading) {
    return (
      <div className={cn(
        'flex items-center justify-center py-8',
        variantClasses[variant],
        className
      )}>
        <Stack spacing="sm" className="items-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <Text className="text-sm text-slate-600">Loading...</Text>
        </Stack>
      </div>
    )
  }

  // Empty state
  const hasContent = (items && items.length > 0) || children
  if (!hasContent && emptyMessage) {
    return (
      <div className={cn(
        'flex items-center justify-center py-12',
        variantClasses[variant],
        className
      )}>
        <Stack spacing="md" className="items-center text-center max-w-sm">
          {emptyIcon && (
            <div className="text-slate-400">
              {emptyIcon}
            </div>
          )}
          <Text className="text-slate-600">{emptyMessage}</Text>
        </Stack>
      </div>
    )
  }

  // If simple string items provided, render simple list
  const renderSimpleItems = () => {
    if (!items) return null
    
    return items.map((item, index) => (
      <ListItem key={index}>
        {item}
      </ListItem>
    ))
  }

  const content = children || renderSimpleItems()

  const listClasses = cn(
    sizeClasses[size],
    !divided && spacingClasses[spacing],
    variantClasses[variant],
    className
  )

  const commonProps = {
    'aria-label': ariaLabel,
    role,
  }

  // For ordered/unordered lists
  if (type === 'ordered') {
    return (
      <ol start={start} className={listClasses} {...commonProps}>
        {content}
      </ol>
    )
  }

  if (type === 'unordered') {
    return (
      <ul className={listClasses} {...commonProps}>
        {content}
      </ul>
    )
  }

  // Default div-based list
  return (
    <div className={listClasses} {...commonProps}>
      {divided ? (
        <div className="divide-y divide-slate-200">
          {content}
        </div>
      ) : (
        content
      )}
    </div>
  )
}

// ----------------------------------------------------------------------------
// List Item Component
// ----------------------------------------------------------------------------

/**
 * ListItem - Individual list item with rich content support
 * 
 * @example
 * <ListItem 
 *   leading={<User className="w-4 h-4" />}
 *   title="User Settings"
 *   description="Manage your account"
 *   trailing={<ChevronRight />}
 *   onClick={handleClick}
 * />
 */
export function ListItem({
  children,
  leading,
  trailing,
  onClick,
  selected = false,
  disabled = false,
  showArrow = false,
  className,
  title,
  description,
  loading = false,
  href,
  target,
  'aria-label': ariaLabel,
  'data-testid': testId,
}: ListItemComponentProps) {
  const isMobile = useIsMobile()
  const isTouch = useIsTouch()
  const isInteractive = Boolean(onClick || href)
  const hasComplexContent = Boolean(title || description)

  // Mobile-first responsive classes
  const itemClasses = cn(
    'flex items-center w-full transition-all duration-200',
    // Mobile-first padding and gap
    isMobile ? 'gap-2 px-2.5 py-2' : 'gap-3 px-3 py-2.5',
    // Interactive states with better touch targets on mobile
    isInteractive && !disabled && [
      'cursor-pointer',
      // Enhanced touch feedback on mobile
      isTouch ? 'active:scale-[0.98] active:bg-slate-100' : 'hover:bg-slate-50',
      // Focus visible for keyboard navigation
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
    ],
    // Selected state
    selected && [
      'bg-blue-50 text-blue-900',
      isInteractive && (isTouch ? 'active:bg-blue-100' : 'hover:bg-blue-100')
    ],
    // Disabled state
    disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
    className
  )

  // Determine component type
  const Component = href ? 'a' : isInteractive ? 'button' : 'div'

  // Loading state
  if (loading) {
    return (
      <div className={cn(itemClasses, 'justify-center')}>
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
      </div>
    )
  }

  // Content rendering with mobile-optimized typography
  const itemContent = hasComplexContent ? (
    <Stack spacing="xs" className="flex-1 min-w-0 text-left">
      {title && (
        <Text className={cn(
          'font-medium truncate leading-tight',
          isMobile ? 'text-sm' : 'text-base',
          selected ? 'text-blue-900' : 'text-slate-900'
        )}>
          {title}
        </Text>
      )}
      {description && (
        <Text className={cn(
          'truncate leading-tight',
          isMobile ? 'text-xs' : 'text-sm',
          selected ? 'text-blue-700' : 'text-slate-600'
        )}>
          {description}
        </Text>
      )}
    </Stack>
  ) : children ? (
    <div className="flex-1 min-w-0 text-left">
      {children}
    </div>
  ) : null

  const componentProps = {
    className: itemClasses,
    onClick: href ? undefined : onClick,
    disabled: disabled && !href ? disabled : undefined,
    type: isInteractive && !href ? 'button' : undefined,
    href,
    target,
    rel: target === '_blank' ? 'noopener noreferrer' : undefined,
    'aria-label': ariaLabel,
    'aria-disabled': disabled,
    'aria-selected': selected,
    'data-testid': testId,
  } as any

  return (
    <Component {...componentProps}>
      {/* Leading icon/avatar */}
      {leading && (
        <div className={cn(
          'flex-shrink-0',
          selected ? 'text-blue-600' : 'text-slate-500',
          isMobile && 'scale-95' // Slightly smaller icons on mobile
        )}>
          {leading}
        </div>
      )}
      
      {/* Main content */}
      {itemContent}
      
      {/* Trailing content or arrow */}
      {(trailing || showArrow) && (
        <div className={cn(
          'flex-shrink-0 ml-auto',
          selected ? 'text-blue-600' : 'text-slate-400'
        )}>
          {trailing}
          {showArrow && !trailing && (
            <ChevronRight className={cn(
              isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'
            )} />
          )}
        </div>
      )}
    </Component>
  )
}

// ----------------------------------------------------------------------------
// Specialized List Components
// ----------------------------------------------------------------------------

/**
 * CheckList - List with checkboxes
 */
export interface CheckListProps {
  items: Array<{ id: string; label: string; checked: boolean }>
  onChange?: (id: string, checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function CheckList({ items, onChange, disabled, className }: CheckListProps) {
  return (
    <List className={className}>
      {items.map((item) => (
        <ListItem
          key={item.id}
          leading={
            <div className={cn(
              'w-5 h-5 border-2 rounded flex items-center justify-center transition-colors',
              item.checked 
                ? 'bg-blue-500 border-blue-500' 
                : 'border-slate-300 bg-white'
            )}>
              {item.checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </div>
          }
          onClick={() => !disabled && onChange?.(item.id, !item.checked)}
          disabled={disabled}
        >
          {item.label}
        </ListItem>
      ))}
    </List>
  )
}

/**
 * SelectList - Single-select list
 */
export interface SelectListProps {
  items: Array<{ id: string; label: string; description?: string; icon?: React.ReactNode }>
  value?: string
  onChange?: (id: string) => void
  disabled?: boolean
  className?: string
}

export function SelectList({ items, value, onChange, disabled, className }: SelectListProps) {
  return (
    <List variant="card" divided className={className}>
      {items.map((item) => (
        <ListItem
          key={item.id}
          leading={item.icon}
          title={item.label}
          description={item.description}
          selected={value === item.id}
          onClick={() => !disabled && onChange?.(item.id)}
          disabled={disabled}
          trailing={
            value === item.id && (
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
            )
          }
        />
      ))}
    </List>
  )
}

/**
 * ActionList - List of clickable actions
 */
export interface ActionListItem {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  onClick: () => void
  destructive?: boolean
  disabled?: boolean
}

export interface ActionListProps {
  items: ActionListItem[]
  className?: string
}

export function ActionList({ items, className }: ActionListProps) {
  return (
    <List variant="card" divided className={className}>
      {items.map((item) => (
        <ListItem
          key={item.id}
          leading={item.icon}
          title={item.label}
          description={item.description}
          onClick={item.onClick}
          disabled={item.disabled}
          showArrow
          className={item.destructive ? 'text-red-600 hover:bg-red-50' : undefined}
        />
      ))}
    </List>
  )
}

/**
 * DescriptionList - Key-value pairs
 */
export interface DescriptionListProps {
  items: Array<{ term: string; description: React.ReactNode }>
  horizontal?: boolean
  className?: string
}

export function DescriptionList({ items, horizontal = false, className }: DescriptionListProps) {
  if (horizontal) {
    return (
      <dl className={cn('space-y-3', className)}>
        {items.map((item, index) => (
          <div key={index} className="flex gap-4">
            <dt className="font-medium text-slate-700 w-1/3 flex-shrink-0">
              {item.term}
            </dt>
            <dd className="text-slate-900 flex-1">
              {item.description}
            </dd>
          </div>
        ))}
      </dl>
    )
  }

  return (
    <dl className={cn('space-y-4', className)}>
      {items.map((item, index) => (
        <div key={index}>
          <dt className="text-sm font-medium text-slate-700 mb-1">
            {item.term}
          </dt>
          <dd className="text-slate-900">
            {item.description}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * TimelineList - Vertical timeline
 */
export interface TimelineItemData {
  id: string
  title: string
  description?: string
  timestamp?: string
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray'
}

export interface TimelineListProps {
  items: TimelineItemData[]
  className?: string
}

export function TimelineList({ items, className }: TimelineListProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    gray: 'bg-slate-400'
  }

  return (
    <div className={cn('space-y-0', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const color = item.color || 'blue'
        
        return (
          <div key={item.id} className="relative flex gap-4 pb-8">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-slate-200" />
            )}
            
            {/* Icon/dot */}
            <div className={cn(
              'relative z-10 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center',
              colorClasses[color]
            )}>
              {item.icon ? (
                <div className="text-white">
                  {item.icon}
                </div>
              ) : (
                <Circle className="w-2 h-2 fill-white text-white" />
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-medium text-slate-900">{item.title}</h4>
                {item.timestamp && (
                  <span className="text-xs text-slate-500 flex-shrink-0">
                    {item.timestamp}
                  </span>
                )}
              </div>
              {item.description && (
                <p className="text-sm text-slate-600">{item.description}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * PropertyList - Simple left/right key-value list (like iOS settings)
 */
export interface PropertyListItem {
  key: string
  label: string
  value: React.ReactNode
  href?: string
  onClick?: () => void
}

export interface PropertyListProps {
  items: PropertyListItem[]
  className?: string
  /** Show dividers between items */
  divided?: boolean
}

export function PropertyList({ items, className, divided = true }: PropertyListProps) {
  const isMobile = useIsMobile()

  return (
    <div className={cn(
      'bg-white rounded-lg border border-slate-200 overflow-hidden',
      divided && 'divide-y divide-slate-200',
      className
    )}>
      {items.map((item, index) => {
        const Component = item.href ? 'a' : item.onClick ? 'button' : 'div'
        const isInteractive = Boolean(item.href || item.onClick)
        const isFirst = index === 0
        const isLast = index === items.length - 1
        
        return (
          <Component
            key={item.key}
            href={item.href}
            onClick={item.onClick}
            className={cn(
              'flex items-center justify-between w-full text-left',
              isMobile ? 'px-3 py-2.5' : 'px-4 py-3',
              isInteractive && 'hover:bg-slate-50 cursor-pointer transition-colors',
              // Round corners only for first and last items
              isFirst && 'rounded-t-lg',
              isLast && 'rounded-b-lg'
            )}
          >
            <Text className={cn(
              'text-slate-700',
              isMobile ? 'text-sm' : 'text-base'
            )}>
              {item.label}
            </Text>
            <div className={cn(
              'flex items-center gap-2',
              isMobile ? 'text-sm' : 'text-base'
            )}>
              <Text className="text-slate-900 font-medium">{item.value}</Text>
              {isInteractive && <ChevronRight className="w-4 h-4 text-slate-400" />}
            </div>
          </Component>
        )
      })}
    </div>
  )
}

/**
 * GroupedList - List with section headers
 */
export interface GroupedListSection {
  id: string
  title: string
  items: React.ReactNode[]
}

export interface GroupedListProps {
  sections: GroupedListSection[]
  className?: string
}

export function GroupedList({ sections, className }: GroupedListProps) {
  const isMobile = useIsMobile()

  return (
    <Stack spacing={isMobile ? 'md' : 'lg'} className={className}>
      {sections.map((section) => (
        <Stack key={section.id} spacing="sm">
          <Text className={cn(
            'font-semibold text-slate-700 uppercase tracking-wide',
            isMobile ? 'text-xs px-2' : 'text-sm px-3'
          )}>
            {section.title}
          </Text>
          <List variant="card" divided>
            {section.items}
          </List>
        </Stack>
      ))}
    </Stack>
  )
}

/**
 * StepList - Ordered steps with numbers
 */
export interface StepListItem {
  id: string
  title: string
  description?: string
  completed?: boolean
  current?: boolean
}

export interface StepListProps {
  items: StepListItem[]
  className?: string
}

export function StepList({ items, className }: StepListProps) {
  const isMobile = useIsMobile()

  return (
    <div className={cn('space-y-0', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const stepNumber = index + 1
        
        return (
          <div key={item.id} className="relative flex gap-4 pb-6">
            {/* Connecting line */}
            {!isLast && (
              <div className={cn(
                'absolute top-8 bottom-0 w-0.5',
                isMobile ? 'left-4' : 'left-5',
                item.completed ? 'bg-blue-500' : 'bg-slate-200'
              )} />
            )}
            
            {/* Step number/check */}
            <div className={cn(
              'relative z-10 flex-shrink-0 rounded-full flex items-center justify-center font-semibold',
              isMobile ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base',
              item.completed && 'bg-blue-500 text-white',
              item.current && !item.completed && 'bg-blue-100 text-blue-700 ring-2 ring-blue-500',
              !item.completed && !item.current && 'bg-slate-100 text-slate-600'
            )}>
              {item.completed ? (
                <Check className={cn(isMobile ? 'w-4 h-4' : 'w-5 h-5')} strokeWidth={3} />
              ) : (
                stepNumber
              )}
            </div>
            
            {/* Content */}
            <Stack spacing="xs" className="flex-1 min-w-0 pt-1">
              <Text className={cn(
                'font-semibold',
                isMobile ? 'text-sm' : 'text-base',
                item.completed && 'text-slate-600',
                item.current && 'text-slate-900',
                !item.completed && !item.current && 'text-slate-500'
              )}>
                {item.title}
              </Text>
              {item.description && (
                <Text className={cn(
                  isMobile ? 'text-xs' : 'text-sm',
                  'text-slate-600'
                )}>
                  {item.description}
                </Text>
              )}
            </Stack>
          </div>
        )
      })}
    </div>
  )
}

/**
 * ContactList - List with avatars and contact info
 */
export interface ContactListItem {
  id: string
  name: string
  subtitle?: string
  avatar?: React.ReactNode
  initials?: string
  status?: 'online' | 'offline' | 'away'
  onClick?: () => void
}

export interface ContactListProps {
  items: ContactListItem[]
  className?: string
}

export function ContactList({ items, className }: ContactListProps) {
  const isMobile = useIsMobile()

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-slate-400',
    away: 'bg-yellow-500'
  }

  return (
    <List variant="card" divided className={className}>
      {items.map((contact) => (
        <ListItem
          key={contact.id}
          onClick={contact.onClick}
          leading={
            <div className="relative">
              {contact.avatar ? (
                contact.avatar
              ) : (
                <div className={cn(
                  'rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold',
                  isMobile ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
                )}>
                  {contact.initials || contact.name.charAt(0)}
                </div>
              )}
              {contact.status && (
                <div className={cn(
                  'absolute rounded-full ring-2 ring-white',
                  isMobile ? 'w-2.5 h-2.5 -bottom-0.5 -right-0.5' : 'w-3 h-3 -bottom-1 -right-1',
                  statusColors[contact.status]
                )} />
              )}
            </div>
          }
          title={contact.name}
          description={contact.subtitle}
        />
      ))}
    </List>
  )
}

/**
 * MenuList - Navigation menu list
 */
export interface MenuListItem {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: string | number
  href?: string
  onClick?: () => void
  active?: boolean
}

export interface MenuListProps {
  items: MenuListItem[]
  className?: string
}

export function MenuList({ items, className }: MenuListProps) {
  const isMobile = useIsMobile()

  return (
    <List variant="card" divided className={className}>
      {items.map((item) => (
        <ListItem
          key={item.id}
          href={item.href}
          onClick={item.onClick}
          leading={item.icon}
          title={item.label}
          selected={item.active}
          trailing={
            item.badge ? (
              <span className={cn(
                'rounded-full font-semibold',
                isMobile ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
                item.active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
              )}>
                {item.badge}
              </span>
            ) : undefined
          }
          showArrow={!item.badge}
        />
      ))}
    </List>
  )
}

// ----------------------------------------------------------------------------
// Exports
// ----------------------------------------------------------------------------

export default List
