'use client'

import { useState } from 'react'

export default function FileUploadTest() {
  const [files, setFiles] = useState<File[]>([])
  const [clickCount, setClickCount] = useState(0)

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>VISIBLE Input Test</h1>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        NO hidden input. NO programmatic click. Direct user click on visible input.
      </p>
      
      <div style={{
        padding: '20px',
        border: '2px dashed #ccc',
        borderRadius: '8px',
        marginBottom: '20px',
        background: '#f9f9f9'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>📁 Choose File:</div>
        <input
          type="file"
          accept="image/*"
          onClick={() => {
            const newCount = clickCount + 1
            setClickCount(newCount)
            console.log('🔵 Input clicked directly - Click #', newCount)
          }}
          onChange={(e) => {
            const selectedFiles = Array.from(e.target.files || [])
            console.log('✅ onChange fired - Files:', selectedFiles.length)
            if (selectedFiles.length > 0) {
              setFiles(selectedFiles)
            }
            // DON'T reset value - this triggers macOS bug
          }}
          style={{
            fontSize: '16px',
            padding: '10px',
            cursor: 'pointer'
          }}
        />
      </div>
      
      <div style={{ padding: '10px', background: '#e3f2fd', borderRadius: '4px', marginBottom: '10px' }}>
        <strong>Total Clicks:</strong> {clickCount}
      </div>
      
      {files.length > 0 && (
        <div style={{ padding: '10px', background: '#e8f5e9', borderRadius: '4px' }}>
          <strong>✅ Selected:</strong> {files.map(f => f.name).join(', ')}
        </div>
      )}
    </div>
  )
}
