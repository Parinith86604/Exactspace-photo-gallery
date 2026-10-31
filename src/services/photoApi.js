/**
 * Service to fetch photos from the Picsum API.
 * Handles pagination and network errors gracefully.
 */

const BASE_URL = 'https://picsum.photos/v2/list';

/**
 * Fetches a list of photos for the given page.
 * @param {number} page - Page number to fetch (1-indexed).
 * @param {number} limit - Number of photos per page (default: 10).
 * @param {AbortSignal} [signal] - Optional AbortController signal.
 * @returns {Promise<Array>} Array of photo objects from Picsum.
 */
export async function fetchPhotos(page = 1, limit = 10, signal = null) {
  const url = `${BASE_URL}?page=${page}&limit=${limit}`;

  const options = signal ? { signal } : {};
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Failed to load photos (Status: ${response.status} ${response.statusText})`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('Unexpected API response format: expected an array.');
  }

  return data;
}

/**
 * Derives an appropriately sized Picsum image URL (approximately 800x500 pixels)
 * preserving the photo's original Picsum ID for high-performance card display.
 * @param {string|number|object} photoOrId - Photo ID or photo object with an id/download_url.
 * @param {number} [width=800] - Target width in pixels.
 * @param {number} [height=500] - Target height in pixels.
 * @returns {string} Resized Picsum image URL.
 */
export function getOptimizedImageUrl(photoOrId, width = 800, height = 500) {
  if (photoOrId === undefined || photoOrId === null) return '';
  const id = typeof photoOrId === 'object' && photoOrId !== null ? photoOrId.id : photoOrId;
  return `https://picsum.photos/id/${id}/${width}/${height}`;
}
