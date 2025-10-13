/**
 * EXIF Utilities
 * 
 * Handle EXIF metadata extraction and orientation correction
 * Critical for mobile photos which often have incorrect orientation
 */

/**
 * EXIF orientation values
 * https://sirv.com/help/articles/rotate-photos-to-be-upright/
 */
export enum ExifOrientation {
  Normal = 1,          // 0° - Normal
  FlipHorizontal = 2,  // 0° + flip horizontal
  Rotate180 = 3,       // 180° rotation
  FlipVertical = 4,    // 180° + flip horizontal
  FlipHV90 = 5,        // 90° + flip horizontal
  Rotate90 = 6,        // 90° clockwise
  FlipHV270 = 7,       // 270° + flip horizontal
  Rotate270 = 8        // 270° clockwise (90° counter-clockwise)
}

/**
 * Get EXIF orientation from image file
 * 
 * Reads the first 64KB of the file to extract EXIF orientation tag
 * This is critical for mobile photos which are often rotated
 * 
 * @param file - Image file to read
 * @returns EXIF orientation value (1-8), or 1 if not found
 */
export async function getExifOrientation(file: File): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const view = new DataView(e.target?.result as ArrayBuffer)
        
        // Check if JPEG (starts with 0xFFD8)
        if (view.getUint16(0, false) !== 0xFFD8) {
          resolve(ExifOrientation.Normal)
          return
        }
        
        const length = view.byteLength
        let offset = 2
        
        // Scan for APP1 marker (0xFFE1) which contains EXIF
        while (offset < length) {
          if (view.getUint16(offset + 2, false) <= 8) {
            resolve(ExifOrientation.Normal)
            return
          }
          
          const marker = view.getUint16(offset, false)
          offset += 2
          
          if (marker === 0xFFE1) {
            // Found APP1 marker - read EXIF
            const exifOffset = offset + 8
            const tiffOffset = exifOffset
            
            // Check byte order (II = little endian, MM = big endian)
            const littleEndian = view.getUint16(tiffOffset, false) === 0x4949
            
            // Get IFD0 offset
            const ifdOffset = view.getUint32(tiffOffset + 4, littleEndian)
            
            // Get number of tags
            const tagCount = view.getUint16(tiffOffset + ifdOffset, littleEndian)
            
            // Scan tags for orientation (tag 0x0112)
            for (let i = 0; i < tagCount; i++) {
              const tagOffset = tiffOffset + ifdOffset + 2 + i * 12
              const tag = view.getUint16(tagOffset, littleEndian)
              
              if (tag === 0x0112) {
                // Found orientation tag
                const orientation = view.getUint16(tagOffset + 8, littleEndian)
                resolve(orientation)
                return
              }
            }
          }
          
          // Move to next marker
          offset += view.getUint16(offset, false)
        }
        
        resolve(ExifOrientation.Normal)
      } catch (error) {
        console.error('Error reading EXIF orientation:', error)
        resolve(ExifOrientation.Normal)
      }
    }
    
    reader.onerror = () => resolve(ExifOrientation.Normal)
    
    // Only read first 64KB (EXIF is always in first segment)
    reader.readAsArrayBuffer(file.slice(0, 64 * 1024))
  })
}

/**
 * Apply EXIF orientation transformation to canvas context
 * 
 * Applies the correct rotation and mirroring to display image correctly
 * Must be called BEFORE drawing the image
 * 
 * @param ctx - Canvas 2D context
 * @param orientation - EXIF orientation value (1-8)
 * @param width - Canvas width
 * @param height - Canvas height
 */
export function applyExifOrientation(
  ctx: CanvasRenderingContext2D,
  orientation: number,
  width: number,
  height: number
): void {
  switch (orientation) {
    case ExifOrientation.FlipHorizontal:
      // Horizontal flip
      ctx.translate(width, 0)
      ctx.scale(-1, 1)
      break
      
    case ExifOrientation.Rotate180:
      // 180° rotation
      ctx.translate(width, height)
      ctx.rotate(Math.PI)
      break
      
    case ExifOrientation.FlipVertical:
      // Vertical flip
      ctx.translate(0, height)
      ctx.scale(1, -1)
      break
      
    case ExifOrientation.FlipHV90:
      // Vertical flip + 90° rotate
      ctx.rotate(0.5 * Math.PI)
      ctx.scale(1, -1)
      break
      
    case ExifOrientation.Rotate90:
      // 90° clockwise
      ctx.rotate(0.5 * Math.PI)
      ctx.translate(0, -height)
      break
      
    case ExifOrientation.FlipHV270:
      // Horizontal flip + 90° rotate
      ctx.rotate(0.5 * Math.PI)
      ctx.translate(width, -height)
      ctx.scale(-1, 1)
      break
      
    case ExifOrientation.Rotate270:
      // 270° clockwise (90° counter-clockwise)
      ctx.rotate(-0.5 * Math.PI)
      ctx.translate(-width, 0)
      break
      
    case ExifOrientation.Normal:
    default:
      // No transformation needed
      break
  }
}

/**
 * Check if orientation requires swapped dimensions
 * 
 * Orientations 5-8 rotate the image 90° or 270°, so width and height are swapped
 * 
 * @param orientation - EXIF orientation value
 * @returns true if dimensions should be swapped
 */
export function orientationSwapsDimensions(orientation: number): boolean {
  return orientation >= 5 && orientation <= 8
}

/**
 * Get rotation angle from EXIF orientation
 * 
 * @param orientation - EXIF orientation value
 * @returns Rotation angle in degrees (0, 90, 180, 270)
 */
export function getRotationAngle(orientation: number): number {
  switch (orientation) {
    case ExifOrientation.Rotate90:
    case ExifOrientation.FlipHV90:
      return 90
    case ExifOrientation.Rotate180:
      return 180
    case ExifOrientation.Rotate270:
    case ExifOrientation.FlipHV270:
      return 270
    default:
      return 0
  }
}

/**
 * Check if orientation includes mirroring
 * 
 * @param orientation - EXIF orientation value
 * @returns true if orientation includes flip/mirror
 */
export function orientationIncludesMirror(orientation: number): boolean {
  return [
    ExifOrientation.FlipHorizontal,
    ExifOrientation.FlipVertical,
    ExifOrientation.FlipHV90,
    ExifOrientation.FlipHV270
  ].includes(orientation)
}
