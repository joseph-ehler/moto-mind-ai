'use client'

/**
 * Navigation Components
 * 
 * Premium navigation components for seamless user journeys
 * Breadcrumbs, Pagination, Tabs, Stepper, and more
 */

import React from 'react'
import { Stack, Flex } from '../primitives/Layout'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface BreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
  icon?: React.ReactNode
}

export interface TabItem {
  id: string
  label: string
  content?: React.ReactNode
  icon?: React.ReactNode
  badge?: string | number
  disabled?: boolean
}

export interface StepItem {
  id: string
  label: string
  description?: string
  status?: 'complete' | 'current' | 'upcoming' | 'error'
  icon?: React.ReactNode
}

// ============================================================================
// 1. BREADCRUMBS - Navigation trail
// ============================================================================

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  separator?: React.ReactNode
  maxItems?: number
  showHome?: boolean
  collapsed?: boolean
}

/**
 * Breadcrumbs - Show navigation path
 * 
 * @example
 * <Breadcrumbs
 *   items={[
 *     { label: 'Vehicles', href: '/vehicles' },
 *     { label: 'Honda Civic', href: '/vehicles/123' },
 *     { label: 'Maintenance' }
 *   ]}
 * />
 */
export function Breadcrumbs({
  items,
  separator,
  maxItems = 5,
  showHome = false,
  collapsed = false
}: BreadcrumbsProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(collapsed)

  const allItems = showHome
    ? [{ 
        label: 'Home', 
        href: '/', 
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        )
      } as BreadcrumbItem, ...items]
    : items

  const displayItems = isCollapsed && allItems.length > maxItems
    ? [allItems[0], { label: '...', onClick: () => setIsCollapsed(false) }, ...allItems.slice(-2)]
    : allItems

  const defaultSeparator = separator || (
    <svg className="w-4 h-4 text-black/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
      {displayItems.map((item, index) => {
        const isLast = index === displayItems.length - 1
        const isClickable = item.href || item.onClick

        return (
          <React.Fragment key={index}>
            {isClickable ? (
              <button
                onClick={item.onClick}
                className="flex items-center gap-1.5 text-black/60 hover:text-black transition-colors"
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ) : (
              <span className={`flex items-center gap-1.5 ${isLast ? 'text-black font-medium' : 'text-black/60'}`}>
                {item.icon}
                {item.label}
              </span>
            )}
            {!isLast && (
              <span className="text-black/30">{defaultSeparator}</span>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

// ============================================================================
// 2. PAGINATION - Page navigation
// ============================================================================

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showFirstLast?: boolean
  showPrevNext?: boolean
  maxPageButtons?: number
  compact?: boolean
  showPageInfo?: boolean
}

/**
 * Pagination - Navigate through pages
 * 
 * @example
 * <Pagination
 *   currentPage={5}
 *   totalPages={20}
 *   onPageChange={setPage}
 * />
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showPrevNext = true,
  maxPageButtons = 7,
  compact = false,
  showPageInfo = true
}: PaginationProps) {
  const getPageNumbers = () => {
    if (totalPages <= maxPageButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const halfMax = Math.floor(maxPageButtons / 2)
    let startPage = Math.max(1, currentPage - halfMax)
    let endPage = Math.min(totalPages, currentPage + halfMax)

    if (currentPage <= halfMax) {
      endPage = maxPageButtons
    } else if (currentPage >= totalPages - halfMax) {
      startPage = totalPages - maxPageButtons + 1
    }

    const pages = []
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    // Add ellipsis
    if (startPage > 1) {
      pages.unshift('...')
      pages.unshift(1)
    }
    if (endPage < totalPages) {
      pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

  const pages = getPageNumbers()

  if (compact) {
    return (
      <Flex align="center" gap="sm" className="text-sm">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-black/60">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </Flex>
    )
  }

  return (
    <nav aria-label="Pagination" className="flex flex-col sm:flex-row items-center gap-4">
      <Flex align="center" gap="xs">
        {showFirstLast && (
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="First page"
          >
            First
          </button>
        )}
        {showPrevNext && (
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <Flex align="center" gap="xs">
          {pages.map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-black/40">...</span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={`
                  min-w-[40px] h-10 px-3 rounded-lg text-sm font-medium transition-all
                  ${currentPage === page
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'hover:bg-slate-100 text-black/70'
                  }
                `}
                aria-label={`Page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            )
          ))}
        </Flex>

        {showPrevNext && (
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {showFirstLast && (
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Last page"
          >
            Last
          </button>
        )}
      </Flex>

      {showPageInfo && (
        <span className="text-sm text-black/60">
          Page {currentPage} of {totalPages}
        </span>
      )}
    </nav>
  )
}

// ============================================================================
// 3. TABS - Horizontal tabs
// ============================================================================

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onTabChange: (tabId: string) => void
  variant?: 'line' | 'pills' | 'enclosed'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

/**
 * Tabs - Horizontal tab navigation
 * 
 * @example
 * <Tabs
 *   tabs={[
 *     { id: '1', label: 'Overview', content: <Overview /> },
 *     { id: '2', label: 'Details', content: <Details /> }
 *   ]}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 * />
 */
export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  variant = 'line',
  size = 'md',
  fullWidth = false
}: TabsProps) {
  const sizeClasses = {
    sm: 'text-sm px-3 py-2',
    md: 'text-sm px-4 py-2.5',
    lg: 'text-base px-5 py-3'
  }

  const variantClasses = {
    line: {
      container: 'border-b border-black/10',
      tab: `${sizeClasses[size]} relative transition-colors hover:text-black`,
      active: 'text-black font-medium',
      inactive: 'text-black/60',
      indicator: 'absolute bottom-0 left-0 right-0 h-0.5 bg-primary'
    },
    pills: {
      container: 'bg-slate-100 rounded-lg p-1',
      tab: `${sizeClasses[size]} rounded-md transition-all`,
      active: 'bg-white text-black shadow-sm font-medium',
      inactive: 'text-black/60 hover:text-black',
      indicator: ''
    },
    enclosed: {
      container: 'border-b border-black/10',
      tab: `${sizeClasses[size]} border-t border-x border-black/10 rounded-t-lg transition-colors`,
      active: 'bg-white text-black font-medium border-b-white -mb-px',
      inactive: 'text-black/60 hover:text-black bg-slate-50',
      indicator: ''
    }
  }

  const activeContent = tabs.find(tab => tab.id === activeTab)?.content

  return (
    <div>
      <div className={variantClasses[variant].container}>
        <div className={`flex ${fullWidth ? 'w-full' : 'gap-1'}`} role="tablist">
          {tabs.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && onTabChange(tab.id)}
              className={`
                ${variantClasses[variant].tab}
                ${activeTab === tab.id ? variantClasses[variant].active : variantClasses[variant].inactive}
                ${fullWidth ? 'flex-1' : ''}
                ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                relative
              `}
            >
              <Flex align="center" justify="center" gap="sm">
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-medium">
                    {tab.badge}
                  </span>
                )}
              </Flex>
              {variant === 'line' && activeTab === tab.id && (
                <div className={variantClasses[variant].indicator} />
              )}
            </button>
          ))}
        </div>
      </div>

      {activeContent && (
        <div
          role="tabpanel"
          id={`panel-${activeTab}`}
          className="py-6 animate-in fade-in duration-200"
        >
          {activeContent}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 4. VERTICAL TABS - Sidebar tabs
// ============================================================================

export interface VerticalTabsProps extends Omit<TabsProps, 'fullWidth'> {
  width?: string
}

/**
 * VerticalTabs - Sidebar tab navigation
 * 
 * @example
 * <VerticalTabs
 *   tabs={tabs}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 * />
 */
export function VerticalTabs({
  tabs,
  activeTab,
  onTabChange,
  variant = 'pills',
  size = 'md',
  width = '240px'
}: VerticalTabsProps) {
  const sizeClasses = {
    sm: 'text-sm px-3 py-2',
    md: 'text-sm px-4 py-2.5',
    lg: 'text-base px-5 py-3'
  }

  const activeContent = tabs.find(tab => tab.id === activeTab)?.content

  return (
    <div className="flex gap-6">
      <div style={{ width }} className="flex-shrink-0">
        <div role="tablist">
          <Stack spacing="xs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                disabled={tab.disabled}
                onClick={() => !tab.disabled && onTabChange(tab.id)}
                className={`
                  ${sizeClasses[size]}
                  w-full text-left rounded-lg transition-all
                  ${activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-sm font-medium'
                    : 'text-black/70 hover:bg-slate-100'
                  }
                  ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <Flex align="center" justify="between" gap="md">
                  <Flex align="center" gap="sm" className="flex-1 min-w-0">
                    {tab.icon}
                    <span className="truncate">{tab.label}</span>
                  </Flex>
                  {tab.badge && (
                    <span className="px-2 py-0.5 text-xs bg-white/20 rounded-full font-medium flex-shrink-0">
                      {tab.badge}
                    </span>
                  )}
                </Flex>
              </button>
            ))}
          </Stack>
        </div>
      </div>

      {activeContent && (
        <div
          role="tabpanel"
          id={`panel-${activeTab}`}
          className="flex-1 animate-in fade-in duration-200"
        >
          {activeContent}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 5. STEPPER - Multi-step progress
// ============================================================================

export interface StepperProps {
  steps: StepItem[]
  orientation?: 'horizontal' | 'vertical'
  clickable?: boolean
  onStepClick?: (stepId: string) => void
}

/**
 * Stepper - Show progress through multi-step process
 * 
 * @example
 * <Stepper
 *   steps={[
 *     { id: '1', label: 'Details', status: 'complete' },
 *     { id: '2', label: 'Payment', status: 'current' },
 *     { id: '3', label: 'Confirm', status: 'upcoming' }
 *   ]}
 * />
 */
export function Stepper({
  steps,
  orientation = 'horizontal',
  clickable = false,
  onStepClick
}: StepperProps) {
  const statusConfig = {
    complete: {
      bg: 'bg-green-600',
      border: 'border-green-600',
      text: 'text-green-600',
      icon: (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    current: {
      bg: 'bg-primary',
      border: 'border-primary',
      text: 'text-primary',
      icon: null
    },
    upcoming: {
      bg: 'bg-slate-200',
      border: 'border-slate-300',
      text: 'text-black/40',
      icon: null
    },
    error: {
      bg: 'bg-red-600',
      border: 'border-red-600',
      text: 'text-red-600',
      icon: (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    }
  }

  if (orientation === 'vertical') {
    return (
      <div className="space-y-4">
        {steps.map((step, index) => {
          const config = statusConfig[step.status || 'upcoming']
          const isClickable = clickable && step.status === 'complete'

          return (
            <div key={step.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => isClickable && onStepClick?.(step.id)}
                  disabled={!isClickable}
                  className={`
                    w-10 h-10 rounded-full border-2 ${config.border} ${config.bg}
                    flex items-center justify-center flex-shrink-0
                    ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
                    transition-all
                  `}
                >
                  {config.icon || (
                    <span className="text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                  )}
                </button>
                {index < steps.length - 1 && (
                  <div className={`w-0.5 h-full min-h-[40px] ${config.bg} mt-2`} />
                )}
              </div>

              <div className="flex-1 pb-8">
                <h4 className={`font-semibold ${config.text}`}>{step.label}</h4>
                {step.description && (
                  <p className="text-sm text-black/60 mt-1">{step.description}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex items-center">
      {steps.map((step, index) => {
        const config = statusConfig[step.status || 'upcoming']
        const isClickable = clickable && step.status === 'complete'

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={`
                  w-10 h-10 rounded-full border-2 ${config.border} ${config.bg}
                  flex items-center justify-center
                  ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
                  transition-all
                `}
              >
                {config.icon || (
                  <span className="text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                )}
              </button>
              <div className="text-center">
                <p className={`text-sm font-medium ${config.text}`}>{step.label}</p>
                {step.description && (
                  <p className="text-xs text-black/60 mt-1">{step.description}</p>
                )}
              </div>
            </div>

            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 ${config.bg}`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ============================================================================
// ELITE FEATURES - Advanced Navigation
// ============================================================================

// 6. SIDEBAR NAVIGATION - Collapsible sidebar with nested items
export interface SidebarItem {
  id: string
  label: string
  icon?: React.ReactNode
  href?: string
  onClick?: () => void
  badge?: string | number
  children?: SidebarItem[]
}

export interface SidebarNavigationProps {
  items: SidebarItem[]
  activeId?: string
  onItemClick?: (id: string) => void
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export function SidebarNavigation({
  items,
  activeId,
  onItemClick,
  collapsible = true,
  defaultCollapsed = false
}: SidebarNavigationProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed)
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const renderItem = (item: SidebarItem, level = 0) => {
    const isActive = item.id === activeId
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.id)

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id)
            }
            item.onClick?.()
            onItemClick?.(item.id)
          }}
          className={`
            w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg transition-all
            ${isActive ? 'bg-primary text-primary-foreground font-medium' : 'text-black/70 hover:bg-slate-100'}
            ${level > 0 ? 'ml-4' : ''}
          `}
        >
          <Flex align="center" gap="sm" className="flex-1 min-w-0">
            {!collapsed && item.icon && (
              <span className={isActive ? 'text-primary-foreground' : 'text-black/40'}>
                {item.icon}
              </span>
            )}
            {!collapsed && <span className="truncate">{item.label}</span>}
            {collapsed && item.icon && (
              <span className="mx-auto">{item.icon}</span>
            )}
          </Flex>
          {!collapsed && (
            <Flex align="center" gap="sm">
              {item.badge && (
                <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-medium">
                  {item.badge}
                </span>
              )}
              {hasChildren && (
                <svg
                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </Flex>
          )}
        </button>

        {!collapsed && hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <nav className={`${collapsed ? 'w-16' : 'w-64'} transition-all duration-300`}>
      <div className="space-y-1">
        {collapsible && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 mb-4 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        )}
        {items.map(item => renderItem(item))}
      </div>
    </nav>
  )
}

// 7. QUICK LINKS - Grid of link cards
export interface QuickLink {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
  badge?: string
}

export interface QuickLinksProps {
  links: QuickLink[]
  columns?: 2 | 3 | 4
}

export function QuickLinks({ links, columns = 3 }: QuickLinksProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {links.map(link => (
        <button
          key={link.id}
          onClick={link.onClick}
          className="relative bg-white border border-black/5 rounded-xl p-6 hover:shadow-lg hover:border-primary/20 transition-all text-left group"
        >
          {link.badge && (
            <span className="absolute top-3 right-3 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
              {link.badge}
            </span>
          )}
          <Stack spacing="md">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform [&>svg]:w-6 [&>svg]:h-6">
              {link.icon}
            </div>
            <div>
              <h3 className="font-semibold text-black mb-1">{link.label}</h3>
              {link.description && (
                <p className="text-sm text-black/60">{link.description}</p>
              )}
            </div>
          </Stack>
        </button>
      ))}
    </div>
  )
}

// 8. PROGRESS NAV - Navigation with progress indicator
export interface ProgressNavProps {
  items: Array<{ id: string; label: string; completed: boolean }>
  activeId: string
  onNavigate: (id: string) => void
}

export function ProgressNav({ items, activeId, onNavigate }: ProgressNavProps) {
  const completedCount = items.filter(item => item.completed).length
  const progressPercent = (completedCount / items.length) * 100

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-black/60">Progress</span>
          <span className="font-medium text-black">{completedCount} of {items.length} completed</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Navigation Items */}
      <Stack spacing="xs">
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left
              ${item.id === activeId ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-100'}
            `}
          >
            <div className={`
              w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
              ${item.completed
                ? 'bg-green-600 border-green-600'
                : item.id === activeId
                ? 'border-primary-foreground'
                : 'border-slate-300'
              }
            `}>
              {item.completed ? (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-xs">{index + 1}</span>
              )}
            </div>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </Stack>
    </div>
  )
}

// 9. CONTEXT MENU - Right-click menu
export interface ContextMenuItem {
  id: string
  label: string
  icon?: React.ReactNode
  onClick: () => void
  danger?: boolean
  divider?: boolean
}

export interface ContextMenuProps {
  items: ContextMenuItem[]
  trigger: React.ReactNode
}

export function ContextMenu({ items, trigger }: ContextMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const menuRef = React.useRef<HTMLDivElement>(null)

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setPosition({ x: e.clientX, y: e.clientY })
    setIsOpen(true)
  }

  React.useEffect(() => {
    const handleClick = () => setIsOpen(false)
    const handleScroll = () => setIsOpen(false)
    
    if (isOpen) {
      document.addEventListener('click', handleClick)
      document.addEventListener('scroll', handleScroll)
    }
    
    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('scroll', handleScroll)
    }
  }, [isOpen])

  return (
    <>
      <div onContextMenu={handleContextMenu}>
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          className="fixed z-50 bg-white border border-black/10 rounded-lg shadow-xl py-1 min-w-[200px] animate-in fade-in zoom-in-95 duration-100"
          style={{ left: position.x, top: position.y }}
        >
          {items.map(item => (
            item.divider ? (
              <div key={item.id} className="my-1 border-t border-black/10" />
            ) : (
              <button
                key={item.id}
                onClick={() => {
                  item.onClick()
                  setIsOpen(false)
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-2 text-left transition-colors
                  ${item.danger
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-black hover:bg-slate-100'
                  }
                `}
              >
                {item.icon && (
                  <span className="[&>svg]:w-4 [&>svg]:h-4">
                    {item.icon}
                  </span>
                )}
                <span className="text-sm">{item.label}</span>
              </button>
            )
          ))}
        </div>
      )}
    </>
  )
}

// 10. PAGE HEADER - Consistent page header with breadcrumbs and actions
export interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
    icon?: React.ReactNode
  }>
  tabs?: TabItem[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  tabs,
  activeTab,
  onTabChange
}: PageHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} />
      )}

      {/* Title & Actions */}
      <Flex align="start" justify="between" gap="lg">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-black mb-2">{title}</h1>
          {description && (
            <p className="text-black/60">{description}</p>
          )}
        </div>

        {actions && actions.length > 0 && (
          <Flex align="center" gap="sm">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`
                  px-4 py-2.5 rounded-lg font-medium text-sm transition-all inline-flex items-center gap-2
                  ${action.variant === 'primary'
                    ? 'bg-primary text-primary-foreground hover:opacity-90'
                    : 'border border-black/10 hover:bg-slate-100'
                  }
                `}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
          </Flex>
        )}
      </Flex>

      {/* Tabs */}
      {tabs && tabs.length > 0 && activeTab && onTabChange && (
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          variant="line"
        />
      )}
    </div>
  )
}

// ============================================================================
// MEGA MENU COMPONENTS
// ============================================================================

// Pre-built mega menu layouts
export interface MegaMenuColumn {
  title: string
  items: Array<{
    label: string
    description?: string
    icon?: React.ReactNode
    href?: string
    onClick?: () => void
    badge?: string
  }>
}

export interface MegaMenuProps {
  columns: MegaMenuColumn[]
  featured?: {
    title: string
    description: string
    image?: string
    action: {
      label: string
      onClick: () => void
    }
  }
}

export function MegaMenu({ columns, featured }: MegaMenuProps) {
  return (
    <div className="p-6">
      <div className="grid grid-cols-4 gap-6">
        {/* Columns */}
        {columns.map((column, idx) => (
          <div key={idx}>
            <h3 className="text-xs font-semibold text-black/40 uppercase tracking-wider mb-3">
              {column.title}
            </h3>
            <Stack spacing="xs">
              {column.items.map((item, itemIdx) => (
                <button
                  key={itemIdx}
                  onClick={item.onClick}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <Flex align="start" gap="sm">
                    {item.icon && (
                      <div className="text-black/40 group-hover:text-primary transition-colors [&>svg]:w-5 [&>svg]:h-5 flex-shrink-0 mt-0.5">
                        {item.icon}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Flex align="center" gap="sm" className="mb-0.5">
                        <span className="text-sm font-medium text-black group-hover:text-primary transition-colors">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded font-medium">
                            {item.badge}
                          </span>
                        )}
                      </Flex>
                      {item.description && (
                        <p className="text-xs text-black/60 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </Flex>
                </button>
              ))}
            </Stack>
          </div>
        ))}

        {/* Featured Section */}
        {featured && (
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4">
            <Stack spacing="md">
              {featured.image && (
                <div className="w-full h-32 bg-slate-200 rounded-lg overflow-hidden">
                  <img src={featured.image} alt={featured.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-black mb-1">{featured.title}</h3>
                <p className="text-sm text-black/60 mb-3">{featured.description}</p>
                <button
                  onClick={featured.action.onClick}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  {featured.action.label}
                </button>
              </div>
            </Stack>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// COMMAND PALETTE
// ============================================================================

export interface CommandItem {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  keywords?: string[]
  onSelect: () => void
  shortcut?: string
  category?: string
}

export interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  commands: CommandItem[]
  recent?: CommandItem[]
  placeholder?: string
  maxRecent?: number
  emptyMessage?: string
  categories?: Record<string, string> // category id -> label
}

export function CommandPalette({
  open,
  onClose,
  commands,
  recent = [],
  placeholder = 'Search commands...',
  maxRecent = 5,
  emptyMessage = 'No commands found',
  categories
}: CommandPaletteProps) {
  const [search, setSearch] = React.useState('')
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Filter commands based on search
  const filteredCommands = React.useMemo(() => {
    if (!search.trim()) {
      // Show recent commands when no search
      return recent.slice(0, maxRecent)
    }

    const searchLower = search.toLowerCase()
    return commands.filter(cmd => {
      const labelMatch = cmd.label.toLowerCase().includes(searchLower)
      const descMatch = cmd.description?.toLowerCase().includes(searchLower)
      const keywordMatch = cmd.keywords?.some(k => k.toLowerCase().includes(searchLower))
      return labelMatch || descMatch || keywordMatch
    })
  }, [search, commands, recent, maxRecent])

  // Group commands by category
  const groupedCommands = React.useMemo(() => {
    if (!categories) return { '': filteredCommands }

    const groups: Record<string, CommandItem[]> = {}
    filteredCommands.forEach(cmd => {
      const category = cmd.category || ''
      if (!groups[category]) groups[category] = []
      groups[category].push(cmd)
    })
    return groups
  }, [filteredCommands, categories])

  // Reset selection when results change
  React.useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  // Focus input when opened
  React.useEffect(() => {
    if (open) {
      inputRef.current?.focus()
      setSearch('')
      setSelectedIndex(0)
    }
  }, [open])

  // Keyboard navigation
  React.useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const cmd = filteredCommands[selectedIndex]
        if (cmd) {
          cmd.onSelect()
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, filteredCommands, selectedIndex, onClose])

  // Scroll selected item into view
  React.useEffect(() => {
    const selected = document.querySelector(`[data-command-index="${selectedIndex}"]`)
    selected?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedIndex])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white rounded-xl shadow-2xl border border-black/10 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-black/10">
            <svg className="w-5 h-5 text-black/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="flex-1 text-base outline-none bg-transparent placeholder:text-black/40"
            />
            <kbd className="hidden sm:inline-flex px-2 py-1 text-xs font-medium bg-slate-100 text-black/60 rounded border border-black/10">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="py-12 text-center text-black/40 text-sm">
                {emptyMessage}
              </div>
            ) : (
              <>
                {!search && recent.length > 0 && (
                  <div className="px-4 py-2 text-xs font-semibold text-black/40 uppercase tracking-wider">
                    Recent
                  </div>
                )}

                {categories ? (
                  Object.entries(groupedCommands).map(([categoryId, items]) => (
                    items.length > 0 && (
                      <div key={categoryId}>
                        {categoryId && (
                          <div className="px-4 py-2 text-xs font-semibold text-black/40 uppercase tracking-wider">
                            {categories[categoryId] || categoryId}
                          </div>
                        )}
                        {items.map((cmd, idx) => {
                          const globalIndex = filteredCommands.indexOf(cmd)
                          return (
                            <CommandPaletteItem
                              key={cmd.id}
                              command={cmd}
                              selected={globalIndex === selectedIndex}
                              index={globalIndex}
                              onClick={() => {
                                cmd.onSelect()
                                onClose()
                              }}
                            />
                          )
                        })}
                      </div>
                    )
                  ))
                ) : (
                  filteredCommands.map((cmd, idx) => (
                    <CommandPaletteItem
                      key={cmd.id}
                      command={cmd}
                      selected={idx === selectedIndex}
                      index={idx}
                      onClick={() => {
                        cmd.onSelect()
                        onClose()
                      }}
                    />
                  ))
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-black/10 flex items-center justify-between text-xs text-black/40">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">↑↓</kbd> Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">↵</kbd> Select
              </span>
            </div>
            <span>Powered by MotoMind</span>
          </div>
        </div>
      </div>
    </>
  )
}

// Command Palette Item Component
interface CommandPaletteItemProps {
  command: CommandItem
  selected: boolean
  index: number
  onClick: () => void
}

function CommandPaletteItem({ command, selected, index, onClick }: CommandPaletteItemProps) {
  return (
    <button
      data-command-index={index}
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
        ${selected ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50'}
      `}
    >
      {command.icon && (
        <div className={`flex-shrink-0 [&>svg]:w-5 [&>svg]:h-5 ${selected ? 'text-primary' : 'text-black/40'}`}>
          {command.icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{command.label}</div>
        {command.description && (
          <div className={`text-xs mt-0.5 ${selected ? 'text-primary/70' : 'text-black/60'}`}>
            {command.description}
          </div>
        )}
      </div>
      {command.shortcut && (
        <kbd className="hidden sm:inline-flex px-2 py-1 text-xs font-medium bg-slate-100 text-black/60 rounded border border-black/10">
          {command.shortcut}
        </kbd>
      )}
    </button>
  )
}

// Hook for global keyboard shortcut
export function useCommandPalette() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return { open, setOpen }
}

// ============================================================================
// TABLE OF CONTENTS
// ============================================================================

export interface TocHeading {
  id: string
  text: string
  level: number // 1, 2, 3 for h1, h2, h3
}

export interface TableOfContentsProps {
  headings?: TocHeading[]
  activeId?: string
  onHeadingClick?: (id: string) => void
  sticky?: boolean
  title?: string
  showProgress?: boolean
  autoDetect?: boolean // Auto-detect headings from DOM
  containerSelector?: string // Container to search for headings
  offset?: number // Scroll offset for sticky headers
}

export function TableOfContents({
  headings: propHeadings,
  activeId: propActiveId,
  onHeadingClick,
  sticky = true,
  title = 'On this page',
  showProgress = false,
  autoDetect = true,
  containerSelector = 'main',
  offset = 100
}: TableOfContentsProps) {
  const [headings, setHeadings] = React.useState<TocHeading[]>(propHeadings || [])
  const [activeId, setActiveId] = React.useState<string | undefined>(propActiveId)

  // Auto-detect headings from DOM
  React.useEffect(() => {
    if (!autoDetect || propHeadings) return

    const container = document.querySelector(containerSelector)
    if (!container) return

    const detectedHeadings: TocHeading[] = []
    const headingElements = container.querySelectorAll('h1, h2, h3, h4')

    headingElements.forEach((heading) => {
      const id = heading.id || heading.textContent?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || ''
      if (!heading.id && id) {
        heading.id = id
      }

      detectedHeadings.push({
        id: heading.id || id,
        text: heading.textContent || '',
        level: parseInt(heading.tagName.charAt(1))
      })
    })

    setHeadings(detectedHeadings)
  }, [autoDetect, propHeadings, containerSelector])

  // Track active section on scroll
  React.useEffect(() => {
    if (propActiveId !== undefined) {
      setActiveId(propActiveId)
      return
    }

    const scrollContainer = containerSelector ? document.querySelector(containerSelector) : null
    const element = scrollContainer || window

    const handleScroll = () => {
      const headingElements = headings.map(h => document.getElementById(h.id)).filter(Boolean) as HTMLElement[]
      
      // Find the heading that's currently in view
      let currentId = ''
      
      if (scrollContainer) {
        // For scrolling containers, calculate position relative to container
        const containerRect = scrollContainer.getBoundingClientRect()
        for (const headingElement of headingElements) {
          const rect = headingElement.getBoundingClientRect()
          const relativeTop = rect.top - containerRect.top
          if (relativeTop <= offset + 10) {
            currentId = headingElement.id
          } else {
            break
          }
        }
      } else {
        // For window scrolling
        for (const headingElement of headingElements) {
          const rect = headingElement.getBoundingClientRect()
          if (rect.top <= offset + 10) {
            currentId = headingElement.id
          } else {
            break
          }
        }
      }

      if (currentId) {
        setActiveId(currentId)
      } else if (headings.length > 0) {
        setActiveId(headings[0].id)
      }
    }

    handleScroll() // Initial check
    element.addEventListener('scroll', handleScroll, { passive: true })
    return () => element.removeEventListener('scroll', handleScroll)
  }, [headings, propActiveId, offset, containerSelector])

  // Scroll to heading
  const scrollToHeading = (id: string) => {
    const headingElement = document.getElementById(id)
    if (!headingElement) return

    const scrollContainer = containerSelector ? document.querySelector(containerSelector) : null

    if (scrollContainer) {
      // Scroll within container
      const containerRect = scrollContainer.getBoundingClientRect()
      const headingRect = headingElement.getBoundingClientRect()
      const relativeTop = headingRect.top - containerRect.top + scrollContainer.scrollTop - offset
      
      scrollContainer.scrollTo({ top: relativeTop, behavior: 'smooth' })
    } else {
      // Scroll window
      const top = headingElement.getBoundingClientRect().top + window.pageYOffset - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
    
    onHeadingClick?.(id)
  }

  // Calculate progress
  const progress = React.useMemo(() => {
    if (!showProgress || headings.length === 0) return 0
    const currentIndex = headings.findIndex(h => h.id === activeId)
    return currentIndex >= 0 ? ((currentIndex + 1) / headings.length) * 100 : 0
  }, [headings, activeId, showProgress])

  if (headings.length === 0) return null

  return (
    <nav
      className={`
        ${sticky ? 'sticky top-24' : ''}
        w-full max-w-[240px] flex-shrink-0
      `}
      aria-label="Table of contents"
    >
      <div className="space-y-3">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-black">{title}</h2>
          {showProgress && (
            <span className="text-xs text-black/40">{Math.round(progress)}%</span>
          )}
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Headings List */}
        <div className="space-y-1 border-l-2 border-black/10 pl-3">
          {headings.map((heading) => {
            const isActive = heading.id === activeId
            const indent = (heading.level - 1) * 12 // px indent per level

            return (
              <button
                key={heading.id}
                onClick={() => scrollToHeading(heading.id)}
                className={`
                  w-full text-left text-sm transition-colors py-1.5 px-2 -ml-2 rounded
                  ${isActive
                    ? 'text-primary font-medium bg-primary/5'
                    : 'text-black/60 hover:text-black hover:bg-slate-50'
                  }
                `}
                style={{ paddingLeft: `${8 + indent}px` }}
              >
                {heading.text}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

// Hook to use with TableOfContents
export function useTableOfContents(containerRef?: React.RefObject<HTMLElement>) {
  const [headings, setHeadings] = React.useState<TocHeading[]>([])

  React.useEffect(() => {
    const container = containerRef?.current || document.querySelector('main')
    if (!container) return

    const observer = new MutationObserver(() => {
      const detectedHeadings: TocHeading[] = []
      const headingElements = container.querySelectorAll('h1, h2, h3, h4')

      headingElements.forEach((heading) => {
        const id = heading.id || heading.textContent?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || ''
        if (!heading.id && id) {
          heading.id = id
        }

        detectedHeadings.push({
          id: heading.id || id,
          text: heading.textContent || '',
          level: parseInt(heading.tagName.charAt(1))
        })
      })

      setHeadings(detectedHeadings)
    })

    // Initial detection
    observer.observe(container, { childList: true, subtree: true })

    // Trigger initial
    const event = new Event('mutation')
    container.dispatchEvent(event)

    return () => observer.disconnect()
  }, [containerRef])

  return headings
}

// ============================================================================
// SCROLL PROGRESS
// ============================================================================

export interface ScrollProgressProps {
  color?: string
  height?: number
  backgroundColor?: string
  position?: 'top' | 'bottom'
  showPercentage?: boolean
  smoothing?: number // 0-1, higher = smoother but more lag
  zIndex?: number
  container?: string // CSS selector for container to track
}

export function ScrollProgress({
  color = 'hsl(var(--primary))',
  height = 3,
  backgroundColor = 'transparent',
  position = 'top',
  showPercentage = false,
  smoothing = 0.1,
  zIndex = 50,
  container
}: ScrollProgressProps) {
  const [progress, setProgress] = React.useState(0)
  const [displayProgress, setDisplayProgress] = React.useState(0)

  // Track scroll progress
  React.useEffect(() => {
    const element = container ? document.querySelector(container) : window

    const handleScroll = () => {
      let scrollTop: number
      let scrollHeight: number
      let clientHeight: number

      if (container && element && element !== window) {
        const el = element as HTMLElement
        scrollTop = el.scrollTop
        scrollHeight = el.scrollHeight
        clientHeight = el.clientHeight
      } else {
        scrollTop = window.pageYOffset || document.documentElement.scrollTop
        scrollHeight = document.documentElement.scrollHeight
        clientHeight = document.documentElement.clientHeight
      }

      const totalScrollable = scrollHeight - clientHeight
      const scrolled = totalScrollable > 0 ? (scrollTop / totalScrollable) * 100 : 0
      setProgress(Math.min(100, Math.max(0, scrolled)))
    }

    handleScroll() // Initial calculation

    if (element) {
      element.addEventListener('scroll', handleScroll, { passive: true })
      window.addEventListener('resize', handleScroll, { passive: true })
    }

    return () => {
      if (element) {
        element.removeEventListener('scroll', handleScroll)
        window.removeEventListener('resize', handleScroll)
      }
    }
  }, [container])

  // Smooth the progress animation
  React.useEffect(() => {
    const animate = () => {
      setDisplayProgress(prev => {
        const diff = progress - prev
        const change = diff * smoothing
        return Math.abs(diff) < 0.1 ? progress : prev + change
      })
    }

    const rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [progress, smoothing])

  return (
    <>
      {/* Progress Bar */}
      <div
        className={`fixed left-0 right-0 ${position === 'top' ? 'top-0' : 'bottom-0'}`}
        style={{
          height: `${height}px`,
          backgroundColor,
          zIndex
        }}
        role="progressbar"
        aria-valuenow={Math.round(displayProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Reading progress"
      >
        <div
          className="h-full transition-all duration-100"
          style={{
            width: `${displayProgress}%`,
            backgroundColor: color
          }}
        />
      </div>

      {/* Optional Percentage Display */}
      {showPercentage && (
        <div
          className={`fixed right-4 ${position === 'top' ? 'top-4' : 'bottom-4'} bg-white/90 backdrop-blur-sm border border-black/10 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg`}
          style={{ zIndex: zIndex + 1 }}
        >
          {Math.round(displayProgress)}%
        </div>
      )}
    </>
  )
}

// Alternative: Circular progress indicator
export interface CircularScrollProgressProps {
  size?: number
  strokeWidth?: number
  color?: string
  backgroundColor?: string
  showPercentage?: boolean
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  zIndex?: number
}

export function CircularScrollProgress({
  size = 48,
  strokeWidth = 3,
  color = 'hsl(var(--primary))',
  backgroundColor = 'rgb(226, 232, 240)',
  showPercentage = true,
  position = 'bottom-right',
  zIndex = 40
}: CircularScrollProgressProps) {
  const [progress, setProgress] = React.useState(0)

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = document.documentElement.clientHeight
      const totalScrollable = scrollHeight - clientHeight
      const scrolled = totalScrollable > 0 ? (scrollTop / totalScrollable) * 100 : 0
      setProgress(Math.min(100, Math.max(0, scrolled)))
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  }

  return (
    <div
      className={`fixed ${positionClasses[position]} bg-white/90 backdrop-blur-sm border border-black/10 rounded-full shadow-lg p-2`}
      style={{ zIndex }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-black">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  )
}

// ============================================================================
// BACK TO TOP
// ============================================================================

export interface BackToTopProps {
  threshold?: number // Show button after scrolling this many pixels
  smooth?: boolean
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  size?: 'sm' | 'md' | 'lg'
  label?: string
  showLabel?: boolean
  icon?: React.ReactNode
  color?: string
  container?: string // CSS selector for container
}

export function BackToTop({
  threshold = 300,
  smooth = true,
  position = 'bottom-right',
  size = 'md',
  label = 'Back to top',
  showLabel = false,
  icon,
  color,
  container
}: BackToTopProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const element = container ? document.querySelector(container) : window

    const handleScroll = () => {
      const scrollTop = container && element && element !== window
        ? (element as HTMLElement).scrollTop
        : window.pageYOffset || document.documentElement.scrollTop

      setIsVisible(scrollTop > threshold)
    }

    handleScroll() // Initial check

    if (element) {
      element.addEventListener('scroll', handleScroll, { passive: true })
    }

    return () => {
      if (element) {
        element.removeEventListener('scroll', handleScroll)
      }
    }
  }, [threshold, container])

  const scrollToTop = () => {
    const element = container ? document.querySelector(container) : window

    if (element) {
      if (element === window) {
        window.scrollTo({
          top: 0,
          behavior: smooth ? 'smooth' : 'auto'
        })
      } else {
        (element as HTMLElement).scrollTo({
          top: 0,
          behavior: smooth ? 'smooth' : 'auto'
        })
      }
    }
  }

  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-14 h-14 text-lg'
  }

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2'
  }

  const defaultIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  )

  if (!isVisible) return null

  // Use sticky positioning for containers so it stays in view while scrolling
  const positioningClass = container ? 'sticky' : 'fixed'

  return (
    <button
      onClick={scrollToTop}
      className={`
        ${positioningClass} ${positionClasses[position]} ${sizeClasses[size]}
        bg-white hover:bg-slate-50 active:scale-95
        border border-black/10 rounded-full shadow-lg
        flex items-center justify-center gap-2
        transition-all duration-200 hover:shadow-xl
        animate-in fade-in slide-in-from-bottom-4 duration-300
        ${container ? 'z-10' : 'z-40'}
      `}
      style={color ? { backgroundColor: color } : undefined}
      aria-label={label}
    >
      {icon || defaultIcon}
      {showLabel && <span className="pr-2 text-sm font-medium">{label}</span>}
    </button>
  )
}

// ============================================================================
// RESPONSIVE NAVIGATION BARS
// ============================================================================

// 11. TOP NAV - Desktop navigation bar
export interface TopNavItem {
  id: string
  label: string
  href?: string
  onClick?: () => void
  badge?: string | number
  children?: TopNavItem[]
  megaMenu?: React.ReactNode
}

export interface TopNavProps {
  logo?: React.ReactNode
  logoHref?: string
  onLogoClick?: () => void
  items: TopNavItem[]
  activeId?: string
  onItemClick?: (id: string) => void
  actions?: {
    search?: {
      placeholder?: string
      onSearch?: (query: string) => void
      shortcut?: string
    }
    notifications?: {
      count?: number
      onClick?: () => void
    }
    user?: {
      name: string
      avatar?: string
      menuItems?: Array<{
        label: string
        onClick: () => void
        icon?: React.ReactNode
      }>
    }
  }
  sticky?: boolean
  hideOnScroll?: boolean
  hideOnScrollContainer?: string // CSS selector for container to track scroll
  announcement?: {
    message: string
    action?: {
      label: string
      onClick: () => void
    }
  }
}

export function TopNav({
  logo,
  logoHref,
  onLogoClick,
  items,
  activeId,
  onItemClick,
  actions,
  sticky = true,
  hideOnScroll = false,
  hideOnScrollContainer,
  announcement
}: TopNavProps) {
  const [showUserMenu, setShowUserMenu] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isVisible, setIsVisible] = React.useState(true)
  const [lastScrollY, setLastScrollY] = React.useState(0)
  const [openMegaMenu, setOpenMegaMenu] = React.useState<string | null>(null)

  // Handle scroll behavior
  React.useEffect(() => {
    if (!hideOnScroll) return

    const scrollElement = hideOnScrollContainer 
      ? document.querySelector(hideOnScrollContainer) 
      : window

    const handleScroll = () => {
      const currentScrollY = hideOnScrollContainer && scrollElement && scrollElement !== window
        ? (scrollElement as HTMLElement).scrollTop
        : window.scrollY
      
      if (currentScrollY < 10) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll, { passive: true })
      return () => scrollElement.removeEventListener('scroll', handleScroll)
    }
  }, [hideOnScroll, lastScrollY, hideOnScrollContainer])

  // Keyboard shortcut for search (Cmd+K / Ctrl+K)
  React.useEffect(() => {
    if (!actions?.search) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        document.querySelector<HTMLInputElement>('input[type="text"][placeholder*="Search"]')?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [actions?.search])

  const handleLogoClick = () => {
    onLogoClick?.()
    if (logoHref) {
      window.location.href = logoHref
    }
  }

  return (
    <>
      {/* Announcement Bar */}
      {announcement && (
        <div className="bg-primary text-primary-foreground text-center py-2 px-4 text-sm">
          <span>{announcement.message}</span>
          {announcement.action && (
            <button
              onClick={announcement.action.onClick}
              className="ml-3 underline font-medium hover:no-underline"
            >
              {announcement.action.label}
            </button>
          )}
        </div>
      )}

      <nav className={`
        bg-white border-b border-black/10 transition-transform duration-300
        ${sticky ? 'sticky top-0 z-40' : ''}
        ${hideOnScroll && !isVisible ? '-translate-y-full' : 'translate-y-0'}
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Flex align="center" justify="between" className="h-16">
            {/* Logo */}
            {logo && (
              <button
                onClick={handleLogoClick}
                className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
                aria-label="Go to home"
              >
                {logo}
              </button>
            )}

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-1 flex-1 mx-8">
            {items.map(item => (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => item.megaMenu && setOpenMegaMenu(item.id)}
                onMouseLeave={() => item.megaMenu && setOpenMegaMenu(null)}
              >
                <button
                  onClick={() => {
                    if (item.megaMenu) {
                      setOpenMegaMenu(openMegaMenu === item.id ? null : item.id)
                    } else {
                      item.onClick?.()
                      onItemClick?.(item.id)
                    }
                  }}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${activeId === item.id || openMegaMenu === item.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-black/70 hover:bg-slate-100'
                    }
                  `}
                >
                  <Flex align="center" gap="sm">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                        {item.badge}
                      </span>
                    )}
                    {item.megaMenu && (
                      <svg className={`w-4 h-4 transition-transform ${openMegaMenu === item.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </Flex>
                </button>
                
                {/* Mega Menu Dropdown */}
                {item.megaMenu && openMegaMenu === item.id && (
                  <div className="absolute left-0 top-full mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-white border border-black/10 rounded-xl shadow-xl overflow-hidden min-w-[600px]">
                      {item.megaMenu}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <Flex align="center" gap="sm">
            {/* Search */}
            {actions?.search && (
              <div className="hidden md:block relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    actions.search?.onSearch?.(e.target.value)
                  }}
                  placeholder={actions.search.placeholder || 'Search...'}
                  className="w-64 px-4 py-2 pl-10 text-sm border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <svg className="absolute left-3 top-2.5 w-4 h-4 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            )}

            {/* Notifications */}
            {actions?.notifications && (
              <button
                onClick={actions.notifications.onClick}
                className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-black/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {actions.notifications.count && actions.notifications.count > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                    {actions.notifications.count > 9 ? '9+' : actions.notifications.count}
                  </span>
                )}
              </button>
            )}

            {/* User Menu */}
            {actions?.user && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {actions.user.avatar ? (
                    <img src={actions.user.avatar} alt={actions.user.name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                      {actions.user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <svg className="w-4 h-4 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && actions.user.menuItems && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-black/10 rounded-lg shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-black/10">
                      <p className="text-sm font-medium text-black">{actions.user.name}</p>
                    </div>
                    {actions.user.menuItems.map((menuItem, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          menuItem.onClick()
                          setShowUserMenu(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-black hover:bg-slate-100 transition-colors"
                      >
                        {menuItem.icon}
                        <span>{menuItem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Flex>
        </Flex>
      </div>
    </nav>
    </>
  )
}

// 12. BOTTOM NAV - Mobile navigation bar
export interface BottomNavItem {
  id: string
  label: string
  icon: React.ReactNode
  onClick?: () => void
  badge?: string | number
}

export interface BottomNavProps {
  items: BottomNavItem[]
  activeId: string
  onItemClick: (id: string) => void
  forceVisible?: boolean
}

export function BottomNav({ items, activeId, onItemClick, forceVisible = false }: BottomNavProps) {
  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-white border-t border-black/10 z-50 safe-area-bottom ${forceVisible ? '' : 'md:hidden'}`}>
      <div className="flex items-center justify-around h-16 px-2">
        {items.map(item => {
          const isActive = item.id === activeId
          return (
            <button
              key={item.id}
              onClick={() => {
                item.onClick?.()
                onItemClick(item.id)
              }}
              className="flex flex-col items-center justify-center flex-1 gap-1 py-2 relative"
            >
              <div className={`relative ${isActive ? 'text-primary' : 'text-black/60'}`}>
                <div className="[&>svg]:w-6 [&>svg]:h-6">
                  {item.icon}
                </div>
                {item.badge && (
                  <span className="absolute -top-1 -right-1 px-1 min-w-[16px] h-4 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-black/60'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// 13. MOBILE MENU - Hamburger menu
export interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  items: TopNavItem[]
  activeId?: string
  onItemClick?: (id: string) => void
}

export function MobileMenu({
  isOpen,
  onClose,
  items,
  activeId,
  onItemClick
}: MobileMenuProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Menu */}
      <div className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 md:hidden animate-in slide-in-from-right duration-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-black/10">
            <h2 className="text-lg font-semibold text-black">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto">
            <Stack spacing="xs" className="p-4">
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    item.onClick?.()
                    onItemClick?.(item.id)
                    onClose()
                  }}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors
                    ${activeId === item.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-black/70 hover:bg-slate-100'
                    }
                  `}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </Stack>
          </div>
        </div>
      </div>
    </>
  )
}

// 14. RESPONSIVE NAV - Combines TopNav + MobileMenu
export interface ResponsiveNavProps extends Omit<TopNavProps, 'sticky'> {
  mobileBreakpoint?: 'sm' | 'md' | 'lg'
}

export function ResponsiveNav({
  logo,
  items,
  activeId,
  onItemClick,
  actions,
  mobileBreakpoint = 'md'
}: ResponsiveNavProps) {
  const [showMobileMenu, setShowMobileMenu] = React.useState(false)

  const breakpointClass = {
    sm: 'sm:hidden',
    md: 'md:hidden',
    lg: 'lg:hidden'
  }

  return (
    <>
      <nav className="bg-white border-b border-black/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Flex align="center" justify="between" className="h-16">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(true)}
              className={`p-2 hover:bg-slate-100 rounded-lg ${breakpointClass[mobileBreakpoint]}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo */}
            {logo && (
              <div className="flex-shrink-0">
                {logo}
              </div>
            )}

            {/* Desktop Navigation */}
            <div className={`hidden ${mobileBreakpoint}:flex ${mobileBreakpoint}:items-center ${mobileBreakpoint}:gap-1 flex-1 mx-8`}>
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    item.onClick?.()
                    onItemClick?.(item.id)
                  }}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${activeId === item.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-black/70 hover:bg-slate-100'
                    }
                  `}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Actions */}
            <Flex align="center" gap="sm">
              {actions?.notifications && (
                <button
                  onClick={actions.notifications.onClick}
                  className="relative p-2 hover:bg-slate-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {actions.notifications.count && actions.notifications.count > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                      {actions.notifications.count > 9 ? '9+' : actions.notifications.count}
                    </span>
                  )}
                </button>
              )}

              {actions?.user && (
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                  {actions.user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </Flex>
          </Flex>
        </div>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        items={items}
        activeId={activeId}
        onItemClick={onItemClick}
      />
    </>
  )
}
