import React, { useState, useCallback, useRef } from 'react';
import Toast from './Toast';

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = ++toastIdRef.current;
    const newToast = {
      id,
      message,
      type,
      duration,
      timestamp: Date.now()
    };

    setToasts(prev => {
      // Limit to maximum 4 toasts
      const updatedToasts = [...prev, newToast];
      return updatedToasts.slice(-4);
    });

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Expose methods to parent components via ref
  React.useImperativeHandle(ToastContainer.ref, () => ({
    addToast,
    removeToast,
    clearAllToasts
  }));

  return (
    <div className="toast-container">
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
          show={true}
        />
      ))}
    </div>
  );
};

// Create a singleton instance for global toast management
let toastContainerRef = null;

export const setToastContainerRef = (ref) => {
  toastContainerRef = ref;
};

// Global toast functions
export const showToast = (message, type = 'info', duration = 5000) => {
  if (toastContainerRef) {
    return toastContainerRef.addToast(message, type, duration);
  }
  console.warn('Toast container not initialized');
  return null;
};

export const showSuccessToast = (message, duration = 4000) => {
  return showToast(message, 'success', duration);
};

export const showErrorToast = (message, duration = 6000) => {
  return showToast(message, 'error', duration);
};

export const showWarningToast = (message, duration = 5000) => {
  return showToast(message, 'warning', duration);
};

export const showInfoToast = (message, duration = 4000) => {
  return showToast(message, 'info', duration);
};

export const clearAllToasts = () => {
  if (toastContainerRef) {
    toastContainerRef.clearAllToasts();
  }
};

export default ToastContainer;