/**
 * Validates if a file is an audio file
 */
export function isAudioFile(file: File): boolean {
  return file.type.startsWith('audio/');
}

/**
 * Validates if a file size is within the 1GB limit
 */
export function isWithinSizeLimit(file: File, maxSizeBytes: number = 1_073_741_824): boolean {
  return file.size <= maxSizeBytes;
}

/**
 * Validates if bytes size is within the 1GB limit
 */
export function isBytesWithinSizeLimit(bytes: Uint8Array, maxSizeBytes: number = 1_073_741_824): boolean {
  return bytes.byteLength <= maxSizeBytes;
}

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validates audio file and returns error message if invalid
 */
export function validateAudioFile(file: File): string | null {
  if (!isAudioFile(file)) {
    return 'Invalid file type. Please select an audio file.';
  }
  
  if (!isWithinSizeLimit(file)) {
    return 'File too large. Maximum file size is 1 GB. Please upload a smaller file and try again.';
  }
  
  return null;
}

/**
 * Validates audio bytes and returns error message if invalid
 */
export function validateAudioBytes(bytes: Uint8Array, contentType: string): string | null {
  if (!contentType.toLowerCase().startsWith('audio/')) {
    return 'Invalid file type. The file must be an audio file.';
  }
  
  if (!isBytesWithinSizeLimit(bytes)) {
    return `File too large (${formatFileSize(bytes.byteLength)}). Maximum file size is 1 GB. Please use a smaller file and try again.`;
  }
  
  return null;
}
