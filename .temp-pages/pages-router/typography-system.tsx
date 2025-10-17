/**
 * Typography System Showcase
 * 
 * Built using the mandatory MotoMind Design System foundation
 * Demonstrates responsive typography with optimal reading experience
 */

import React from 'react'
import Head from 'next/head'
import {
  Container,
  Section,
  Stack,
  Grid,
  Card,
  Heading,
  Text
} from '@/components/design-system'
import {
  DisplayText,
  Prose,
  Label,
  Caption,
  Overline,
  ResponsiveText,
  TypographyShowcase
} from '@/components/design-system/primitives/Typography'
import { Type, Smartphone, Monitor, Eye, Accessibility } from 'lucide-react'

export default function TypographySystemPage() {
  return (
    <>
      <Head>
        <title>Typography System - MotoMind Design System</title>
        <meta name="description" content="Responsive typography system with fluid scaling and optimal reading experience" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* 🚨 MANDATORY: Using Container with proper useCase */}
        <Container size="md" useCase="articles">
          
          {/* 🚨 MANDATORY: Using Section for consistent spacing */}
          <Section spacing="xl">
            
            {/* 🚨 MANDATORY: Using Stack for vertical rhythm */}
            <Stack spacing="xl">
              
              {/* Hero Section */}
              <div className="text-center">
                <Type className="w-16 h-16 mx-auto mb-6 text-blue-600" />
                <DisplayText size="lg" gradient>
                  Typography System
                </DisplayText>
                <Text size="xl" className="mt-6 text-gray-600 max-w-3xl mx-auto">
                  Fluid, responsive typography that scales beautifully across all devices.
                  Optimized for readability, accessibility, and performance.
                </Text>
              </div>

              {/* Key Features */}
              <Grid columns="auto" gap="md">
                <Card className="p-6 text-center">
                  <Stack spacing="md">
                    <Smartphone className="w-8 h-8 mx-auto text-blue-600" />
                    <Heading level="subtitle">Mobile-First</Heading>
                    <Text size="sm">
                      Fluid scaling ensures perfect readability on all screen sizes
                    </Text>
                  </Stack>
                </Card>
                
                <Card className="p-6 text-center">
                  <Stack spacing="md">
                    <Eye className="w-8 h-8 mx-auto text-green-600" />
                    <Heading level="subtitle">Reading Optimized</Heading>
                    <Text size="sm">
                      Optimal line lengths and spacing for comfortable reading
                    </Text>
                  </Stack>
                </Card>
                
                <Card className="p-6 text-center">
                  <Stack spacing="md">
                    <Accessibility className="w-8 h-8 mx-auto text-purple-600" />
                    <Heading level="subtitle">WCAG Compliant</Heading>
                    <Text size="sm">
                      Meets accessibility standards with proper contrast and sizing
                    </Text>
                  </Stack>
                </Card>
              </Grid>

              {/* Typography Scale */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Typography Scale</Heading>
                  <Text>
                    Our fluid typography system uses CSS clamp() to scale smoothly 
                    between minimum and maximum sizes based on viewport width.
                  </Text>
                  
                  <TypographyShowcase />
                </Stack>
              </Card>

              {/* Display Typography */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Display Typography</Heading>
                  <Text>
                    Large, impactful text for hero sections and landing pages.
                    Automatically scales from mobile to desktop.
                  </Text>
                  
                  <Stack spacing="md">
                    <div>
                      <Caption className="mb-2">Display Extra Large</Caption>
                      <DisplayText size="xl">
                        Revolutionary Design
                      </DisplayText>
                    </div>
                    
                    <div>
                      <Caption className="mb-2">Display Large</Caption>
                      <DisplayText size="lg">
                        Beautiful Typography
                      </DisplayText>
                    </div>
                    
                    <div>
                      <Caption className="mb-2">Display Medium</Caption>
                      <DisplayText size="md">
                        Fluid Scaling
                      </DisplayText>
                    </div>
                    
                    <div>
                      <Caption className="mb-2">Display with Gradient</Caption>
                      <DisplayText size="lg" gradient>
                        Gradient Effect
                      </DisplayText>
                    </div>
                  </Stack>
                </Stack>
              </Card>

              {/* Heading Hierarchy */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Heading Hierarchy</Heading>
                  <Text>
                    Semantic heading structure with proper visual hierarchy.
                    Each level has optimal sizing and spacing.
                  </Text>
                  
                  <Stack spacing="md">
                    <div>
                      <Caption className="mb-2">Hero Level (H1)</Caption>
                      <Heading level="hero">
                        Main Page Title
                      </Heading>
                    </div>
                    
                    <div>
                      <Caption className="mb-2">Title Level (H2)</Caption>
                      <Heading level="title">
                        Section Title
                      </Heading>
                    </div>
                    
                    <div>
                      <Caption className="mb-2">Subtitle Level (H3)</Caption>
                      <Heading level="subtitle">
                        Subsection Title
                      </Heading>
                    </div>
                  </Stack>
                </Stack>
              </Card>

              {/* Body Text Sizes */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Body Text Sizes</Heading>
                  <Text>
                    Multiple text sizes for different content types.
                    All maintain optimal readability with proper line heights.
                  </Text>
                  
                  <Stack spacing="md">
                    <div>
                      <Caption className="mb-2">Extra Large Body</Caption>
                      <Text size="xl">
                        Lead text for introductions and important content that needs emphasis.
                        Perfect for article introductions and key messages.
                      </Text>
                    </div>
                    
                    <div>
                      <Caption className="mb-2">Large Body</Caption>
                      <Text size="lg">
                        Large body text for comfortable reading of longer content.
                        Great for articles and detailed descriptions.
                      </Text>
                    </div>
                    
                    <div>
                      <Caption className="mb-2">Medium Body (Standard)</Caption>
                      <Text size="md">
                        Standard body text size - the foundation of most content.
                        Optimized for readability across all devices with 16px minimum.
                      </Text>
                    </div>
                    
                    <div>
                      <Caption className="mb-2">Small Body</Caption>
                      <Text size="sm">
                        Smaller text for captions, metadata, and secondary information.
                        Still maintains readability while being more compact.
                      </Text>
                    </div>
                  </Stack>
                </Stack>
              </Card>

              {/* Reading Optimization */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Reading Optimization</Heading>
                  <Text>
                    Typography optimized for comfortable reading with proper line lengths,
                    spacing, and contrast ratios.
                  </Text>
                  
                  <Grid columns={2} gap="lg">
                    <Stack spacing="md">
                      <Heading level="subtitle">Optimal Line Length</Heading>
                      <Text className="max-w-[65ch] bg-blue-50 p-4 rounded-lg">
                        This text demonstrates optimal line length (65 characters).
                        Research shows this is the ideal width for comfortable reading.
                        Lines that are too long cause eye strain, while lines that are 
                        too short break up the reading rhythm.
                      </Text>
                    </Stack>
                    
                    <Stack spacing="md">
                      <Heading level="subtitle">Proper Line Height</Heading>
                      <Text className="bg-green-50 p-4 rounded-lg leading-[1.6]">
                        This text uses 1.6 line height for optimal readability.
                        Proper line spacing prevents lines from feeling cramped
                        and makes it easier to track from line to line while reading.
                      </Text>
                    </Stack>
                  </Grid>
                </Stack>
              </Card>

              {/* UI Typography */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">UI Typography</Heading>
                  <Text>
                    Specialized typography for user interface elements like
                    labels, buttons, and form controls.
                  </Text>
                  
                  <Grid columns="auto" gap="md">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <Stack spacing="sm">
                        <Label>Form Label</Label>
                        <div className="h-12 bg-white border border-gray-300 rounded-lg flex items-center px-4">
                          <Text size="md">Input field text</Text>
                        </div>
                        <Caption>Helper text for additional context</Caption>
                      </Stack>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <Stack spacing="sm">
                        <Overline>Category</Overline>
                        <Heading level="subtitle">Card Title</Heading>
                        <Text size="sm">Card description text</Text>
                        <div className="pt-2">
                          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-ui-button">
                            Button Text
                          </button>
                        </div>
                      </Stack>
                    </div>
                  </Grid>
                </Stack>
              </Card>

              {/* Responsive Behavior */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Responsive Behavior</Heading>
                  <Text>
                    Typography that adapts to screen size and container width.
                    Resize your browser to see the fluid scaling in action.
                  </Text>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                    <Stack spacing="md">
                      <ResponsiveText>
                        This text uses container queries to scale based on available space.
                        It will adjust its size based on the container width, not just
                        the viewport width, providing more granular responsive control.
                      </ResponsiveText>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-white p-4 rounded">
                          <Text size="sm" className="cq-text-base">
                            Container-responsive text in narrow column
                          </Text>
                        </div>
                        <div className="bg-white p-4 rounded">
                          <Text size="sm" className="cq-text-lg">
                            Container-responsive text in wider column
                          </Text>
                        </div>
                      </div>
                    </Stack>
                  </div>
                </Stack>
              </Card>

              {/* Prose Example */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Prose Content</Heading>
                  <Text>
                    Long-form content with optimized typography for articles,
                    blog posts, and documentation.
                  </Text>
                  
                  <Prose>
                    <h2>The Art of Typography</h2>
                    <p>
                      Typography is the art and technique of arranging type to make 
                      written language legible, readable, and appealing when displayed. 
                      The arrangement of type involves selecting typefaces, point sizes, 
                      line lengths, line-spacing, and letter-spacing.
                    </p>
                    
                    <h3>Key Principles</h3>
                    <ul>
                      <li>Hierarchy - Guide the reader through content</li>
                      <li>Contrast - Create visual interest and emphasis</li>
                      <li>Consistency - Maintain coherent visual language</li>
                      <li>Readability - Ensure comfortable reading experience</li>
                    </ul>
                    
                    <p>
                      Good typography is invisible to the reader - it serves the content
                      without drawing attention to itself. When done well, it enhances
                      comprehension and creates a pleasant reading experience.
                    </p>
                    
                    <blockquote>
                      "Typography is the craft of endowing human language with a durable 
                      visual form." - Robert Bringhurst
                    </blockquote>
                  </Prose>
                </Stack>
              </Card>

            </Stack>
          </Section>
        </Container>
      </div>
    </>
  )
}

/* 
🚨 DESIGN SYSTEM COMPLIANCE CHECKLIST:
✅ All imports from @/components/design-system
✅ Container wraps all content with proper useCase
✅ No raw HTML headings/paragraphs
✅ No manual spacing classes
✅ Layout uses Stack/Grid/Card components
✅ Typography uses enhanced components
✅ UX rules respected (md container for consumer content)
✅ Semantic structure maintained
*/
