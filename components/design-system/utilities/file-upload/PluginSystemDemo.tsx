/**
 * Plugin System Demo & Test Component
 * 
 * This component demonstrates the FileUpload plugin system with real examples.
 * Use this to test and verify the plugin system works correctly.
 * 
 * Usage:
 * 1. Import this component into a page
 * 2. Try uploading files
 * 3. Try pasting images (Ctrl/Cmd+V)
 * 4. Try uploading invalid files (too large, wrong type)
 * 5. Check console for plugin logs
 */

'use client'

import React, { useState } from 'react'
import { FileUpload } from './FileUpload'
import { fileValidator, imageValidator, pasteSupport } from './plugins'
import { Container, Stack, Heading, Text, Card } from '@/components/design-system'
import { Button } from '@/components/ui/button'

export function PluginSystemDemo() {
  const [scenario, setScenario] = useState<'basic' | 'validation' | 'paste' | 'combined'>('basic')
  const [files, setFiles] = useState<File[]>([])
  const [logs, setLogs] = useState<string[]>([])

  // Add log entry
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
    console.log(message)
  }

  // Clear logs
  const clearLogs = () => setLogs([])

  return (
    <Container size="md">
      <Stack spacing="xl">
        {/* Header */}
        <div>
          <Heading level="title">Plugin System Demo</Heading>
          <Text className="mt-2 text-muted-foreground">
            Test the FileUpload plugin system with different scenarios
          </Text>
        </div>

        {/* Scenario Selector */}
        <Card className="p-6">
          <Heading level="subtitle" className="mb-4">Select Test Scenario</Heading>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={scenario === 'basic' ? 'default' : 'outline'}
              onClick={() => {
                setScenario('basic')
                setFiles([])
                addLog('Switched to: Basic (No Plugins)')
              }}
            >
              Basic (No Plugins)
            </Button>
            <Button
              variant={scenario === 'validation' ? 'default' : 'outline'}
              onClick={() => {
                setScenario('validation')
                setFiles([])
                addLog('Switched to: File Validation')
              }}
            >
              File Validation
            </Button>
            <Button
              variant={scenario === 'paste' ? 'default' : 'outline'}
              onClick={() => {
                setScenario('paste')
                setFiles([])
                addLog('Switched to: Paste Support')
              }}
            >
              Paste Support
            </Button>
            <Button
              variant={scenario === 'combined' ? 'default' : 'outline'}
              onClick={() => {
                setScenario('combined')
                setFiles([])
                addLog('Switched to: Combined Plugins')
              }}
            >
              Combined Plugins
            </Button>
          </div>
        </Card>

        {/* FileUpload with Different Scenarios */}
        <Card className="p-6">
          {scenario === 'basic' && (
            <div>
              <Heading level="subtitle" className="mb-2">Scenario 1: Basic (No Plugins)</Heading>
              <Text className="mb-4 text-sm text-muted-foreground">
                Standard FileUpload without any plugins. All files accepted.
              </Text>
              <FileUpload
                label="Upload Files"
                description="Try uploading any files"
                value={files}
                onChange={(newFiles) => {
                  setFiles(newFiles)
                  addLog(`Files updated: ${newFiles.length} files`)
                }}
                multiple
                maxFiles={5}
              />
            </div>
          )}

          {scenario === 'validation' && (
            <div>
              <Heading level="subtitle" className="mb-2">Scenario 2: File Validation</Heading>
              <Text className="mb-4 text-sm text-muted-foreground">
                Only images under 5MB are allowed. Try uploading large files or PDFs to test validation.
              </Text>
              <FileUpload
                label="Upload Images (Max 5MB)"
                description="Try uploading: images (✓), large files (✗), PDFs (✗)"
                value={files}
                onChange={(newFiles) => {
                  setFiles(newFiles)
                  addLog(`Files updated: ${newFiles.length} files`)
                }}
                multiple
                maxFiles={5}
                plugins={[
                  imageValidator({
                    maxSize: 5 * 1024 * 1024, // 5MB
                    errorMessages: {
                      maxSize: 'Image is too large! Max 5MB allowed.',
                      allowedTypes: 'Only image files are accepted!'
                    }
                  })
                ]}
                onPluginEvent={(event, data) => {
                  addLog(`Plugin event: ${event} - ${JSON.stringify(data)}`)
                }}
              />
            </div>
          )}

          {scenario === 'paste' && (
            <div>
              <Heading level="subtitle" className="mb-2">Scenario 3: Paste Support</Heading>
              <Text className="mb-4 text-sm text-muted-foreground">
                Paste images from clipboard (Ctrl/Cmd+V). Copy an image and paste it here.
              </Text>
              <FileUpload
                label="Upload or Paste Images"
                description="Press Ctrl/Cmd+V to paste images from clipboard"
                value={files}
                onChange={(newFiles) => {
                  setFiles(newFiles)
                  addLog(`Files updated: ${newFiles.length} files`)
                }}
                multiple
                maxFiles={5}
                plugins={[
                  pasteSupport({
                    allowURLs: false,
                    showNotification: true
                  })
                ]}
                onPluginEvent={(event, data) => {
                  addLog(`Plugin event: ${event}`)
                }}
              />
            </div>
          )}

          {scenario === 'combined' && (
            <div>
              <Heading level="subtitle" className="mb-2">Scenario 4: Combined Plugins</Heading>
              <Text className="mb-4 text-sm text-muted-foreground">
                Paste support + validation. Only images under 10MB. Try pasting or uploading.
              </Text>
              <FileUpload
                label="Upload or Paste Images (Max 10MB)"
                description="Paste (Ctrl/Cmd+V) or upload images. Large files and non-images rejected."
                value={files}
                onChange={(newFiles) => {
                  setFiles(newFiles)
                  addLog(`Files updated: ${newFiles.length} files`)
                }}
                multiple
                maxFiles={10}
                plugins={[
                  // Order matters: validate first, then allow paste
                  fileValidator({
                    allowedTypes: ['image/*'],
                    maxSize: 10 * 1024 * 1024, // 10MB
                    minSize: 1024, // 1KB minimum
                    errorMessages: {
                      maxSize: 'Image exceeds 10MB limit',
                      minSize: 'Image is too small (min 1KB)',
                      allowedTypes: 'Only images allowed'
                    }
                  }),
                  pasteSupport({
                    allowURLs: false
                  })
                ]}
                onPluginEvent={(event, data) => {
                  addLog(`Plugin event: ${event}`)
                }}
              />
            </div>
          )}
        </Card>

        {/* Event Log */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Heading level="subtitle">Event Log</Heading>
            <Button variant="outline" size="sm" onClick={clearLogs}>
              Clear Log
            </Button>
          </div>
          
          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-auto max-h-64">
            {logs.length === 0 ? (
              <div className="text-slate-400">No events yet. Try uploading files...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Test Checklist */}
        <Card className="p-6">
          <Heading level="subtitle" className="mb-4">Test Checklist</Heading>
          <Stack spacing="sm">
            <div>
              <Text className="font-semibold">✅ Basic Functionality</Text>
              <ul className="ml-6 mt-1 text-sm text-muted-foreground space-y-1">
                <li>• Files can be uploaded normally</li>
                <li>• Files can be removed</li>
                <li>• Multiple files work</li>
              </ul>
            </div>
            
            <div>
              <Text className="font-semibold">✅ File Validation Plugin</Text>
              <ul className="ml-6 mt-1 text-sm text-muted-foreground space-y-1">
                <li>• Large files (&gt;5MB) are rejected</li>
                <li>• Non-images (PDF, etc.) are rejected</li>
                <li>• Error messages appear in console</li>
                <li>• Valid images are accepted</li>
              </ul>
            </div>
            
            <div>
              <Text className="font-semibold">✅ Paste Support Plugin</Text>
              <ul className="ml-6 mt-1 text-sm text-muted-foreground space-y-1">
                <li>• Pasting images (Ctrl/Cmd+V) works</li>
                <li>• Pasted files appear in list</li>
                <li>• Console shows paste event</li>
              </ul>
            </div>
            
            <div>
              <Text className="font-semibold">✅ Combined Plugins</Text>
              <ul className="ml-6 mt-1 text-sm text-muted-foreground space-y-1">
                <li>• Both plugins work together</li>
                <li>• Pasted files are validated</li>
                <li>• Invalid pasted files rejected</li>
                <li>• No conflicts between plugins</li>
              </ul>
            </div>
          </Stack>
        </Card>

        {/* Developer Notes */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <Heading level="subtitle" className="mb-2">Developer Notes</Heading>
          <Stack spacing="sm" className="text-sm">
            <Text>
              <strong>Console Logs:</strong> Open browser DevTools console to see detailed plugin logs
            </Text>
            <Text>
              <strong>Testing Tips:</strong>
            </Text>
            <ul className="ml-6 space-y-1 text-muted-foreground">
              <li>• Use different file types to test validation</li>
              <li>• Try files larger than limits</li>
              <li>• Copy/paste images from browser or screenshots</li>
              <li>• Check console for ❌ rejection messages</li>
              <li>• Check console for ✅ acceptance messages</li>
            </ul>
          </Stack>
        </Card>

        {/* Current Files Display */}
        {files.length > 0 && (
          <Card className="p-6">
            <Heading level="subtitle" className="mb-4">Current Files ({files.length})</Heading>
            <Stack spacing="sm">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                  <div>
                    <Text className="font-medium">{file.name}</Text>
                    <Text className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                    </Text>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFiles(prev => prev.filter((_, i) => i !== index))
                      addLog(`Removed: ${file.name}`)
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  )
}

export default PluginSystemDemo
