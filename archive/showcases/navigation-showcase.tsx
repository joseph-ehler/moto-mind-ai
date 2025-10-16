/**
 * Navigation Components Showcase
 */

import React, { useState } from 'react'
import Head from 'next/head'
import {
  Container,
  Section,
  Stack,
  BaseCard,
  Breadcrumbs,
  Pagination,
  NavigationTabs,
  VerticalTabs,
  Stepper,
  SidebarNavigation,
  QuickLinks,
  ProgressNav,
  ContextMenu,
  PageHeader,
  TopNav,
  BottomNav,
  ResponsiveNav,
  MegaMenu,
  CommandPalette,
  useCommandPalette,
  TableOfContents,
  ScrollProgress,
  CircularScrollProgress,
  BackToTop
} from '@/components/design-system'

export default function NavigationShowcasePage() {
  const [currentPage, setCurrentPage] = React.useState(1)
  const [activeTab, setActiveTab] = React.useState('1')
  const [verticalTab, setVerticalTab] = React.useState('overview')
  const [activeSidebarId, setActiveSidebarId] = React.useState('dashboard')
  const [progressNavId, setProgressNavId] = React.useState('profile')
  const [topNavActive, setTopNavActive] = React.useState('dashboard')
  const [bottomNavActive, setBottomNavActive] = React.useState('home')
  const [showBottomNav, setShowBottomNav] = React.useState(false)
  const { open: commandPaletteOpen, setOpen: setCommandPaletteOpen } = useCommandPalette()

  return (
    <>
      <Head>
        <title>Navigation Components - MotoMind Design System</title>
        <meta name="description" content="Navigation component showcase" />
      </Head>

      {/* Back to Top for the entire page */}
      <BackToTop
        threshold={300}
        position="bottom-center"
        size="md"
        smooth={true}
      />

      <div className="min-h-screen bg-slate-50">
        <Container size="md" useCase="articles">
          <Section spacing="xl">
            <Stack spacing="2xl">
              
              {/* Page Title */}
              <div className="text-center">
                <h1 className="text-4xl font-bold text-black mb-4">Navigation Components</h1>
                <p className="text-lg text-black/60">Seamless navigation for better UX</p>
              </div>

              {/* 1. Breadcrumbs */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">1. Breadcrumbs</h2>
                <p className="text-sm text-black/60">Show navigation path</p>
                
                <BaseCard padding="lg">
                  <Stack spacing="lg">
                    <div>
                      <p className="text-sm text-black/60 mb-3">Basic</p>
                      <Breadcrumbs
                        items={[
                          { label: 'Vehicles', href: '/vehicles' },
                          { label: 'Honda Civic', href: '/vehicles/123' },
                          { label: 'Maintenance' }
                        ]}
                      />
                    </div>

                    <div>
                      <p className="text-sm text-black/60 mb-3">With Home Icon</p>
                      <Breadcrumbs
                        showHome
                        items={[
                          { label: 'Fleet', href: '/fleet' },
                          { label: 'Reports', href: '/fleet/reports' },
                          { label: 'Annual' }
                        ]}
                      />
                    </div>

                    <div>
                      <p className="text-sm text-black/60 mb-3">Custom Separator</p>
                      <Breadcrumbs
                        items={[
                          { label: 'Dashboard', href: '/' },
                          { label: 'Settings', href: '/settings' },
                          { label: 'Profile' }
                        ]}
                        separator={<span>→</span>}
                      />
                    </div>
                  </Stack>
                </BaseCard>
              </Stack>

              {/* 2. Pagination */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">2. Pagination</h2>
                <p className="text-sm text-black/60">Navigate through pages</p>
                
                <BaseCard padding="lg">
                  <Stack spacing="lg">
                    <div>
                      <p className="text-sm text-black/60 mb-3">Full Pagination</p>
                      <Pagination
                        currentPage={currentPage}
                        totalPages={20}
                        onPageChange={setCurrentPage}
                      />
                    </div>

                    <div>
                      <p className="text-sm text-black/60 mb-3">Compact</p>
                      <Pagination
                        currentPage={5}
                        totalPages={10}
                        onPageChange={() => {}}
                        compact
                      />
                    </div>
                  </Stack>
                </BaseCard>
              </Stack>

              {/* 3. Tabs */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">3. Horizontal Tabs</h2>
                <p className="text-sm text-black/60">Tab navigation with variants</p>
                
                <BaseCard padding="lg">
                  <Stack spacing="xl">
                    <div>
                      <p className="text-sm text-black/60 mb-3">Line Variant</p>
                      <NavigationTabs
                        tabs={[
                          { id: '1', label: 'Overview', content: <div className="py-4">Overview content</div> },
                          { id: '2', label: 'Details', content: <div className="py-4">Details content</div>, badge: '3' },
                          { id: '3', label: 'History', content: <div className="py-4">History content</div> }
                        ]}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        variant="line"
                      />
                    </div>

                    <div>
                      <p className="text-sm text-black/60 mb-3">Pills Variant</p>
                      <NavigationTabs
                        tabs={[
                          { id: 'a', label: 'Profile' },
                          { id: 'b', label: 'Settings' },
                          { id: 'c', label: 'Security', badge: 'New' }
                        ]}
                        activeTab="a"
                        onTabChange={() => {}}
                        variant="pills"
                      />
                    </div>

                    <div>
                      <p className="text-sm text-black/60 mb-3">Enclosed Variant</p>
                      <NavigationTabs
                        tabs={[
                          { id: 'x', label: 'Documents' },
                          { id: 'y', label: 'Images' },
                          { id: 'z', label: 'Videos' }
                        ]}
                        activeTab="x"
                        onTabChange={() => {}}
                        variant="enclosed"
                      />
                    </div>
                  </Stack>
                </BaseCard>
              </Stack>

              {/* 4. Vertical Tabs */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">4. Vertical Tabs</h2>
                <p className="text-sm text-black/60">Sidebar tab navigation</p>
                
                <BaseCard padding="lg">
                  <VerticalTabs
                    tabs={[
                      { 
                        id: 'overview', 
                        label: 'Overview',
                        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
                        content: <div className="p-6 bg-slate-50 rounded-lg">Overview content</div>
                      },
                      { 
                        id: 'analytics', 
                        label: 'Analytics',
                        badge: '12',
                        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
                        content: <div className="p-6 bg-slate-50 rounded-lg">Analytics content with charts</div>
                      },
                      { 
                        id: 'settings', 
                        label: 'Settings',
                        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
                        content: <div className="p-6 bg-slate-50 rounded-lg">Settings content</div>
                      }
                    ]}
                    activeTab={verticalTab}
                    onTabChange={setVerticalTab}
                  />
                </BaseCard>
              </Stack>

              {/* 5. Stepper */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">5. Stepper</h2>
                <p className="text-sm text-black/60">Multi-step process indicator</p>
                
                <BaseCard padding="lg">
                  <Stack spacing="xl">
                    <div>
                      <p className="text-sm text-black/60 mb-4">Horizontal</p>
                      <Stepper
                        steps={[
                          { id: '1', label: 'Vehicle Details', description: 'Basic info', status: 'complete' },
                          { id: '2', label: 'Photos', description: 'Upload images', status: 'complete' },
                          { id: '3', label: 'Verification', description: 'Review & submit', status: 'current' },
                          { id: '4', label: 'Complete', status: 'upcoming' }
                        ]}
                        orientation="horizontal"
                      />
                    </div>

                    <div>
                      <p className="text-sm text-black/60 mb-4">Vertical</p>
                      <Stepper
                        steps={[
                          { id: '1', label: 'Create Account', description: 'Sign up with email', status: 'complete' },
                          { id: '2', label: 'Add Vehicle', description: 'Enter vehicle details', status: 'complete' },
                          { id: '3', label: 'Payment Setup', description: 'Configure billing', status: 'error' },
                          { id: '4', label: 'Get Started', description: 'Start using the app', status: 'upcoming' }
                        ]}
                        orientation="vertical"
                      />
                    </div>
                  </Stack>
                </BaseCard>
              </Stack>

              {/* ELITE FEATURES */}
              <div className="text-center py-8 border-y border-black/10">
                <h2 className="text-3xl font-bold text-black mb-2">⚡ Elite Features</h2>
                <p className="text-lg text-black/60">Advanced navigation patterns</p>
              </div>

              {/* 6. Sidebar Navigation */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">6. Sidebar Navigation</h2>
                <p className="text-sm text-black/60">Collapsible sidebar with nested items</p>
                
                <BaseCard padding="lg">
                  <SidebarNavigation
                    items={[
                      { 
                        id: 'dashboard', 
                        label: 'Dashboard',
                        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                      },
                      { 
                        id: 'vehicles', 
                        label: 'Vehicles',
                        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
                        badge: '12',
                        children: [
                          { id: 'active', label: 'Active Vehicles' },
                          { id: 'maintenance', label: 'In Maintenance' },
                          { id: 'archived', label: 'Archived' }
                        ]
                      },
                      { 
                        id: 'reports', 
                        label: 'Reports',
                        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
                        badge: 'New'
                      }
                    ]}
                    activeId={activeSidebarId}
                    onItemClick={setActiveSidebarId}
                  />
                </BaseCard>
              </Stack>

              {/* 7. Quick Links */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">7. Quick Links</h2>
                <p className="text-sm text-black/60">Grid of link cards</p>
                
                <QuickLinks
                  columns={3}
                  links={[
                    {
                      id: '1',
                      label: 'Add Vehicle',
                      description: 'Register a new vehicle',
                      badge: 'Popular',
                      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
                      onClick: () => alert('Add Vehicle')
                    },
                    {
                      id: '2',
                      label: 'Log Maintenance',
                      description: 'Record service events',
                      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
                      onClick: () => alert('Log Maintenance')
                    },
                    {
                      id: '3',
                      label: 'View Reports',
                      description: 'Analytics & insights',
                      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
                      onClick: () => alert('View Reports')
                    }
                  ]}
                />
              </Stack>

              {/* 8. Progress Nav */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">8. Progress Navigation</h2>
                <p className="text-sm text-black/60">Navigation with progress tracking</p>
                
                <BaseCard padding="lg">
                  <ProgressNav
                    items={[
                      { id: 'profile', label: 'Profile Setup', completed: true },
                      { id: 'vehicle', label: 'Add Vehicle', completed: true },
                      { id: 'maintenance', label: 'Maintenance Schedule', completed: false },
                      { id: 'done', label: 'All Done!', completed: false }
                    ]}
                    activeId={progressNavId}
                    onNavigate={setProgressNavId}
                  />
                </BaseCard>
              </Stack>

              {/* 9. Context Menu */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">9. Context Menu</h2>
                <p className="text-sm text-black/60">Right-click menu</p>
                
                <BaseCard padding="lg">
                  <ContextMenu
                    trigger={
                      <div className="p-8 bg-slate-100 rounded-lg text-center text-black/60 cursor-default">
                        Right-click me for options
                      </div>
                    }
                    items={[
                      { 
                        id: 'view', 
                        label: 'View Details',
                        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
                        onClick: () => alert('View Details')
                      },
                      { 
                        id: 'edit', 
                        label: 'Edit',
                        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
                        onClick: () => alert('Edit')
                      },
                      { id: 'divider1', label: '', divider: true, onClick: () => {} },
                      { 
                        id: 'delete', 
                        label: 'Delete',
                        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
                        onClick: () => alert('Delete'),
                        danger: true
                      }
                    ]}
                  />
                </BaseCard>
              </Stack>

              {/* 10. Page Header */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">10. Page Header</h2>
                <p className="text-sm text-black/60">Consistent page header with breadcrumbs and actions</p>
                
                <BaseCard padding="lg">
                  <PageHeader
                    title="Vehicle Management"
                    description="Manage your fleet of vehicles"
                    breadcrumbs={[
                      { label: 'Dashboard', href: '/' },
                      { label: 'Fleet', href: '/fleet' },
                      { label: 'Vehicles' }
                    ]}
                    actions={[
                      { 
                        label: 'Add Vehicle',
                        onClick: () => alert('Add Vehicle'),
                        variant: 'primary',
                        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      },
                      { 
                        label: 'Export',
                        onClick: () => alert('Export')
                      }
                    ]}
                  />
                </BaseCard>
              </Stack>

              {/* 11. Top Nav */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">11. Top Nav</h2>
                <p className="text-sm text-black/60">Desktop navigation bar with search and user menu</p>
                
                <div className="bg-white rounded-lg overflow-hidden border border-black/10">
                  <TopNav
                    logo={<div className="text-xl font-bold text-primary">MotoMind</div>}
                    items={[
                      { id: 'dashboard', label: 'Dashboard' },
                      { id: 'vehicles', label: 'Vehicles', badge: 12 },
                      { id: 'maintenance', label: 'Maintenance' },
                      { id: 'reports', label: 'Reports', badge: 'New' }
                    ]}
                    activeId={topNavActive}
                    onItemClick={setTopNavActive}
                    actions={{
                      search: {
                        placeholder: 'Search vehicles...',
                        onSearch: (q) => console.log('Search:', q)
                      },
                      notifications: {
                        count: 3,
                        onClick: () => alert('Notifications')
                      },
                      user: {
                        name: 'John Doe',
                        menuItems: [
                          { label: 'Profile', onClick: () => alert('Profile') },
                          { label: 'Settings', onClick: () => alert('Settings') },
                          { label: 'Sign Out', onClick: () => alert('Sign Out') }
                        ]
                      }
                    }}
                  />
                  <div className="p-8 text-center text-black/40">
                    Content area
                  </div>
                </div>
              </Stack>

              {/* 11a. Mega Menu Demo */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">11a. Top Nav with Mega Menu ⭐</h2>
                <p className="text-sm text-black/60">Hover over "Products" to see mega menu</p>
                
                <div className="bg-white rounded-lg overflow-hidden border border-black/10">
                  <TopNav
                    logo={<div className="text-xl font-bold text-primary">MotoMind</div>}
                    items={[
                      { id: 'home', label: 'Home' },
                      { 
                        id: 'products', 
                        label: 'Products',
                        megaMenu: (
                          <MegaMenu
                            columns={[
                              {
                                title: 'Fleet Management',
                                items: [
                                  {
                                    label: 'Vehicle Tracking',
                                    description: 'Real-time GPS tracking',
                                    icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
                                    onClick: () => alert('Vehicle Tracking')
                                  },
                                  {
                                    label: 'Maintenance Alerts',
                                    description: 'Never miss a service',
                                    icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
                                    onClick: () => alert('Maintenance')
                                  },
                                  {
                                    label: 'Fuel Tracking',
                                    description: 'Monitor fuel consumption',
                                    icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
                                    onClick: () => alert('Fuel')
                                  }
                                ]
                              },
                              {
                                title: 'Analytics',
                                items: [
                                  {
                                    label: 'Reports Dashboard',
                                    description: 'Comprehensive insights',
                                    badge: 'Popular',
                                    onClick: () => alert('Reports')
                                  },
                                  {
                                    label: 'Cost Analysis',
                                    description: 'Track all expenses',
                                    onClick: () => alert('Cost')
                                  },
                                  {
                                    label: 'Performance Metrics',
                                    description: 'Vehicle health scores',
                                    onClick: () => alert('Performance')
                                  }
                                ]
                              },
                              {
                                title: 'Integrations',
                                items: [
                                  {
                                    label: 'API Access',
                                    description: 'Developer tools',
                                    badge: 'New',
                                    onClick: () => alert('API')
                                  },
                                  {
                                    label: 'Mobile Apps',
                                    description: 'iOS & Android',
                                    onClick: () => alert('Mobile')
                                  },
                                  {
                                    label: 'Webhooks',
                                    description: 'Real-time events',
                                    onClick: () => alert('Webhooks')
                                  }
                                ]
                              }
                            ]}
                            featured={{
                              title: 'New: AI-Powered Predictions',
                              description: 'Predict maintenance needs before they become problems with our new AI engine.',
                              action: {
                                label: 'Learn More',
                                onClick: () => alert('AI Features')
                              }
                            }}
                          />
                        )
                      },
                      { id: 'pricing', label: 'Pricing' },
                      { id: 'about', label: 'About' }
                    ]}
                    activeId={topNavActive}
                    onItemClick={setTopNavActive}
                  />
                  <div className="p-8 text-center text-black/40">
                    Hover over "Products" to see the mega menu
                  </div>
                </div>
              </Stack>

              {/* 11b. Scroll Behavior Demo */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">11b. Hide on Scroll Demo ⭐</h2>
                <p className="text-sm text-black/60">Nav hides when scrolling down, shows when scrolling up</p>
                
                <div className="bg-white rounded-lg overflow-hidden border border-black/10 relative" style={{ height: '500px' }}>
                  <div id="hide-scroll-demo" className="overflow-auto h-full">
                    <TopNav
                      logo={<div className="text-xl font-bold text-primary">MotoMind</div>}
                      items={[
                        { id: 'home', label: 'Home' },
                        { id: 'features', label: 'Features' },
                        { id: 'docs', label: 'Docs' }
                      ]}
                      activeId="home"
                      hideOnScroll={true}
                      hideOnScrollContainer="#hide-scroll-demo"
                      sticky={true}
                      announcement={{
                        message: '🎉 Scroll down to see the nav hide, scroll up to see it reappear!',
                        action: { label: 'Try it', onClick: () => {} }
                      }}
                    />
                    <div className="p-8 space-y-8">
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8">
                        <h3 className="text-2xl font-bold text-black mb-4">Scroll down to test!</h3>
                        <p className="text-black/70 leading-relaxed">
                          The navigation bar will automatically hide when you scroll down, giving you more screen space to view content. 
                          When you scroll back up, it smoothly reappears. This is perfect for long-form content pages.
                        </p>
                      </div>

                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="bg-white border border-black/5 rounded-xl p-6">
                          <h4 className="font-semibold text-black mb-2">Section {i}</h4>
                          <p className="text-black/60 mb-4">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                          </p>
                          <div className="h-32 bg-slate-100 rounded-lg flex items-center justify-center text-black/40">
                            Content Block {i}
                          </div>
                        </div>
                      ))}

                      <div className="bg-green-50 rounded-xl p-8 text-center">
                        <p className="text-green-900 font-medium">🎉 You reached the bottom! Scroll back up to see the nav reappear.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-black/40 text-center">
                  Scroll inside the container above to see the hide-on-scroll behavior
                </p>
              </Stack>

              {/* 12. Bottom Nav */}
              <Stack spacing="lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-black">12. Bottom Nav (Mobile)</h2>
                    <p className="text-sm text-black/60">Fixed bottom navigation for mobile devices</p>
                  </div>
                  <button
                    onClick={() => setShowBottomNav(!showBottomNav)}
                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    {showBottomNav ? 'Hide' : 'Show'} Bottom Nav
                  </button>
                </div>
                
                <div className="relative bg-white rounded-lg overflow-hidden border border-black/10" style={{ height: '400px' }}>
                  <div className="absolute inset-0 flex items-center justify-center text-black/40">
                    Mobile content area
                  </div>
                  <BottomNav
                    forceVisible={showBottomNav}
                    items={[
                      {
                        id: 'home',
                        label: 'Home',
                        icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                      },
                      {
                        id: 'vehicles',
                        label: 'Vehicles',
                        icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
                        badge: 12
                      },
                      {
                        id: 'add',
                        label: 'Add',
                        icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      },
                      {
                        id: 'notifications',
                        label: 'Alerts',
                        icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
                        badge: '3'
                      },
                      {
                        id: 'profile',
                        label: 'Profile',
                        icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      }
                    ]}
                    activeId={bottomNavActive}
                    onItemClick={setBottomNavActive}
                  />
                </div>
                <p className="text-xs text-black/40 text-center">
                  Note: Bottom nav is hidden on desktop (md breakpoint and above)
                </p>
              </Stack>

              {/* 13. Responsive Nav */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">13. Responsive Nav</h2>
                <p className="text-sm text-black/60">Combines desktop TopNav with mobile hamburger menu</p>
                
                <div className="bg-white rounded-lg overflow-hidden border border-black/10">
                  <ResponsiveNav
                    logo={<div className="text-xl font-bold text-primary">MotoMind</div>}
                    items={[
                      { id: 'dashboard', label: 'Dashboard' },
                      { id: 'vehicles', label: 'Vehicles' },
                      { id: 'maintenance', label: 'Maintenance' },
                      { id: 'reports', label: 'Reports' }
                    ]}
                    activeId={topNavActive}
                    onItemClick={setTopNavActive}
                    actions={{
                      notifications: {
                        count: 5,
                        onClick: () => alert('Notifications')
                      },
                      user: {
                        name: 'John Doe'
                      }
                    }}
                  />
                  <div className="p-8 text-center text-black/40">
                    Content area - Resize browser to see mobile menu
                  </div>
                </div>
              </Stack>

              {/* 14. Command Palette */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">14. Command Palette ⭐</h2>
                <p className="text-sm text-black/60">Quick access to all commands - Linear/GitHub style</p>
                
                <BaseCard padding="lg">
                  <Stack spacing="md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-black/70 mb-2">
                          The command palette provides quick access to all app actions with keyboard shortcuts.
                        </p>
                        <p className="text-xs text-black/40">
                          Press <kbd className="px-2 py-1 bg-slate-100 text-black/70 rounded border border-black/10 text-xs font-medium">Cmd/Ctrl+K</kbd> anywhere on this page to open
                        </p>
                      </div>
                      <button
                        onClick={() => setCommandPaletteOpen(true)}
                        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Open Command Palette
                      </button>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-6 space-y-3">
                      <h4 className="font-semibold text-sm text-black">Features:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm text-black/70">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Keyboard navigation (↑↓)
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Fuzzy search
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Recent commands
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Categorized actions
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Icons & descriptions
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Keyboard shortcuts display
                        </div>
                      </div>
                    </div>
                  </Stack>
                </BaseCard>

                {/* Command Palette Component */}
                <CommandPalette
                  open={commandPaletteOpen}
                  onClose={() => setCommandPaletteOpen(false)}
                  commands={[
                    // Navigation
                    {
                      id: 'go-dashboard',
                      label: 'Go to Dashboard',
                      description: 'View your fleet overview',
                      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
                      category: 'navigation',
                      keywords: ['home', 'main'],
                      onSelect: () => alert('Go to Dashboard')
                    },
                    {
                      id: 'go-vehicles',
                      label: 'Go to Vehicles',
                      description: 'Manage your fleet',
                      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
                      category: 'navigation',
                      shortcut: 'G V',
                      onSelect: () => alert('Go to Vehicles')
                    },
                    {
                      id: 'go-reports',
                      label: 'Go to Reports',
                      description: 'View analytics and insights',
                      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
                      category: 'navigation',
                      shortcut: 'G R',
                      onSelect: () => alert('Go to Reports')
                    },
                    // Actions
                    {
                      id: 'add-vehicle',
                      label: 'Add New Vehicle',
                      description: 'Register a vehicle in your fleet',
                      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
                      category: 'actions',
                      shortcut: 'N',
                      keywords: ['create', 'new', 'register'],
                      onSelect: () => alert('Add Vehicle')
                    },
                    {
                      id: 'log-maintenance',
                      label: 'Log Maintenance',
                      description: 'Record a service event',
                      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
                      category: 'actions',
                      shortcut: 'M',
                      keywords: ['service', 'repair', 'maintenance'],
                      onSelect: () => alert('Log Maintenance')
                    },
                    {
                      id: 'export-data',
                      label: 'Export Data',
                      description: 'Download reports as CSV or PDF',
                      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" /></svg>,
                      category: 'actions',
                      shortcut: 'E',
                      onSelect: () => alert('Export Data')
                    },
                    // Settings
                    {
                      id: 'settings',
                      label: 'Settings',
                      description: 'Configure your preferences',
                      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
                      category: 'settings',
                      shortcut: ',',
                      keywords: ['preferences', 'config'],
                      onSelect: () => alert('Settings')
                    },
                    {
                      id: 'profile',
                      label: 'Your Profile',
                      description: 'View and edit your profile',
                      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
                      category: 'settings',
                      onSelect: () => alert('Profile')
                    },
                    {
                      id: 'help',
                      label: 'Help & Support',
                      description: 'Get help using MotoMind',
                      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                      category: 'settings',
                      shortcut: '?',
                      keywords: ['support', 'docs', 'documentation'],
                      onSelect: () => alert('Help')
                    }
                  ]}
                  recent={[
                    {
                      id: 'add-vehicle',
                      label: 'Add New Vehicle',
                      description: 'Register a vehicle in your fleet',
                      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
                      onSelect: () => alert('Add Vehicle')
                    },
                    {
                      id: 'go-reports',
                      label: 'Go to Reports',
                      description: 'View analytics and insights',
                      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
                      onSelect: () => alert('Go to Reports')
                    }
                  ]}
                  categories={{
                    navigation: 'Navigate',
                    actions: 'Actions',
                    settings: 'Settings'
                  }}
                  placeholder="Search commands or type to filter..."
                  emptyMessage="No commands found. Try a different search."
                />
              </Stack>

              {/* 15. Table of Contents */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">15. Table of Contents ⭐</h2>
                <p className="text-sm text-black/60">Auto-generates navigation from page headings</p>
                
                <BaseCard padding="lg">
                  <div className="bg-slate-50 rounded-lg overflow-hidden" style={{ height: '600px' }}>
                    <div className="flex h-full">
                      {/* Table of Contents - Sidebar */}
                      <div className="w-64 bg-white border-r border-black/10 p-6 overflow-y-auto">
                        <TableOfContents
                          headings={[
                            { id: 'intro', text: 'Introduction', level: 2 },
                            { id: 'getting-started', text: 'Getting Started', level: 2 },
                            { id: 'installation', text: 'Installation', level: 3 },
                            { id: 'setup', text: 'Setup', level: 3 },
                            { id: 'features', text: 'Features', level: 2 },
                            { id: 'vehicle-tracking', text: 'Vehicle Tracking', level: 3 },
                            { id: 'maintenance', text: 'Maintenance Alerts', level: 3 },
                            { id: 'reports', text: 'Reports & Analytics', level: 3 },
                            { id: 'api', text: 'API Reference', level: 2 },
                            { id: 'endpoints', text: 'Endpoints', level: 3 },
                            { id: 'authentication', text: 'Authentication', level: 3 }
                          ]}
                          sticky={false}
                          showProgress={true}
                          autoDetect={false}
                          containerSelector="#toc-demo-content"
                          offset={20}
                        />
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 overflow-y-auto p-8 scroll-smooth" id="toc-demo-content">
                        <div className="max-w-2xl space-y-12">
                          <div>
                            <h2 id="intro" className="text-2xl font-bold text-black mb-4">Introduction</h2>
                            <p className="text-black/70 leading-relaxed mb-4">
                              MotoMind is a comprehensive fleet management solution designed to help you track, maintain, 
                              and optimize your vehicle fleet. With powerful analytics and real-time monitoring, 
                              you can make data-driven decisions.
                            </p>
                            <p className="text-black/70 leading-relaxed">
                              This guide will walk you through everything you need to know to get started with MotoMind.
                            </p>
                          </div>

                          <div>
                            <h2 id="getting-started" className="text-2xl font-bold text-black mb-4">Getting Started</h2>
                            <p className="text-black/70 leading-relaxed mb-4">
                              Follow these steps to set up your MotoMind account and start tracking your fleet.
                            </p>
                            
                            <h3 id="installation" className="text-xl font-semibold text-black mb-3 mt-6">Installation</h3>
                            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg mb-4">
                              <code>npm install @motomind/sdk</code>
                            </div>
                            <p className="text-black/70 leading-relaxed">
                              Install the MotoMind SDK to integrate with your existing systems.
                            </p>

                            <h3 id="setup" className="text-xl font-semibold text-black mb-3 mt-6">Setup</h3>
                            <p className="text-black/70 leading-relaxed">
                              Configure your environment variables and initialize the SDK with your API credentials.
                            </p>
                          </div>

                          <div>
                            <h2 id="features" className="text-2xl font-bold text-black mb-4">Features</h2>
                            <p className="text-black/70 leading-relaxed mb-4">
                              MotoMind offers a comprehensive set of features to manage your entire fleet effectively.
                            </p>

                            <h3 id="vehicle-tracking" className="text-xl font-semibold text-black mb-3 mt-6">Vehicle Tracking</h3>
                            <p className="text-black/70 leading-relaxed mb-4">
                              Real-time GPS tracking for all vehicles in your fleet. Monitor location, speed, and route history.
                            </p>
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                              <p className="text-sm text-blue-900">
                                💡 <strong>Tip:</strong> Enable geofencing to receive alerts when vehicles enter or leave specific areas.
                              </p>
                            </div>

                            <h3 id="maintenance" className="text-xl font-semibold text-black mb-3 mt-6">Maintenance Alerts</h3>
                            <p className="text-black/70 leading-relaxed">
                              Never miss a service appointment with automated maintenance reminders based on mileage, 
                              time intervals, or engine diagnostics.
                            </p>

                            <h3 id="reports" className="text-xl font-semibold text-black mb-3 mt-6">Reports & Analytics</h3>
                            <p className="text-black/70 leading-relaxed">
                              Generate detailed reports on fuel consumption, driver behavior, maintenance costs, 
                              and overall fleet performance.
                            </p>
                          </div>

                          <div>
                            <h2 id="api" className="text-2xl font-bold text-black mb-4">API Reference</h2>
                            <p className="text-black/70 leading-relaxed mb-4">
                              Integrate MotoMind with your existing systems using our REST API.
                            </p>

                            <h3 id="endpoints" className="text-xl font-semibold text-black mb-3 mt-6">Endpoints</h3>
                            <p className="text-black/70 leading-relaxed mb-2">
                              All API endpoints are available at <code className="bg-slate-100 px-2 py-1 rounded text-sm">https://api.motomind.com/v1</code>
                            </p>

                            <h3 id="authentication" className="text-xl font-semibold text-black mb-3 mt-6">Authentication</h3>
                            <p className="text-black/70 leading-relaxed">
                              Use API keys to authenticate your requests. Include your key in the Authorization header.
                            </p>
                          </div>

                          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                            <p className="text-green-900 font-medium">🎉 You've reached the end! Scroll back up to see the TOC highlight different sections.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </BaseCard>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">✨ Features Demonstrated:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Auto-highlights</strong> active section as you scroll</li>
                    <li>• <strong>Nested headings</strong> with indentation (H2, H3)</li>
                    <li>• <strong>Progress indicator</strong> shows reading completion</li>
                    <li>• <strong>Smooth scroll</strong> when clicking TOC items</li>
                    <li>• <strong>Sticky positioning</strong> (in real pages)</li>
                  </ul>
                </div>
              </Stack>

              {/* 16. Scroll Progress */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">16. Scroll Progress ⭐</h2>
                <p className="text-sm text-black/60">Reading progress indicator - Linear and circular variants</p>
                
                <Stack spacing="md">
                  {/* Linear Progress */}
                  <BaseCard padding="lg">
                    <Stack spacing="md">
                      <div>
                        <h3 className="text-lg font-semibold text-black mb-2">Linear Progress Bar</h3>
                        <p className="text-sm text-black/60 mb-4">Shows at the top of the page as you scroll</p>
                      </div>

                      <div className="relative bg-slate-50 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                        <ScrollProgress
                          color="hsl(var(--primary))"
                          height={4}
                          position="top"
                          showPercentage={true}
                          smoothing={0.15}
                          container="#linear-scroll-demo"
                        />
                        <div id="linear-scroll-demo" className="h-full overflow-y-auto p-8 scroll-smooth">
                          <div className="space-y-8">
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8">
                              <h4 className="text-xl font-bold text-black mb-3">Start Scrolling!</h4>
                              <p className="text-black/70 leading-relaxed">
                                Watch the progress bar at the top grow as you scroll down. 
                                The percentage indicator in the top-right shows your exact progress.
                              </p>
                            </div>

                            {[1, 2, 3, 4, 5, 6].map(i => (
                              <div key={i} className="bg-white border border-black/10 rounded-xl p-6">
                                <h5 className="font-semibold text-black mb-2">Section {i}</h5>
                                <p className="text-black/60 leading-relaxed">
                                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                                  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, 
                                  quis nostrud exercitation ullamco laboris.
                                </p>
                                {i === 3 && (
                                  <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-500 p-3">
                                    <p className="text-sm text-yellow-900">
                                      💡 You're halfway through! The progress bar should be around 50%.
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}

                            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                              <p className="text-green-900 font-medium">🎉 100% Complete! You've reached the bottom.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Stack>
                  </BaseCard>

                  {/* Circular Progress */}
                  <BaseCard padding="lg">
                    <Stack spacing="md">
                      <div>
                        <h3 className="text-lg font-semibold text-black mb-2">Circular Progress Indicator</h3>
                        <p className="text-sm text-black/60 mb-4">Floating circle that shows reading progress</p>
                      </div>

                      <div className="relative bg-slate-50 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                        <CircularScrollProgress
                          size={56}
                          strokeWidth={4}
                          color="hsl(var(--primary))"
                          showPercentage={true}
                          position="bottom-right"
                        />
                        <div className="h-full overflow-y-auto p-8 scroll-smooth">
                          <div className="space-y-8 max-w-2xl">
                            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-8">
                              <h4 className="text-xl font-bold text-black mb-3">Circular Progress</h4>
                              <p className="text-black/70 leading-relaxed">
                                This variant shows progress in a circular indicator at the bottom-right corner. 
                                Great for long-form content and articles.
                              </p>
                            </div>

                            {[1, 2, 3, 4, 5, 6].map(i => (
                              <div key={i} className="bg-white border border-black/10 rounded-xl p-6">
                                <h5 className="font-semibold text-black mb-2">Article Section {i}</h5>
                                <p className="text-black/60 leading-relaxed mb-3">
                                  The circular progress indicator fills up as you read through the content. 
                                  This creates a more subtle, less intrusive way to show reading progress 
                                  compared to a full-width bar.
                                </p>
                                <p className="text-black/60 leading-relaxed">
                                  Perfect for blog posts, documentation, and long-form articles where you want 
                                  to give readers a sense of how much content remains.
                                </p>
                              </div>
                            ))}

                            <div className="bg-purple-50 border border-purple-200 rounded-xl p-8 text-center">
                              <p className="text-purple-900 font-medium">✨ Scroll complete! Check the circular indicator.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Stack>
                  </BaseCard>
                </Stack>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">✨ Features:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                    <div>• Linear & circular variants</div>
                    <div>• Smooth animation</div>
                    <div>• Optional percentage display</div>
                    <div>• Customizable colors</div>
                    <div>• Position control</div>
                    <div>• Container tracking</div>
                  </div>
                </div>
              </Stack>

              {/* 17. Back to Top */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">17. Back to Top ⭐</h2>
                <p className="text-sm text-black/60">Floating button to quickly return to top</p>
                
                <BaseCard padding="lg">
                  <Stack spacing="md">
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-8 text-center">
                      <div className="mb-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg border border-black/10 mb-3">
                          <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        </div>
                      </div>
                      <h4 className="text-xl font-bold text-black mb-2">Live on This Page!</h4>
                      <p className="text-black/70 leading-relaxed mb-4">
                        The Back to Top button is active on this page. Scroll down past the demos below, 
                        and you'll see a floating button appear at the <strong>bottom-center</strong> of your screen.
                      </p>
                      <p className="text-sm text-black/60">
                        💡 Click it anytime to smoothly scroll back to the top of this page!
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-900 mb-3">✨ Features:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                        <div>• Appears after threshold (300px)</div>
                        <div>• Smooth scroll animation</div>
                        <div>• 3 position options</div>
                        <div>• 3 size variants (sm, md, lg)</div>
                        <div>• Optional label display</div>
                        <div>• Container support</div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-xs text-black/60 mb-2 font-medium">Usage:</p>
                      <code className="text-xs text-black/70 block">
                        &lt;BackToTop threshold=&#123;300&#125; position="bottom-center" size="md" /&gt;
                      </code>
                    </div>
                  </Stack>
                </BaseCard>
              </Stack>

              {/* Usage Guidelines */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">Usage Guidelines</h2>
                
                <Stack spacing="md">
                  <BaseCard padding="md">
                    <Stack spacing="sm">
                      <p className="font-semibold text-black">When to Use</p>
                      <p className="text-sm text-black/60">
                        • <strong>Breadcrumbs:</strong> Show navigation path, especially in deep hierarchies
                        <br />
                        • <strong>Pagination:</strong> List views with many items
                        <br />
                        • <strong>Tabs:</strong> Group related content that doesn't need separate pages
                        <br />
                        • <strong>Stepper:</strong> Multi-step forms and processes
                        <br />
                        • <strong>Sidebar:</strong> Persistent navigation for app sections
                        <br />
                        • <strong>Quick Links:</strong> Dashboard shortcuts to common actions
                        <br />
                        • <strong>TopNav:</strong> Main app navigation on desktop
                        <br />
                        • <strong>BottomNav:</strong> Primary navigation on mobile
                        <br />
                        • <strong>ResponsiveNav:</strong> Adaptive navigation that works across all devices
                      </p>
                    </Stack>
                  </BaseCard>

                  <BaseCard padding="md">
                    <Stack spacing="sm">
                      <p className="font-semibold text-black">Best Practices</p>
                      <p className="text-sm text-black/60">
                        ✅ Keep breadcrumbs concise (max 5 items)
                        <br />
                        ✅ Show current page in breadcrumbs without link
                        <br />
                        ✅ Use pagination for 20+ items
                        <br />
                        ✅ Limit tabs to 5-7 items
                        <br />
                        ✅ Show progress in steppers
                        <br />
                        ✅ Make navigation consistent across app
                        <br />
                        ❌ Don't use tabs for sequential processes (use stepper)
                        <br />
                        ❌ Don't hide important navigation in sidebars
                      </p>
                    </Stack>
                  </BaseCard>
                </Stack>
              </Stack>

            </Stack>
          </Section>
        </Container>
      </div>
    </>
  )
}
