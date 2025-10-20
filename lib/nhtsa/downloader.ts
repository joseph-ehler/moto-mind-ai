/**
 * NHTSA Data Downloader
 * 
 * Downloads official NHTSA data files from static.nhtsa.gov
 * - Complaints (FLAT_CMPL.zip)
 * - Investigations (FLAT_INV.zip)
 */

import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import AdmZip from 'adm-zip'

export class NHTSADownloader {
  private dataDir: string
  
  private sources = {
    complaints: 'https://static.nhtsa.gov/odi/ffdd/cmpl/FLAT_CMPL.zip',
    investigations: 'https://static.nhtsa.gov/odi/ffdd/inv/FLAT_INV.zip'
  }
  
  constructor(dataDir = './data/nhtsa') {
    this.dataDir = dataDir
  }
  
  /**
   * Download and extract all NHTSA data files
   */
  async downloadAll(): Promise<void> {
    console.log('📥 Starting NHTSA data download...\n')
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true })
    }
    
    // Download complaints
    await this.downloadFile('complaints', this.sources.complaints)
    
    // Download investigations
    await this.downloadFile('investigations', this.sources.investigations)
    
    console.log('\n✅ All downloads complete!')
  }
  
  /**
   * Download and extract a single file
   */
  private async downloadFile(name: string, url: string): Promise<void> {
    const zipPath = path.join(this.dataDir, `${name}.zip`)
    const extractPath = path.join(this.dataDir, name)
    
    console.log(`📦 Downloading ${name}...`)
    console.log(`   URL: ${url}`)
    
    try {
      // Download
      await this.download(url, zipPath)
      
      console.log(`\n📂 Extracting ${name}...`)
      
      // Ensure extract directory exists
      if (!fs.existsSync(extractPath)) {
        fs.mkdirSync(extractPath, { recursive: true })
      }
      
      // Extract
      const zip = new AdmZip(zipPath)
      zip.extractAllTo(extractPath, true)
      
      // Remove zip file to save space
      fs.unlinkSync(zipPath)
      
      // List extracted files
      const files = fs.readdirSync(extractPath)
      console.log(`   ✅ Extracted ${files.length} files`)
      
    } catch (error: any) {
      console.error(`   ❌ Failed to download ${name}:`, error.message)
      throw error
    }
  }
  
  /**
   * Download file with progress indicator
   */
  private download(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(dest)
      
      https.get(url, (response) => {
        // Check for redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location
          if (redirectUrl) {
            file.close()
            fs.unlinkSync(dest)
            return this.download(redirectUrl, dest).then(resolve).catch(reject)
          }
        }
        
        if (response.statusCode !== 200) {
          file.close()
          fs.unlinkSync(dest)
          return reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`))
        }
        
        const totalSize = parseInt(response.headers['content-length'] || '0')
        let downloaded = 0
        let lastUpdate = Date.now()
        
        response.on('data', (chunk) => {
          downloaded += chunk.length
          
          // Update progress every 500ms
          const now = Date.now()
          if (now - lastUpdate > 500) {
            const progress = totalSize > 0 
              ? ((downloaded / totalSize) * 100).toFixed(1)
              : '?'
            const downloadedMB = (downloaded / 1024 / 1024).toFixed(1)
            const totalMB = totalSize > 0 ? (totalSize / 1024 / 1024).toFixed(1) : '?'
            
            process.stdout.write(`\r   Progress: ${progress}% (${downloadedMB} / ${totalMB} MB)`)
            lastUpdate = now
          }
        })
        
        response.pipe(file)
        
        file.on('finish', () => {
          file.close()
          console.log('') // New line after progress
          resolve()
        })
        
        file.on('error', (err) => {
          fs.unlinkSync(dest)
          reject(err)
        })
        
      }).on('error', (err) => {
        if (fs.existsSync(dest)) {
          fs.unlinkSync(dest)
        }
        reject(err)
      })
    })
  }
  
  /**
   * Get list of extracted files for a data type
   */
  getExtractedFiles(type: 'complaints' | 'investigations'): string[] {
    const dir = path.join(this.dataDir, type)
    
    if (!fs.existsSync(dir)) {
      return []
    }
    
    return fs.readdirSync(dir)
      .filter(file => file.endsWith('.txt') || file.endsWith('.tsv'))
      .map(file => path.join(dir, file))
  }
  
  /**
   * Check if data has been downloaded
   */
  isDownloaded(type: 'complaints' | 'investigations'): boolean {
    return this.getExtractedFiles(type).length > 0
  }
  
  /**
   * Get data directory path
   */
  getDataDir(): string {
    return this.dataDir
  }
}

/**
 * Singleton instance
 */
let downloader: NHTSADownloader | null = null

export function getNHTSADownloader(): NHTSADownloader {
  if (!downloader) {
    downloader = new NHTSADownloader()
  }
  return downloader
}
