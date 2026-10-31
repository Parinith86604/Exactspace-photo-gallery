import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchPhotos, getOptimizedImageUrl } from './photoApi';

describe('photoApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches photos with default page and limit', async () => {
    const mockData = [
      { id: '10', author: 'Paul Jarvis', download_url: 'https://picsum.photos/id/10/2500/1667' },
      { id: '11', author: 'Dan Rubin', download_url: 'https://picsum.photos/id/11/2500/1667' },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchPhotos(1, 10);

    expect(global.fetch).toHaveBeenCalledWith('https://picsum.photos/v2/list?page=1&limit=10', {});
    expect(result).toEqual(mockData);
  });

  it('passes custom page and limit correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    await fetchPhotos(3, 20);

    expect(global.fetch).toHaveBeenCalledWith('https://picsum.photos/v2/list?page=3&limit=20', {});
  });

  it('throws an error when HTTP status is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchPhotos(1)).rejects.toThrow('Failed to load photos (Status: 500 Internal Server Error)');
  });

  it('throws an error if response body is not an array', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'unexpected object' }),
    });

    await expect(fetchPhotos(1)).rejects.toThrow('Unexpected API response format: expected an array.');
  });

  it('derives appropriately sized 800x500 Picsum URLs preserving the photo ID', () => {
    // With numeric or string ID
    expect(getOptimizedImageUrl('10')).toBe('https://picsum.photos/id/10/800/500');
    expect(getOptimizedImageUrl(42)).toBe('https://picsum.photos/id/42/800/500');

    // With photo object
    const photoObj = { id: '99', author: 'Test', download_url: 'https://picsum.photos/id/99/4000/3000' };
    expect(getOptimizedImageUrl(photoObj)).toBe('https://picsum.photos/id/99/800/500');

    // Custom dimensions if specified
    expect(getOptimizedImageUrl('10', 600, 400)).toBe('https://picsum.photos/id/10/600/400');
  });
});
