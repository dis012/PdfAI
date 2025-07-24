import React, { useState, useRef } from 'react';
import { uploadFile } from '../services/api';
import { validateFile, formatErrorMessage, logError } from '../utils/errorHandling';
import LoadingSpinner from './LoadingSpinner';

const Sidebar = ({ onUploadSuccess, onUploadError }) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Handle file selection from input
  const handleFileSelect = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle drag and drop events
  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    // Only set dragOver to false if we're leaving the upload area entirely
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setDragOver(false);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Main file upload handler
  const handleFileUpload = async (file) => {
    try {
      // Validate file before upload
      const validationError = validateFile(file);
      if (validationError) {
        onUploadError(validationError.userMessage);
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      // Create upload file object
      const uploadFileObj = {
        file: file,
        name: file.name,
        size: file.size
      };

      // Simulate upload progress (since we don't have real progress from fetch)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90; // Stop at 90% until actual upload completes
          }
          return prev + 10;
        });
      }, 200);

      // Upload file to backend
      const result = await uploadFile(uploadFileObj);

      // Clear progress interval
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        // Upload successful
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
          onUploadSuccess(result.data);
        }, 500); // Brief delay to show 100% progress
      } else {
        // Upload failed
        setUploading(false);
        setUploadProgress(0);
        onUploadError(result.error || 'Upload failed');
      }

    } catch (error) {
      logError(error, 'handleFileUpload');
      setUploading(false);
      setUploadProgress(0);
      onUploadError(formatErrorMessage(error));
    }
  };

  // Handle click on upload area to trigger file input
  const handleUploadAreaClick = () => {
    if (!uploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="sidebar">
      <h2>Upload PDF</h2>
      <div 
        className={`upload-area ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleUploadAreaClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleUploadAreaClick();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={uploading}
        />
        
        {uploading ? (
          <div className="upload-progress">
            <LoadingSpinner size="medium" className="upload-loading-spinner" />
            <p>Uploading... {uploadProgress}%</p>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="upload-prompt">
            <div className="upload-icon">📄</div>
            <p>
              {dragOver 
                ? 'Drop PDF file here' 
                : 'Drag and drop PDF files here or click to browse'
              }
            </p>
            <p className="upload-hint">Only PDF files up to 50MB are allowed</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;