/**
 * Utility for fetching audio files from direct URLs with validation
 */

const MAX_AUDIO_SIZE = 1_073_741_824; // 1 GB

export interface FetchedAudio {
  bytes: Uint8Array;
  filename: string;
  contentType: string;
}

/**
 * Extracts filename from URL or Content-Disposition header
 */
function extractFilename(url: string, contentDisposition?: string | null): string {
  // Try Content-Disposition header first
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      const filename = filenameMatch[1].replace(/['"]/g, '');
      if (filename) return filename;
    }
  }

  // Extract from URL
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const segments = pathname.split('/');
    const lastSegment = segments[segments.length - 1];
    
    if (lastSegment && lastSegment.includes('.')) {
      return decodeURIComponent(lastSegment);
    }
  } catch (e) {
    // Invalid URL, will use fallback
  }

  // Fallback
  return 'audio-track.mp3';
}

/**
 * Validates if content type is audio
 */
function isAudioContentType(contentType: string): boolean {
  return contentType.toLowerCase().startsWith('audio/');
}

/**
 * Fetches audio from a direct URL with validation
 * @param url Direct audio file URL
 * @returns Validated audio bytes, filename, and content type
 * @throws Error with user-friendly message if fetch fails
 */
export async function fetchAudioFromUrl(url: string): Promise<FetchedAudio> {
  // Validate URL format
  let urlObj: URL;
  try {
    urlObj = new URL(url);
  } catch (e) {
    throw new Error('Invalid URL. Please enter a valid direct audio file URL (e.g., https://example.com/track.mp3).');
  }

  // Only allow http/https
  if (!['http:', 'https:'].includes(urlObj.protocol)) {
    throw new Error('Invalid URL protocol. Only HTTP and HTTPS URLs are supported.');
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
    });
  } catch (e: any) {
    if (e.message.includes('CORS') || e.message.includes('NetworkError')) {
      throw new Error('Unable to fetch audio. The URL may be blocked by CORS policy or the server is unreachable. Please use a direct audio file URL that allows cross-origin requests.');
    }
    throw new Error('Network error. Please check your internet connection and try again.');
  }

  // Check response status
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Audio file not found (404). Please check the URL and try again.');
    } else if (response.status === 403) {
      throw new Error('Access forbidden (403). The server does not allow access to this file.');
    } else {
      throw new Error(`Failed to fetch audio (HTTP ${response.status}). Please check the URL and try again.`);
    }
  }

  // Check content type
  const contentType = response.headers.get('Content-Type') || '';
  if (!isAudioContentType(contentType)) {
    throw new Error('Invalid file type. The URL does not point to an audio file. Please use a direct audio file URL (e.g., .mp3, .wav, .ogg).');
  }

  // Check content length if available
  const contentLength = response.headers.get('Content-Length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > MAX_AUDIO_SIZE) {
      throw new Error(`Audio file too large (${formatBytes(size)}). Maximum file size is 1 GB. Please use a smaller audio file.`);
    }
  }

  // Fetch the actual bytes
  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await response.arrayBuffer();
  } catch (e) {
    throw new Error('Failed to download audio file. Please try again.');
  }

  // Validate final size
  if (arrayBuffer.byteLength > MAX_AUDIO_SIZE) {
    throw new Error(`Audio file too large (${formatBytes(arrayBuffer.byteLength)}). Maximum file size is 1 GB. Please use a smaller audio file.`);
  }

  if (arrayBuffer.byteLength === 0) {
    throw new Error('Audio file is empty. Please use a valid audio file URL.');
  }

  const bytes = new Uint8Array(arrayBuffer);
  const contentDisposition = response.headers.get('Content-Disposition');
  const filename = extractFilename(url, contentDisposition);

  return {
    bytes,
    filename,
    contentType,
  };
}

/**
 * Formats bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
