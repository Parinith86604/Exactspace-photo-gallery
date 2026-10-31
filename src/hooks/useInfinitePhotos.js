import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchPhotos } from '../services/photoApi';

const PAGE_SIZE = 10;

/**
 * Optimized custom hook for:
 * - Fetching paginated Picsum photos
 * - Infinite scrolling with IntersectionObserver
 * - Preventing duplicate photos & avoiding unnecessary re-renders
 * - Concurrency guarding against redundant requests
 * - Stopping ONLY when the API returns an empty array
 */
export function useInfinitePhotos() {
  const [photos, setPhotos] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  // Prevent multiple simultaneous API requests
  const isFetchingRef = useRef(false);

  // Track termination status immediately without waiting for state re-render
  const hasMoreRef = useRef(true);

  // Keep a stable ref to the current target page
  const pageRef = useRef(page);
  pageRef.current = page;

  // Reference to the bottom sentinel element
  const sentinelRef = useRef(null);

  /**
   * Fetch photos from a specific API page.
   */
  const loadPhotos = useCallback(async (targetPage) => {
    // Prevent duplicate requests and requests after the feed ends
    if (isFetchingRef.current || !hasMoreRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const newItems = await fetchPhotos(targetPage, PAGE_SIZE);

      // Validate the API response
      if (!Array.isArray(newItems)) {
        throw new Error('Invalid response received from the photo API.');
      }

      // Stop fetching ONLY when the API returns an empty array
      if (newItems.length === 0) {
        hasMoreRef.current = false;
        setHasMore(false);
        return;
      }

      // Append new photos while preventing duplicate IDs
      setPhotos((prevPhotos) => {
        const seenIds = new Set(prevPhotos.map((photo) => photo.id));
        const uniqueNewItems = [];

        for (const item of newItems) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            uniqueNewItems.push(item);
          }
        }

        // Avoid triggering re-render if no unique items were found
        if (uniqueNewItems.length === 0) {
          return prevPhotos;
        }

        return [...prevPhotos, ...uniqueNewItems];
      });

      // Continue pagination after every non-empty response,
      // including responses containing fewer than PAGE_SIZE items
      setPage(targetPage + 1);

    } catch (err) {
      // Ignore aborted requests
      if (err?.name !== 'AbortError') {
        setError(
          err?.message || 'An error occurred while fetching photos.'
        );
      }

    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  /**
   * Fetch the first page when the component mounts.
   */
  useEffect(() => {
    loadPhotos(1);
  }, [loadPhotos]);

  /**
   * Retry the failed page without skipping it.
   */
  const retry = useCallback(() => {
    if (!isFetchingRef.current && hasMoreRef.current) {
      loadPhotos(pageRef.current);
    }
  }, [loadPhotos]);

  /**
   * Set up IntersectionObserver for infinite scrolling.
   * Uses bottom-only rootMargin to prevent triggering before the user reaches the bottom.
   */
  useEffect(() => {
    const sentinel = sentinelRef.current;

    // Do not create an observer when conditions unmet or while initial loading is in progress
    if (
      !sentinel ||
      !hasMore ||
      isLoading ||
      error ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (
          entry.isIntersecting &&
          !isFetchingRef.current &&
          hasMoreRef.current
        ) {
          loadPhotos(pageRef.current);
        }
      },
      {
        root: null,
        rootMargin: '0px 0px 100px 0px', // Trigger only when within 100px of bottom
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    // Clean up observer when dependencies change or component unmounts
    return () => {
      observer.disconnect();
    };

  }, [hasMore, isLoading, error, loadPhotos]);

  return {
    photos,
    isLoading,
    hasMore,
    error,
    retry,
    sentinelRef,
  };
}
