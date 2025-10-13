/**
 * Section Headers
 * 
 * Based on specs page patterns
 */

import React from 'react'
import { Edit } from 'lucide-react'
import { Stack, Flex } from '../primitives/Layout'

// ============================================================================
// 1. CARD SECTION HEADER - For card sections (from specs page line 304)
// ============================================================================

export interface CardSectionHeaderProps {
  title: string
  subtitle?: string
  onEdit?: () => void
  editLabel?: string
}

/**
 * CardSectionHeader - Premium card header component
 * 
 * Based on specifications.tsx line 304
 * Use inside BaseCard with padding="none"
 * 
 * @example
 * <BaseCard padding="none">
 *   <CardSectionHeader 
 *     title="Engine Performance"
 *     subtitle="Multiple data sources"
 *     onEdit={() => handleEdit()}
 *   />
 *   <div className="px-8 py-6">Content</div>
 * </BaseCard>
 */
export function CardSectionHeader({ 
  title, 
  subtitle, 
  onEdit, 
  editLabel = 'Edit' 
}: CardSectionHeaderProps) {
  return (
    <Flex 
      justify="between" 
      align="center" 
      className="px-8 py-4 border-b border-black/5"
    >
      <Stack spacing="xs" className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-black truncate">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-black/50 truncate">
            {subtitle}
          </p>
        )}
      </Stack>
      
      {onEdit && (
        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          aria-label={`${editLabel} ${title}`}
        >
          <Edit className="w-4 h-4" aria-hidden="true" />
          {editLabel}
        </button>
      )}
    </Flex>
  )
}

// ============================================================================
// 2. PAGE SECTION HEADER - For page sections (title + description)
// ============================================================================

export interface PageSectionHeaderProps {
  title: string
  description?: string
  as?: 'h1' | 'h2' | 'h3'
}

/**
 * PageSectionHeader - Clean section header for page content
 * 
 * Use to introduce major sections within a page
 * 
 * @example
 * <Stack spacing="lg">
 *   <PageSectionHeader 
 *     title="Recent Activity"
 *     description="View your latest vehicle events and updates"
 *   />
 *   <Grid columns={2} gap="md">...</Grid>
 * </Stack>
 */
export function PageSectionHeader({ 
  title, 
  description,
  as = 'h2'
}: PageSectionHeaderProps) {
  const Component = as
  
  return (
    <Stack spacing="xs" className="max-w-3xl">
      <Component className="text-xl font-semibold text-black leading-tight">
        {title}
      </Component>
      {description && (
        <p className="text-sm text-black/60 leading-relaxed">
          {description}
        </p>
      )}
    </Stack>
  )
}

// ============================================================================
// 3. SECTION HEADER WITH ACTION - Title + single action button
// ============================================================================

export interface SectionHeaderWithActionProps {
  title: string
  description?: string
  actionLabel: string
  onAction: () => void
  actionVariant?: 'primary' | 'secondary'
}

/**
 * SectionHeaderWithAction - Section header with primary action
 * 
 * Use when a section has one primary action (e.g., "Add", "Create")
 * Responsive: stacks vertically on mobile
 * 
 * @example
 * <Stack spacing="lg">
 *   <SectionHeaderWithAction
 *     title="Maintenance Schedule"
 *     description="Upcoming service appointments"
 *     actionLabel="Add Event"
 *     onAction={() => openModal()}
 *   />
 *   <Grid>...</Grid>
 * </Stack>
 */
export function SectionHeaderWithAction({ 
  title, 
  description, 
  actionLabel, 
  onAction,
  actionVariant = 'primary'
}: SectionHeaderWithActionProps) {
  return (
    <Flex 
      direction="row" 
      justify="between" 
      align="start" 
      gap="lg" 
      responsive
    >
      <Stack spacing="xs" className="flex-1 min-w-0">
        <h2 className="text-xl font-semibold text-black leading-tight">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-black/60 leading-relaxed">
            {description}
          </p>
        )}
      </Stack>
      
      <button
        onClick={onAction}
        className={`px-4 py-2 text-sm rounded-lg font-medium transition-all flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          actionVariant === 'primary'
            ? 'bg-primary text-primary-foreground hover:opacity-90 focus:ring-primary'
            : 'border border-black/10 text-black bg-white hover:bg-slate-50 focus:ring-slate-300'
        }`}
        aria-label={`${actionLabel} for ${title}`}
      >
        {actionLabel}
      </button>
    </Flex>
  )
}

// ============================================================================
// 4. SECTION HEADER WITH BADGE - Title + badge pill
// ============================================================================

export interface SectionHeaderWithBadgeProps {
  title: string
  description?: string
  badge: string
  badgeColor?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
}

/**
 * SectionHeaderWithBadge - Section header with status badge
 * 
 * Use to show status, category, or special designation
 * Badge uses subtle colors from your specs page aesthetic
 * 
 * @example
 * <SectionHeaderWithBadge
 *   title="AI-Enhanced Features"
 *   description="Powered by artificial intelligence"
 *   badge="Beta"
 *   badgeColor="blue"
 * />
 */
export function SectionHeaderWithBadge({ 
  title, 
  description, 
  badge, 
  badgeColor = 'blue' 
}: SectionHeaderWithBadgeProps) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    gray: 'bg-slate-100 text-slate-600'
  }

  return (
    <Stack spacing="xs" className="max-w-3xl">
      <Flex align="center" gap="md" className="flex-wrap">
        <h2 className="text-xl font-semibold text-black leading-tight">
          {title}
        </h2>
        <span 
          className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${colors[badgeColor]}`}
          role="status"
          aria-label={`Status: ${badge}`}
        >
          {badge}
        </span>
      </Flex>
      {description && (
        <p className="text-sm text-black/60 leading-relaxed">
          {description}
        </p>
      )}
    </Stack>
  )
}

// ============================================================================
// 5. SECTION HEADER WITH ICON - Icon + title + description
// ============================================================================

export interface SectionHeaderWithIconProps {
  title: string
  description?: string
  icon: React.ReactNode
  iconColor?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
}

/**
 * SectionHeaderWithIcon - Section header with decorative icon
 * 
 * Use to visually categorize or brand a section
 * Icon container uses subtle background colors
 * 
 * @example
 * <SectionHeaderWithIcon
 *   title="Quick Start Guide"
 *   description="Get up and running in minutes"
 *   icon={<Rocket className="w-6 h-6" />}
 *   iconColor="blue"
 * />
 */
export function SectionHeaderWithIcon({ 
  title, 
  description, 
  icon, 
  iconColor = 'blue' 
}: SectionHeaderWithIconProps) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    gray: 'bg-slate-100 text-slate-600'
  }

  return (
    <Flex align="start" gap="lg">
      <div 
        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[iconColor]}`}
        aria-hidden="true"
      >
        {icon}
      </div>
      <Stack spacing="xs" className="flex-1 min-w-0">
        <h2 className="text-xl font-semibold text-black leading-tight">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-black/60 leading-relaxed">
            {description}
          </p>
        )}
      </Stack>
    </Flex>
  )
}

// ============================================================================
// 6. DIVIDER SECTION HEADER - Centered with lines
// ============================================================================

export interface DividerSectionHeaderProps {
  title: string
}

/**
 * DividerSectionHeader - Visual section divider with centered title
 * 
 * Use to create clear visual breaks between major sections
 * Centered title with horizontal lines on both sides
 * 
 * @example
 * <Stack spacing="lg">
 *   <p>Content before...</p>
 *   <DividerSectionHeader title="Section Break" />
 *   <p>Content after...</p>
 * </Stack>
 */
export function DividerSectionHeader({ title }: DividerSectionHeaderProps) {
  return (
    <Flex align="center" gap="lg" className="py-2">
      <div className="flex-1 border-t border-black/5" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-black/60 whitespace-nowrap">
        {title}
      </h3>
      <div className="flex-1 border-t border-black/5" aria-hidden="true" />
    </Flex>
  )
}

// ============================================================================
// 7. COMPACT SECTION HEADER - Small, with optional link
// ============================================================================

export interface CompactSectionHeaderProps {
  title: string
  actionLabel?: string
  onAction?: () => void
}

/**
 * CompactSectionHeader - Minimal section header with optional action link
 * 
 * Use for tight spaces or secondary sections
 * Optional "View all" style link on the right
 * 
 * @example
 * <CompactSectionHeader
 *   title="Recent Activity"
 *   actionLabel="View all"
 *   onAction={() => router.push('/activity')}
 * />
 */
export function CompactSectionHeader({ title, actionLabel, onAction }: CompactSectionHeaderProps) {
  return (
    <Flex justify="between" align="center" gap="md">
      <h3 className="text-lg font-semibold text-black flex-1 min-w-0 truncate">
        {title}
      </h3>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          aria-label={`${actionLabel} for ${title}`}
        >
          {actionLabel}
        </button>
      )}
    </Flex>
  )
}

// ============================================================================
// 8. SECTION HEADER WITH TABS - Title + tab navigation
// ============================================================================

export interface SectionHeaderWithTabsProps {
  title: string
  description?: string
  tabs: Array<{
    label: string
    active?: boolean
    onClick: () => void
  }>
}

/**
 * SectionHeaderWithTabs - Section header with tab navigation
 * 
 * Use to switch between different views of the same section
 * Tabs scroll horizontally on mobile
 * 
 * @example
 * <SectionHeaderWithTabs
 *   title="Vehicle History"
 *   description="Track all events and maintenance"
 *   tabs={[
 *     { label: 'All', active: true, onClick: () => setView('all') },
 *     { label: 'Maintenance', active: false, onClick: () => setView('maintenance') }
 *   ]}
 * />
 */
export function SectionHeaderWithTabs({ title, description, tabs }: SectionHeaderWithTabsProps) {
  return (
    <Stack spacing="md" className="max-w-3xl">
      <Stack spacing="xs">
        <h2 className="text-xl font-semibold text-black leading-tight">{title}</h2>
        {description && (
          <p className="text-sm text-black/60 leading-relaxed">{description}</p>
        )}
      </Stack>
      <div className="border-b border-black/5 overflow-x-auto -mx-1 px-1" role="tablist">
        <Flex gap="sm">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={tab.onClick}
              role="tab"
              aria-selected={tab.active}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary ${
                tab.active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-black/60 hover:text-black hover:border-black/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </Flex>
      </div>
    </Stack>
  )
}

// ============================================================================
// 9. SECTION HEADER WITH ACTIONS - Title + multiple action buttons
// ============================================================================

export interface SectionHeaderWithActionsProps {
  title: string
  description?: string
  actions: React.ReactNode
}

/**
 * SectionHeaderWithActions - Section header with multiple action buttons
 * 
 * Use when a section needs multiple actions (e.g., Filter + Add)
 * Actions group together, responsive (stacks on mobile)
 * 
 * @example
 * <SectionHeaderWithActions
 *   title="Maintenance Schedule"
 *   description="Upcoming service appointments"
 *   actions={
 *     <>
 *       <button>Filter</button>
 *       <button>Add Event</button>
 *     </>
 *   }
 * />
 */
export function SectionHeaderWithActions({ title, description, actions }: SectionHeaderWithActionsProps) {
  return (
    <Flex direction="row" justify="between" align="start" gap="lg" responsive>
      <Stack spacing="xs" className="flex-1 min-w-0">
        <h2 className="text-xl font-semibold text-black leading-tight">{title}</h2>
        {description && (
          <p className="text-sm text-black/60 leading-relaxed">{description}</p>
        )}
      </Stack>
      <Flex gap="md" className="flex-shrink-0">
        {actions}
      </Flex>
    </Flex>
  )
}

// ============================================================================
// 10. SECTION HEADER WITH BACK - Back button + title
// ============================================================================

export interface SectionHeaderWithBackProps {
  title: string
  description?: string
  onBack: () => void
  backLabel?: string
}

/**
 * SectionHeaderWithBack - Section header with back navigation
 * 
 * Use for detail pages that need navigation back to parent
 * Back button appears above the title
 * 
 * @example
 * <SectionHeaderWithBack
 *   title="Vehicle Details"
 *   description="2023 Honda Civic"
 *   onBack={() => router.back()}
 * />
 */
export function SectionHeaderWithBack({ 
  title, 
  description, 
  onBack, 
  backLabel = 'Back' 
}: SectionHeaderWithBackProps) {
  return (
    <Stack spacing="md" className="max-w-3xl">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors w-fit focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
        aria-label={`${backLabel} to previous page`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {backLabel}
      </button>
      <Stack spacing="xs">
        <h2 className="text-xl font-semibold text-black leading-tight">{title}</h2>
        {description && (
          <p className="text-sm text-black/60 leading-relaxed">{description}</p>
        )}
      </Stack>
    </Stack>
  )
}

// ============================================================================
// 11. SECTION HEADER WITH SEARCH - Title + search input
// ============================================================================

export interface SectionHeaderWithSearchProps {
  title: string
  description?: string
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
}

/**
 * SectionHeaderWithSearch - Section header with search/filter input
 * 
 * Use when a section has searchable or filterable content
 * Search input appears below title and description
 * 
 * @example
 * <SectionHeaderWithSearch
 *   title="All Vehicles"
 *   description="Search and filter your vehicles"
 *   searchPlaceholder="Search vehicles..."
 *   searchValue={searchTerm}
 *   onSearchChange={setSearchTerm}
 * />
 */
export function SectionHeaderWithSearch({ 
  title, 
  description, 
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange 
}: SectionHeaderWithSearchProps) {
  const inputId = `search-${title.toLowerCase().replace(/\s+/g, '-')}`
  
  return (
    <Stack spacing="lg" className="max-w-3xl">
      <Stack spacing="xs">
        <h2 className="text-xl font-semibold text-black leading-tight">{title}</h2>
        {description && (
          <p className="text-sm text-black/60 leading-relaxed">{description}</p>
        )}
      </Stack>
      <input
        id={inputId}
        type="search"
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={(e) => onSearchChange?.(e.target.value)}
        className="w-full px-4 py-2 text-sm border border-black/10 rounded-lg bg-white transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-black/40"
        aria-label={`Search ${title}`}
      />
    </Stack>
  )
}

// ============================================================================
// LEGACY: Keep SectionHeader as alias to CardSectionHeader for compatibility
// ============================================================================

export const SectionHeader = CardSectionHeader
export type SectionHeaderProps = CardSectionHeaderProps
