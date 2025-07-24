import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  text = '', 
  inline = false, 
  overlay = false,
  className = '' 
}) => {
  const sizeClass = `spinner-${size}`;
  const containerClass = `loading-spinner-container ${inline ? 'inline' : ''} ${overlay ? 'overlay' : ''} ${className}`;

  return (
    <div className={containerClass}>
      <div className={`loading-spinner ${sizeClass}`} role="status" aria-label="Loading">
        <span className="sr-only">Loading...</span>
      </div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;