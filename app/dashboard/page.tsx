import { Container, Section, Stack, Heading } from '@/components/design-system'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { TopNav } from '@/components/nav/TopNav'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      
      <Container size="lg" useCase="dashboard">
        <Section spacing="xl">
          <Stack spacing="xl" className="py-8">
            <div>
              <Heading level="hero">Dashboard</Heading>
              <p className="mt-2 text-lg text-gray-600">
                Welcome to MotoMind! Your vehicle management dashboard.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Vehicles</CardTitle>
                  <CardDescription>Manage your vehicles</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Add and track your vehicles here.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Maintenance</CardTitle>
                  <CardDescription>Track maintenance records</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Keep your vehicles in top condition.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>View insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Get insights into your fleet.
                  </p>
                </CardContent>
              </Card>
            </div>
          </Stack>
        </Section>
      </Container>
    </div>
  )
}
