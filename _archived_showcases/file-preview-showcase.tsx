'use client'

import * as React from 'react'
import {
  Container,
  Stack,
  Grid,
  Section,
  Flex,
  Heading,
  Text,
  Button,
  FilePreview,
  FileUpload,
  PreviewFile,
  Annotation,
  detectFileType
} from '@/components/design-system'
import { FileText, Image as ImageIcon, File, Eye } from 'lucide-react'

export default function FilePreviewShowcase() {
  const [showPreview, setShowPreview] = React.useState(false)
  const [selectedFiles, setSelectedFiles] = React.useState<PreviewFile[]>([])
  const [annotations, setAnnotations] = React.useState<Annotation[]>([])
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([])

  // Sample files for demonstration
  const sampleFiles: PreviewFile[] = [
    {
      id: '1',
      name: 'Vehicle Maintenance Report.pdf',
      type: 'pdf',
      url: '/sample-documents/maintenance-report.pdf',
      size: 245760,
      mimeType: 'application/pdf',
      uploadedAt: new Date('2024-01-15'),
      metadata: {
        category: 'maintenance',
        vehicleId: 'V123'
      }
    },
    {
      id: '2',
      name: 'Engine Photo Front.jpg',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
      size: 523400,
      mimeType: 'image/jpeg',
      uploadedAt: new Date('2024-01-16'),
      aiVision: {
        status: 'completed',
        description: 'Engine compartment showing front view with visible mechanical components including radiator, hoses, and engine block',
        detectedObjects: ['engine', 'radiator', 'hoses', 'battery', 'air filter'],
        parts: ['radiator', 'coolant reservoir', 'engine block', 'alternator'],
        damageDetected: ['minor coolant staining', 'radiator crack (right side)'],
        confidence: 0.94,
        processedAt: new Date('2024-01-16T10:15:00')
      }
    },
    {
      id: '3',
      name: 'Engine Photo Side.jpg',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800',
      size: 456200,
      mimeType: 'image/jpeg',
      uploadedAt: new Date('2024-01-16'),
      aiVision: {
        status: 'processing'
      }
    },
    {
      id: '4',
      name: 'Insurance Document.pdf',
      type: 'pdf',
      url: '/sample-documents/insurance.pdf',
      size: 189440,
      mimeType: 'application/pdf',
      uploadedAt: new Date('2024-01-10')
    },
    {
      id: '5',
      name: 'Dashboard.jpg',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800',
      size: 389120,
      mimeType: 'image/jpeg',
      uploadedAt: new Date('2024-01-18')
    }
  ]

  const handleFileUpload = (files: File[]) => {
    setUploadedFiles(files)
    
    // Convert File objects to PreviewFile format using detectFileType utility
    const previewFiles: PreviewFile[] = files.map((file, index) => ({
      id: `uploaded-${index}`,
      name: file.name,
      type: detectFileType(file.type, file.name),
      url: URL.createObjectURL(file),
      size: file.size,
      mimeType: file.type,
      uploadedAt: new Date()
    }))

    setSelectedFiles(previewFiles)
    setShowPreview(true)
  }

  // 🔥 WORKING DOWNLOAD
  const handleDownload = async (file: PreviewFile) => {
    try {
      if (file.url.startsWith('http')) {
        const response = await fetch(file.url)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        const link = document.createElement('a')
        link.href = file.url
        link.download = file.name
        link.click()
      }
      console.log('✅ Downloaded:', file.name)
      alert(`✅ Downloaded: ${file.name}`)
    } catch (error) {
      console.error('❌ Download failed:', error)
      alert('❌ Failed to download file. Please try again.')
    }
  }

  // 🔥 WORKING PRINT
  const handlePrint = (file: PreviewFile) => {
    if (file.type === 'image') {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print: ${file.name}</title>
              <style>
                @media print {
                  body { margin: 0; display: flex; justify-content: center; align-items: center; }
                  img { max-width: 100%; max-height: 100%; object-fit: contain; }
                }
              </style>
            </head>
            <body>
              <img src="${file.url}" alt="${file.name}" onload="window.print(); setTimeout(() => window.close(), 1000);" />
            </body>
          </html>
        `)
        printWindow.document.close()
      }
    } else {
      window.print()
    }
    console.log('🖨️ Printing:', file.name)
  }

  // 🔥 WORKING SHARE
  const handleShare = async (file: PreviewFile) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: file.name,
          text: `Check out this file: ${file.name}`,
          url: file.url
        })
        console.log('✅ Shared successfully')
        return
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.log('Share cancelled')
        }
      }
    }
    
    try {
      await navigator.clipboard.writeText(file.url)
      alert(`✅ Link copied to clipboard!\n\n${file.name}\n${file.url}`)
      console.log('✅ Link copied:', file.url)
    } catch (error) {
      alert(`Share this link:\n\n${file.url}`)
    }
  }

  // 🔥 WORKING ANNOTATIONS
  const handleAnnotationAdd = (annotation: Omit<Annotation, 'id' | 'createdAt'>) => {
    const newAnnotation: Annotation = {
      ...annotation,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      author: 'Current User'
    }
    setAnnotations([...annotations, newAnnotation])
    console.log('✅ Annotation added:', newAnnotation.text)
    alert(`✅ Annotation added!\n\n"${newAnnotation.text}"`)
  }

  const handleAnnotationDelete = (annotationId: string) => {
    const deletedAnnotation = annotations.find(a => a.id === annotationId)
    setAnnotations(annotations.filter(a => a.id !== annotationId))
    console.log('🗑️ Annotation deleted:', deletedAnnotation?.text)
    alert(`🗑️ Annotation deleted`)
  }

  return (
    <Container size="lg" useCase="articles">
      <Section spacing="xl">
        <Stack spacing="xl">
          {/* Header */}
          <div className="text-center">
            <Heading level="hero">File Preview Component</Heading>
            <Text className="mt-4 text-black/60">
              Professional document viewer with PDF support, image galleries, annotations, and downloads
            </Text>
            <Text className="text-sm text-black/40 mt-2">
              Perfect for viewing maintenance documents, receipts, and vehicle photos
            </Text>
          </div>

          {/* Quick Stats */}
          <Grid columns={4} gap="md">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">📄</div>
              <div className="text-sm text-blue-900">PDF Viewer</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">🖼️</div>
              <div className="text-sm text-green-900">Image Gallery</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">✏️</div>
              <div className="text-sm text-purple-900">Annotations</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-amber-600">⬇️</div>
              <div className="text-sm text-amber-900">Downloads</div>
            </div>
          </Grid>

          {/* Section 1: Quick Demo */}
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
            <Stack spacing="lg">
              <div>
                <Heading level="title">1. Quick Demo - Try It Now!</Heading>
                <Text className="text-black/60">Click any file to see the preview in action</Text>
              </div>

              <Grid columns={3} gap="md">
                {sampleFiles.slice(0, 3).map((file) => (
                  <button
                    key={file.id}
                    onClick={() => {
                      setSelectedFiles([file])
                      setShowPreview(true)
                    }}
                    className="p-4 bg-white rounded-lg border-2 border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded group-hover:bg-blue-100 transition-colors">
                        {file.type === 'pdf' ? (
                          <FileText className="h-6 w-6 text-blue-600" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{file.name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {(file.size! / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Eye className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </button>
                ))}
              </Grid>

              <Button
                onClick={() => {
                  setSelectedFiles(sampleFiles)
                  setShowPreview(true)
                }}
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview All Files
              </Button>
            </Stack>
          </div>

          {/* Section 2: Features Overview */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <div>
                <Heading level="title">2. Features Overview</Heading>
                <Text className="text-black/60">Comprehensive document viewing capabilities</Text>
              </div>

              <Grid columns={2} gap="lg">
                <Stack spacing="sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <Text className="font-medium">PDF Viewer</Text>
                      <Text className="text-sm text-black/60">
                        View PDFs with zoom, rotation, and page navigation
                      </Text>
                    </div>
                  </div>
                </Stack>

                <Stack spacing="sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-50 rounded">
                      <ImageIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <Text className="font-medium">Image Gallery</Text>
                      <Text className="text-sm text-black/60">
                        Lightbox viewer with zoom and rotation controls
                      </Text>
                    </div>
                  </div>
                </Stack>

                <Stack spacing="sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-50 rounded">
                      <span className="text-lg">✏️</span>
                    </div>
                    <div>
                      <Text className="font-medium">Annotations</Text>
                      <Text className="text-sm text-black/60">
                        Add notes and highlights to documents
                      </Text>
                    </div>
                  </div>
                </Stack>

                <Stack spacing="sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-50 rounded">
                      <span className="text-lg">⬇️</span>
                    </div>
                    <div>
                      <Text className="font-medium">Download & Print</Text>
                      <Text className="text-sm text-black/60">
                        Save and print documents directly
                      </Text>
                    </div>
                  </div>
                </Stack>
              </Grid>
            </Stack>
          </div>

          {/* Section 3: Upload & Preview Integration */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <div>
                <Heading level="title">3. Upload & Preview Integration</Heading>
                <Text className="text-black/60">
                  Seamlessly integrates with FileUpload component
                </Text>
              </div>

              <FileUpload
                label="Upload Documents"
                accept="image/*,.pdf"
                multiple
                value={uploadedFiles}
                onChange={handleFileUpload}
                showPreview
                helperText="Upload images or PDFs to preview them"
                maxSize={10485760}
              />

              {uploadedFiles.length > 0 && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <Text className="font-medium text-green-900">
                    ✓ {uploadedFiles.length} file(s) uploaded and ready to preview
                  </Text>
                </div>
              )}
            </Stack>
          </div>

          {/* Section 4: Control Options */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <div>
                <Heading level="title">4. Control Options</Heading>
                <Text className="text-black/60">Comprehensive toolbar and keyboard shortcuts</Text>
              </div>

              <Grid columns={2} gap="lg">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <Stack spacing="sm">
                    <Text className="font-medium">📋 Toolbar Controls</Text>
                    <Stack spacing="xs">
                      <Text className="text-sm text-black/60">• Zoom In/Out (25% steps)</Text>
                      <Text className="text-sm text-black/60">• Rotate (90° increments)</Text>
                      <Text className="text-sm text-black/60">• Download file</Text>
                      <Text className="text-sm text-black/60">• Print document</Text>
                      <Text className="text-sm text-black/60">• Share (if supported)</Text>
                      <Text className="text-sm text-black/60">• Toggle annotations</Text>
                    </Stack>
                  </Stack>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <Stack spacing="sm">
                    <Text className="font-medium">⌨️ Keyboard Shortcuts</Text>
                    <Stack spacing="xs">
                      <Flex justify="between" className="text-sm">
                        <Text className="text-black/60">Next file:</Text>
                        <code className="px-2 py-0.5 bg-white rounded border">→</code>
                      </Flex>
                      <Flex justify="between" className="text-sm">
                        <Text className="text-black/60">Previous file:</Text>
                        <code className="px-2 py-0.5 bg-white rounded border">←</code>
                      </Flex>
                      <Flex justify="between" className="text-sm">
                        <Text className="text-black/60">Zoom in:</Text>
                        <code className="px-2 py-0.5 bg-white rounded border">+</code>
                      </Flex>
                      <Flex justify="between" className="text-sm">
                        <Text className="text-black/60">Zoom out:</Text>
                        <code className="px-2 py-0.5 bg-white rounded border">-</code>
                      </Flex>
                      <Flex justify="between" className="text-sm">
                        <Text className="text-black/60">Close:</Text>
                        <code className="px-2 py-0.5 bg-white rounded border">Esc</code>
                      </Flex>
                    </Stack>
                  </Stack>
                </div>
              </Grid>
            </Stack>
          </div>

          {/* Section 5: Use Cases */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <div>
                <Heading level="title">5. Perfect For MotoMind</Heading>
                <Text className="text-black/60">Real-world use cases for vehicle management</Text>
              </div>

              <Grid columns={2} gap="md">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <Stack spacing="sm">
                    <Text className="font-semibold text-blue-900">📄 Maintenance Records</Text>
                    <Text className="text-sm text-blue-800">
                      View and annotate service receipts, repair orders, and maintenance logs
                    </Text>
                  </Stack>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <Stack spacing="sm">
                    <Text className="font-semibold text-green-900">🖼️ Vehicle Photos</Text>
                    <Text className="text-sm text-green-800">
                      Browse damage photos, inspection images, and before/after comparisons
                    </Text>
                  </Stack>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <Stack spacing="sm">
                    <Text className="font-semibold text-purple-900">📋 Insurance Documents</Text>
                    <Text className="text-sm text-purple-800">
                      Review insurance cards, claim forms, and policy documents
                    </Text>
                  </Stack>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg">
                  <Stack spacing="sm">
                    <Text className="font-semibold text-amber-900">🔧 Repair Estimates</Text>
                    <Text className="text-sm text-amber-800">
                      Examine detailed repair estimates and parts invoices
                    </Text>
                  </Stack>
                </div>
              </Grid>
            </Stack>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-black/60 border-t border-black/10 pt-8">
            <Text className="font-semibold">Production-Ready File Preview System</Text>
            <Text className="mt-2">
              Built for MotoMind • Supports PDF, Images, and Documents
            </Text>
            <Text className="mt-2 text-xs">
              Note: For production PDF viewing, integrate with react-pdf or PDF.js
            </Text>
          </div>
        </Stack>
      </Section>

      {/* Preview Modal */}
      {showPreview && selectedFiles.length > 0 && (
        <FilePreview
          files={selectedFiles}
          modal
          onClose={() => setShowPreview(false)}
          onDownload={handleDownload}
          onPrint={handlePrint}
          onShare={handleShare}
          allowAnnotations
          annotations={annotations}
          onAnnotationAdd={handleAnnotationAdd}
          onAnnotationDelete={handleAnnotationDelete}
          showThumbnails
          maxZoom={200}
          minZoom={50}
          zoomStep={25}
        />
      )}
    </Container>
  )
}
