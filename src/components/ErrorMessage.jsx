import React from 'react';

/**
 * Error message component with retry functionality.
 */
export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-container" role="alert">
      <div className="error-icon" aria-hidden="true">⚠️</div>
      <p className="error-message">{message || 'Failed to fetch photos. Please check your network connection.'}</p>
      {onRetry && (
        <button type="button" className="retry-button" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
