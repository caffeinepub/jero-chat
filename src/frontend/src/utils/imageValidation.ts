/**
 * Image validation utilities for profile photo uploads.
 * Provides dimension checking and resolution limit enforcement.
 */

export interface ImageDimensions {
  width: number;
  height: number;
  totalPixels: number;
}

const MAX_MEGAPIXELS = 100_000_000; // 100 megapixels

/**
 * Decode an image file and return its dimensions.
 * Uses createImageBitmap for efficient decoding.
 */
export async function getImageDimensions(file: File): Promise<ImageDimensions> {
  try {
    const bitmap = await createImageBitmap(file);
    const width = bitmap.width;
    const height = bitmap.height;
    const totalPixels = width * height;
    
    // Clean up bitmap
    bitmap.close();
    
    return { width, height, totalPixels };
  } catch (error) {
    throw new Error('Failed to decode image. Please ensure the file is a valid image.');
  }
}

/**
 * Check if an image file exceeds the maximum resolution limit.
 * Returns true if the image is within the limit, false otherwise.
 */
export async function validateImageResolution(file: File): Promise<{ valid: boolean; dimensions?: ImageDimensions; error?: string }> {
  try {
    const dimensions = await getImageDimensions(file);
    
    if (dimensions.totalPixels > MAX_MEGAPIXELS) {
      return {
        valid: false,
        dimensions,
        error: `Image exceeds the 100 megapixel limit (${dimensions.width}×${dimensions.height} = ${Math.round(dimensions.totalPixels / 1_000_000)}MP)`,
      };
    }
    
    return { valid: true, dimensions };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Failed to validate image',
    };
  }
}

/**
 * Format file size in human-readable format.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
