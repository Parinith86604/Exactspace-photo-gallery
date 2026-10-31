import React from 'react';
import { GalleryHeader } from './components/GalleryHeader';
import { PhotoCard } from './components/PhotoCard';
import { LoadingIndicator } from './components/LoadingIndicator';
import { ErrorMessage } from './components/ErrorMessage';
import { useInfinitePhotos } from './hooks/useInfinitePhotos';

export function App() {
  const {
    photos,
    isLoading,
    hasMore,
    error,
    retry,
    sentinelRef,
  } = useInfinitePhotos();

  return (
    <div className="app-container">
      <GalleryHeader />

      <main className="gallery-main">
        {/* Single column photo feed per original assignment */}
        <section className="photo-list" aria-label="Photo list">
          {photos.map((photo, index) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              isImmediate={index === 0}
              loading={index === 0 ? 'eager' : 'lazy'}
              fetchPriority={index === 0 ? 'high' : 'auto'}
            />
          ))}
        </section>

        {/* Empty state when no photos found */}
        {!isLoading && photos.length === 0 && !error && (
          <div className="empty-gallery">
            <p>No photos available at the moment.</p>
          </div>
        )}

        {/* Error message with retry button */}
        {error && (
          <ErrorMessage message={error} onRetry={retry} />
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <LoadingIndicator
            message={photos.length === 0 ? 'Loading photo gallery...' : 'Loading more photos...'}
          />
        )}

        {/* Infinite Scroll Sentinel element */}
        {hasMore && !error && (
          <div
            ref={sentinelRef}
            className="scroll-sentinel"
            aria-hidden="true"
          />
        )}

        {/* End of Gallery */}
        {!hasMore && photos.length > 0 && (
          <div className="end-of-gallery" role="status">
            You have reached the end of the gallery.
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
