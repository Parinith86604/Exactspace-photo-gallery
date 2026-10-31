import React from 'react';

/**
 * Loading spinner indicator shown during initial load or infinite scroll fetching.
 */
export function LoadingIndicator({ message = 'Loading photos...' }) {
  return (
    <div className="loading-container" role="status" aria-live="polite">
      <div className="loading-spinner" />
      <span className="loading-text">{message}</span>
    </div>
  );
}

export default LoadingIndicator;
