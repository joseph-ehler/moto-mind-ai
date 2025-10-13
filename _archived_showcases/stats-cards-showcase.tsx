/**
 * Stats/Metrics Cards Showcase
 */

import React, { useState } from 'react'
import Head from 'next/head'
import {
  Container,
  Section,
  Stack,
  StatCard,
  TrendIndicator,
  Sparkline,
  MetricWithSparkline,
  ComparisonCard,
  ProgressMetric,
  MultiMetricCard,
  KPICard,
  StatGroup,
  AnimatedCounter,
  // Elite features
  AreaChartCard,
  BarChartCard,
  RadialProgress,
  GaugeChart,
  TimeRangeSelector,
  DistributionCard,
  RealTimeStat,
  HeatmapCard,
  DeltaStat,
  CompositeDashboardCard,
  TimeRange
} from '@/components/design-system'

export default function StatsCardsShowcasePage() {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('7d')
  return (
    <>
      <Head>
        <title>Stats/Metrics Cards - MotoMind Design System</title>
        <meta name="description" content="Stats and metrics card components" />
      </Head>

      <div className="min-h-screen bg-slate-50">
        <Container size="md" useCase="articles">
          <Section spacing="xl">
            <Stack spacing="2xl">
              
              {/* Page Title */}
              <div className="text-center">
                <h1 className="text-4xl font-bold text-black mb-4">Stats/Metrics Cards</h1>
                <p className="text-lg text-black/60">30 elite dashboard components with advanced charts and visualizations</p>
              </div>

              {/* 1. Basic Stat Cards */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">1. Basic Stat Cards</h2>
                <p className="text-sm text-black/60">Simple metric display with trends</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard
                    label="Total Vehicles"
                    value={12}
                    trend={{ value: 15, direction: 'up', label: 'vs last month' }}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    }
                  />
                  <StatCard
                    label="Active Maintenance"
                    value={3}
                    trend={{ value: 2, direction: 'down', label: 'vs last week' }}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    }
                  />
                  <StatCard
                    label="Total Miles"
                    value="45,230"
                    trend={{ value: 8, direction: 'up', label: 'this month' }}
                    description="Across all vehicles"
                  />
                </div>
              </Stack>

              {/* 2. Trend Indicators */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">2. Trend Indicators</h2>
                <p className="text-sm text-black/60">Show direction and percentage change</p>
                
                <div className="bg-white border border-black/5 rounded-2xl p-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <TrendIndicator value={12} direction="up" label="increase" />
                    <TrendIndicator value={5} direction="down" label="decrease" />
                    <TrendIndicator value={0} direction="neutral" label="no change" />
                  </div>
                </div>
              </Stack>

              {/* 3. Sparklines */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">3. Sparklines</h2>
                <p className="text-sm text-black/60">Mini charts for visualizing trends</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white border border-black/5 rounded-xl p-4">
                    <div className="text-xs text-black/60 mb-2">Fuel Costs</div>
                    <Sparkline data={[100, 120, 110, 140, 130, 150, 145]} color="blue" showDots />
                  </div>
                  <div className="bg-white border border-black/5 rounded-xl p-4">
                    <div className="text-xs text-black/60 mb-2">Miles Driven</div>
                    <Sparkline data={[200, 220, 210, 240, 230, 250, 245]} color="green" />
                  </div>
                  <div className="bg-white border border-black/5 rounded-xl p-4">
                    <div className="text-xs text-black/60 mb-2">Maintenance</div>
                    <Sparkline data={[50, 60, 55, 65, 70, 60, 55]} color="purple" showDots />
                  </div>
                  <div className="bg-white border border-black/5 rounded-xl p-4">
                    <div className="text-xs text-black/60 mb-2">Expenses</div>
                    <Sparkline data={[300, 280, 320, 310, 330, 320, 340]} color="red" />
                  </div>
                </div>
              </Stack>

              {/* 4. Metric with Sparkline */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">4. Metric with Sparkline</h2>
                <p className="text-sm text-black/60">Combined metric and chart</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MetricWithSparkline
                    label="Monthly Fuel Costs"
                    value="$342"
                    sparklineData={[280, 300, 290, 320, 310, 342]}
                    trend={{ value: 12, direction: 'up' }}
                    sparklineColor="blue"
                  />
                  <MetricWithSparkline
                    label="Average MPG"
                    value={32.4}
                    sparklineData={[28, 30, 29, 31, 32, 32.4]}
                    trend={{ value: 8, direction: 'up' }}
                    sparklineColor="green"
                  />
                </div>
              </Stack>

              {/* 5. Comparison Cards */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">5. Comparison Cards</h2>
                <p className="text-sm text-black/60">Compare current vs previous period</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ComparisonCard
                    label="Miles Driven"
                    current={{ label: 'This month', value: 1250 }}
                    previous={{ label: 'Last month', value: 980 }}
                    unit="miles"
                  />
                  <ComparisonCard
                    label="Maintenance Events"
                    current={{ label: 'This quarter', value: 8 }}
                    previous={{ label: 'Last quarter', value: 12 }}
                    unit="events"
                  />
                </div>
              </Stack>

              {/* 6. Progress Metrics */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">6. Progress Metrics</h2>
                <p className="text-sm text-black/60">Track progress towards goals</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ProgressMetric
                    label="Annual Maintenance Budget"
                    current={7500}
                    target={10000}
                    unit="USD"
                    color="blue"
                  />
                  <ProgressMetric
                    label="Fuel Efficiency Goal"
                    current={32}
                    target={35}
                    unit="MPG"
                    color="green"
                  />
                </div>
              </Stack>

              {/* 7. Multi-Metric Cards */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">7. Multi-Metric Cards</h2>
                <p className="text-sm text-black/60">Multiple related metrics in one card</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MultiMetricCard
                    title="Fleet Overview"
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    }
                    metrics={[
                      { label: 'Active Vehicles', value: 8, trend: { value: 2, direction: 'up' } },
                      { label: 'In Maintenance', value: 3 },
                      { label: 'Total Miles', value: '45.2K' }
                    ]}
                  />
                  <MultiMetricCard
                    title="This Month"
                    metrics={[
                      { label: 'Fuel Costs', value: '$1,234' },
                      { label: 'Maintenance', value: '$850' },
                      { label: 'Total Expenses', value: '$2,084', trend: { value: 12, direction: 'up' } }
                    ]}
                  />
                </div>
              </Stack>

              {/* 8. KPI Cards */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">8. KPI Cards</h2>
                <p className="text-sm text-black/60">Key Performance Indicators with status</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <KPICard
                    label="Average MPG"
                    value={32.4}
                    target={30}
                    status="success"
                    trend={{ value: 8, direction: 'up' }}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    }
                  />
                  <KPICard
                    label="Maintenance On Time"
                    value="85%"
                    target={90}
                    status="warning"
                    trend={{ value: 3, direction: 'down' }}
                  />
                  <KPICard
                    label="Fleet Utilization"
                    value="67%"
                    target={80}
                    status="danger"
                    trend={{ value: 5, direction: 'down' }}
                  />
                </div>
              </Stack>

              {/* 9. Stat Group */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">9. Stat Group</h2>
                <p className="text-sm text-black/60">Grid layout for multiple stats</p>
                
                <StatGroup
                  columns={4}
                  stats={[
                    { label: 'Total Vehicles', value: 12 },
                    { label: 'Active', value: 8, trend: { value: 2, direction: 'up' } },
                    { label: 'Maintenance', value: 3 },
                    { label: 'Inactive', value: 1, trend: { value: 1, direction: 'down' } }
                  ]}
                />
              </Stack>

              {/* 10. Animated Counter */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">10. Animated Counter</h2>
                <p className="text-sm text-black/60">Numbers that count up on render</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-black/5 rounded-2xl p-6">
                    <div className="text-sm text-black/60 mb-2">Revenue</div>
                    <div className="text-3xl font-bold text-black">
                      <AnimatedCounter end={12345} duration={1500} prefix="$" />
                    </div>
                  </div>
                  <div className="bg-white border border-black/5 rounded-2xl p-6">
                    <div className="text-sm text-black/60 mb-2">Average MPG</div>
                    <div className="text-3xl font-bold text-black">
                      <AnimatedCounter end={32.4} duration={1500} decimals={1} />
                    </div>
                  </div>
                  <div className="bg-white border border-black/5 rounded-2xl p-6">
                    <div className="text-sm text-black/60 mb-2">Total Miles</div>
                    <div className="text-3xl font-bold text-black">
                      <AnimatedCounter end={45230} duration={1500} suffix=" mi" />
                    </div>
                  </div>
                </div>
              </Stack>

              {/* ELITE FEATURES */}
              <div className="text-center py-8 border-y border-black/10">
                <h2 className="text-3xl font-bold text-black mb-2">⚡ Elite Features</h2>
                <p className="text-lg text-black/60">Advanced charts and visualizations</p>
              </div>

              {/* 11. Area Chart Card */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">11. Area Chart Card</h2>
                <p className="text-sm text-black/60">Smooth area chart with gradient fill</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AreaChartCard
                    label="Monthly Revenue"
                    value="$12,450"
                    data={[
                      { name: 'Jan', value: 8000 },
                      { name: 'Feb', value: 9500 },
                      { name: 'Mar', value: 8800 },
                      { name: 'Apr', value: 11200 },
                      { name: 'May', value: 10500 },
                      { name: 'Jun', value: 12450 }
                    ]}
                    trend={{ value: 15, direction: 'up' }}
                    color="blue"
                  />
                  <AreaChartCard
                    label="Miles Driven"
                    value={45230}
                    data={[
                      { name: 'Week 1', value: 6800 },
                      { name: 'Week 2', value: 7200 },
                      { name: 'Week 3', value: 7500 },
                      { name: 'Week 4', value: 8100 }
                    ]}
                    trend={{ value: 12, direction: 'up' }}
                    color="green"
                  />
                </div>
              </Stack>

              {/* 12. Bar Chart Card */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">12. Bar Chart Card</h2>
                <p className="text-sm text-black/60">Horizontal bar chart for comparisons</p>
                
                <BarChartCard
                  label="Vehicles by Type"
                  data={[
                    { label: 'Sedans', value: 5, color: 'bg-blue-600' },
                    { label: 'SUVs', value: 4, color: 'bg-green-600' },
                    { label: 'Trucks', value: 2, color: 'bg-purple-600' },
                    { label: 'Motorcycles', value: 1, color: 'bg-amber-600' }
                  ]}
                />
              </Stack>

              {/* 13. Radial Progress */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">13. Radial Progress</h2>
                <p className="text-sm text-black/60">Circular progress indicators</p>
                
                <div className="bg-white border border-black/5 rounded-2xl p-6">
                  <div className="flex flex-wrap justify-around items-center gap-8">
                    <RadialProgress value={75} label="Fuel Efficiency" color="blue" />
                    <RadialProgress value={60} label="Maintenance Score" color="green" size={100} />
                    <RadialProgress value={90} label="Safety Rating" color="purple" size={140} strokeWidth={10} />
                  </div>
                </div>
              </Stack>

              {/* 14. Gauge Chart */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">14. Gauge Chart</h2>
                <p className="text-sm text-black/60">Semicircular gauge with needle</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <GaugeChart value={32} min={0} max={40} label="MPG" status="success" />
                  <GaugeChart value={65} min={0} max={100} label="Battery %" status="warning" />
                  <GaugeChart value={85} min={0} max={100} label="Health Score" />
                </div>
              </Stack>

              {/* 15. Time Range Selector */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">15. Time Range Selector</h2>
                <p className="text-sm text-black/60">Filter data by time period</p>
                
                <div className="bg-white border border-black/5 rounded-2xl p-6">
                  <div className="flex flex-col items-center gap-4">
                    <TimeRangeSelector
                      selected={selectedRange}
                      onChange={setSelectedRange}
                    />
                    <p className="text-sm text-black/60">Selected: {selectedRange}</p>
                  </div>
                </div>
              </Stack>

              {/* 16. Distribution Card */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">16. Distribution Card</h2>
                <p className="text-sm text-black/60">Show data distribution with visual bar</p>
                
                <DistributionCard
                  label="Maintenance by Type"
                  data={[
                    { label: 'Oil Change', value: 12 },
                    { label: 'Tire Rotation', value: 8 },
                    { label: 'Brake Service', value: 5 },
                    { label: 'Inspection', value: 10 },
                    { label: 'Other', value: 3 }
                  ]}
                />
              </Stack>

              {/* 17. Real-Time Stat */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">17. Real-Time Stat</h2>
                <p className="text-sm text-black/60">Live updating statistics</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <RealTimeStat
                    label="Current Speed"
                    getValue={() => Math.floor(Math.random() * 120)}
                    updateInterval={2000}
                    formatValue={(v) => `${v} mph`}
                  />
                  <RealTimeStat
                    label="Engine Temp"
                    getValue={() => Math.floor(190 + Math.random() * 10)}
                    updateInterval={1500}
                    formatValue={(v) => `${v}°F`}
                  />
                  <RealTimeStat
                    label="Active Users"
                    getValue={() => Math.floor(1200 + Math.random() * 100)}
                    updateInterval={3000}
                  />
                </div>
              </Stack>

              {/* 18. Heatmap Card */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">18. Heatmap Card</h2>
                <p className="text-sm text-black/60">Activity intensity over time</p>
                
                <HeatmapCard
                  label="Driving Activity (Last 12 Weeks)"
                  weeks={12}
                  data={Array.from({ length: 84 }, (_, i) => ({
                    date: new Date(Date.now() - (84 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
                    value: Math.floor(Math.random() * 100),
                    max: 100
                  }))}
                />
              </Stack>

              {/* 19. Delta Stat */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">19. Delta Stat</h2>
                <p className="text-sm text-black/60">Shows absolute and percentage change</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DeltaStat
                    label="Monthly Revenue"
                    current={12450}
                    previous={10800}
                    format={(v) => `$${v.toLocaleString()}`}
                    goodDirection="up"
                  />
                  <DeltaStat
                    label="Maintenance Costs"
                    current={850}
                    previous={1200}
                    format={(v) => `$${v.toLocaleString()}`}
                    goodDirection="down"
                  />
                  <DeltaStat
                    label="Average MPG"
                    current={32.4}
                    previous={29.8}
                    format={(v) => v.toFixed(1)}
                    goodDirection="up"
                  />
                </div>
              </Stack>

              {/* 20. Composite Dashboard Card */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">20. Composite Dashboard Card</h2>
                <p className="text-sm text-black/60">Multiple visualizations in one card</p>
                
                <CompositeDashboardCard
                  title="Fleet Performance Overview"
                  primaryMetric={{ label: 'Total Fleet Value', value: '$245,000' }}
                  charts={[
                    { type: 'radial', data: 75, label: 'Utilization' },
                    { type: 'progress', data: 60, label: 'Maintenance' },
                    { type: 'sparkline', data: [10, 20, 15, 30, 25, 35], label: 'Trend' }
                  ]}
                />
              </Stack>

              {/* Usage Guidelines */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">Usage Guidelines</h2>
                
                <Stack spacing="md">
                  <div className="bg-white border border-black/5 rounded-2xl p-6">
                    <Stack spacing="sm">
                      <p className="font-semibold text-black">When to Use</p>
                      <p className="text-sm text-black/60">
                        • <strong>StatCard:</strong> Single metric displays on dashboards
                        <br />
                        • <strong>Sparklines:</strong> Quick visual trends without full charts
                        <br />
                        • <strong>Comparison:</strong> Period-over-period analysis
                        <br />
                        • <strong>Progress:</strong> Goals and targets tracking
                        <br />
                        • <strong>KPI:</strong> Critical metrics with status indicators
                        <br />
                        • <strong>Multi-Metric:</strong> Related metrics grouped together
                      </p>
                    </Stack>
                  </div>

                  <div className="bg-white border border-black/5 rounded-2xl p-6">
                    <Stack spacing="sm">
                      <p className="font-semibold text-black">Best Practices</p>
                      <p className="text-sm text-black/60">
                        ✅ Use consistent units and formatting
                        <br />
                        ✅ Show trends for meaningful comparisons
                        <br />
                        ✅ Keep labels clear and concise
                        <br />
                        ✅ Use colors consistently (green=good, red=bad)
                        <br />
                        ✅ Group related metrics together
                        <br />
                        ✅ Add loading states for async data
                        <br />
                        ❌ Don't overload with too many metrics
                        <br />
                        ❌ Don't use misleading scales on sparklines
                      </p>
                    </Stack>
                  </div>
                </Stack>
              </Stack>

            </Stack>
          </Section>
        </Container>
      </div>
    </>
  )
}
