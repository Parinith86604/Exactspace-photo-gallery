import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, renderHook, waitFor, act } from '@testing-library/react';
import { useInfinitePhotos } from './useInfinitePhotos';
import * as photoApi from '../services/photoApi';

describe('useInfinitePhotos hook', () => {
  const originalIntersectionObserver = global.IntersectionObserver;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.IntersectionObserver = originalIntersectionObserver;
  });

  it('keeps hasMore as true and appends all photos even for a partial response (< 10 photos)', async () => {
    // Only 2 photos returned on page 1 (partial response, fewer than page size 10)
    const partialPage1 = [
      { id: '1', author: 'Author 1', download_url: 'https://picsum.photos/id/1/200/300' },
      { id: '2', author: 'Author 2', download_url: 'https://picsum.photos/id/2/200/300' },
    ];

    const fetchSpy = vi.spyOn(photoApi, 'fetchPhotos').mockResolvedValueOnce(partialPage1);

    const { result } = renderHook(() => useInfinitePhotos());

    await waitFor(() => {
      expect(result.current.photos).toHaveLength(2);
    });

    expect(result.current.photos[0].author).toBe('Author 1');
    expect(result.current.photos[1].author).toBe('Author 2');
    // hasMore MUST remain true even when response has fewer than 10 photos
    expect(result.current.hasMore).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(1, 10);
  });

  it('continues requesting the next page after a non-empty partial response', async () => {
    // Page 1 returns 3 photos (fewer than 10)
    const page1Data = [
      { id: '1', author: 'Author 1', download_url: 'https://picsum.photos/id/1/200/300' },
      { id: '2', author: 'Author 2', download_url: 'https://picsum.photos/id/2/200/300' },
      { id: '3', author: 'Author 3', download_url: 'https://picsum.photos/id/3/200/300' },
    ];

    // Page 2 returns 2 more photos
    const page2Data = [
      { id: '4', author: 'Author 4', download_url: 'https://picsum.photos/id/4/200/300' },
      { id: '5', author: 'Author 5', download_url: 'https://picsum.photos/id/5/200/300' },
    ];

    const fetchSpy = vi.spyOn(photoApi, 'fetchPhotos')
      .mockResolvedValueOnce(page1Data)
      .mockResolvedValueOnce(page2Data);

    let observerCallback;
    const observeSpy = vi.fn();

    global.IntersectionObserver = class {
      constructor(callback) {
        observerCallback = callback;
      }
      observe(target) {
        observeSpy(target);
      }
      unobserve() {}
      disconnect() {}
    };

    // Component mounting a real DOM sentinel element attached to sentinelRef
    let hookResult;
    function TestSentinelComponent() {
      hookResult = useInfinitePhotos();
      return React.createElement('div', {
        ref: hookResult.sentinelRef,
        'data-testid': 'sentinel',
      });
    }

    render(React.createElement(TestSentinelComponent));

    // Wait for page 1 to load
    await waitFor(() => {
      expect(hookResult.photos).toHaveLength(3);
    });
    expect(hookResult.hasMore).toBe(true);

    // Wait for the sentinel to be observed once initial loading is finished
    await waitFor(() => {
      expect(observeSpy).toHaveBeenCalled();
      expect(typeof observerCallback).toBe('function');
    });

    // Simulate observer intersection triggering page 2
    await act(async () => {
      observerCallback([{ isIntersecting: true }]);
    });

    // Verify page 2 was fetched and appended
    await waitFor(() => {
      expect(hookResult.photos).toHaveLength(5);
    });

    expect(hookResult.photos.map((p) => p.id)).toEqual(['1', '2', '3', '4', '5']);
    expect(fetchSpy).toHaveBeenCalledWith(2, 10);
    expect(hookResult.hasMore).toBe(true);
  });

  it('stops fetching and sets hasMore to false ONLY when the API returns an empty array', async () => {
    // Initial fetch returns empty array
    vi.spyOn(photoApi, 'fetchPhotos').mockResolvedValueOnce([]);

    const { result } = renderHook(() => useInfinitePhotos());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.photos).toHaveLength(0);
    expect(result.current.hasMore).toBe(false);
  });

  it('captures network errors and allows retrying', async () => {
    vi.spyOn(photoApi, 'fetchPhotos')
      .mockRejectedValueOnce(new Error('Network offline'))
      .mockResolvedValueOnce([
        { id: '10', author: 'Recovered Author', download_url: 'https://picsum.photos/id/10/200/300' }
      ]);

    const { result } = renderHook(() => useInfinitePhotos());

    await waitFor(() => {
      expect(result.current.error).toBe('Network offline');
    });

    expect(result.current.photos).toHaveLength(0);

    // Call retry
    await act(async () => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.photos).toHaveLength(1);
    });

    expect(result.current.photos[0].author).toBe('Recovered Author');
    expect(result.current.hasMore).toBe(true);
  });
});
