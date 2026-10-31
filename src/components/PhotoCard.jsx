import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp } from '@fortawesome/free-solid-svg-icons';

/**
 * Individual Photo Card component compliant with original assignment:
 * - Single-column horizontal card: thumbnail on LEFT, author and likes on RIGHT.
 * - Uses exact API-provided photo.download_url as image source.
 * - First image loads immediately (eager, fetchPriority="high").
 * - Remaining images use IntersectionObserver with early lead-time (rootMargin: '500px').
 * - Once activated, src is permanently retained and observer is disconnected.
 * - Independent like counter starting at 0.
 * - Preserves image dimensions and aspect ratios to prevent layout shifts.
 */
export const PhotoCard = React.memo(function PhotoCard({
  photo,
  isImmediate = false,
  loading = 'lazy',
  fetchPriority = 'auto',
  // Backwards compatibility props
  isFirst,
  isInitiallyVisible,
  priority,
}) {
  const shouldLoadImmediately =
    isImmediate ||
    loading === 'eager' ||
    isFirst ||
    priority;

  const [isVisible, setIsVisible] = useState(shouldLoadImmediately);
  const [likes, setLikes] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const containerRef = useRef(null);
  const hasActivatedRef = useRef(shouldLoadImmediately);

  // Controlled early lazy loading using IntersectionObserver
  useEffect(() => {
    if (hasActivatedRef.current) {
      return;
    }

    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      hasActivatedRef.current = true;
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasActivatedRef.current) {
          hasActivatedRef.current = true;
          setIsVisible(true);
          observer.disconnect(); // Permanently disconnect once activated
        }
      },
      {
        root: null,
        rootMargin: '500px', // Pre-fetch 500px before reaching viewport
        threshold: 0.01,
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleLike = useCallback(() => {
    setLikes((prev) => prev + 1);
  }, []);

  const handleImageError = useCallback(() => {
    setImgError(true);
  }, []);

  const handleImageLoad = useCallback(() => {
    setIsImageLoaded(true);
  }, []);

  // Use the exact API-provided download_url directly
  const imageSrc = isVisible ? photo.download_url : undefined;

  // Resolve loading attribute:
  let resolvedLoading = loading;
  if (shouldLoadImmediately) {
    resolvedLoading = 'eager';
  }

  // Resolve fetchPriority:
  let resolvedFetchPriority = fetchPriority;
  if (isFirst || (isImmediate && fetchPriority === 'high')) {
    resolvedFetchPriority = 'high';
  }

  return (
    <article className="photo-card" data-testid={`photo-card-${photo.id}`}>
      {/* Thumbnail aligned on the LEFT */}
      <div ref={containerRef} className="photo-thumbnail-container">
        {(!isImageLoaded || !isVisible) && !imgError && (
          <div className="thumbnail-skeleton" aria-hidden="true" />
        )}
        {imgError ? (
          <div className="thumbnail-fallback">
            <span>Image unavailable</span>
          </div>
        ) : (
          <img
            src={imageSrc}
            alt={`Photo by ${photo.author || 'Unknown'}`}
            className={`photo-thumbnail ${isImageLoaded ? 'loaded' : ''}`}
            width={photo.width || 400}
            height={photo.height || 260}
            loading={resolvedLoading}
            decoding="async"
            fetchpriority={resolvedFetchPriority}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
      </div>

      {/* Author and Like Information aligned on the RIGHT */}
      <div className="photo-info">
        <span className="photo-author">
          Author: {photo.author || 'Unknown'}
        </span>

        <button
          type="button"
          className="like-button"
          onClick={handleLike}
          aria-label={`Like photo by ${photo.author || 'Unknown'}. Current likes: ${likes}`}
          title="Like this photo"
        >
          <FontAwesomeIcon icon={faThumbsUp} className="thumbs-up-icon" />
          <span className="like-count" data-testid={`like-count-${photo.id}`}>
            {likes}
          </span>
        </button>
      </div>
    </article>
  );
});

export default PhotoCard;
