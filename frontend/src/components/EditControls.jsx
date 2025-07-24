import React, { useState } from 'react';
import InlineError from './InlineError';
import LoadingSpinner from './LoadingSpinner';
import { logError } from '../utils/errorHandling';
import './EditControls.css';

const EditControls = ({ 
  onEdit, 
  onUndo, 
  onRedo, 
  editMode, 
  loading,
  canUndo = false,
  canRedo = false 
}) => {
  const [prompt, setPrompt] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setPrompt('');
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    try {
      await onEdit(prompt.trim());
      setPrompt('');
      setIsEditMode(false);
    } catch (error) {
      // Error handling is done in parent component
      logError(error, 'EditControls.handleSubmitEdit');
    }
  };

  const handleUndoClick = async () => {
    try {
      await onUndo();
    } catch (error) {
      logError(error, 'EditControls.handleUndoClick');
    }
  };

  const handleRedoClick = async () => {
    try {
      await onRedo();
    } catch (error) {
      logError(error, 'EditControls.handleRedoClick');
    }
  };

  return (
    <div className="edit-controls">
      <div className="edit-controls-header">
        <h3>Table Editor</h3>
        <div className="control-buttons">
          <button
            onClick={handleUndoClick}
            disabled={!canUndo || loading}
            className={`undo-button ${loading ? 'loading' : ''}`}
            title="Undo last change"
          >
            {loading ? (
              <LoadingSpinner size="small" inline />
            ) : (
              'Undo'
            )}
          </button>
          <button
            onClick={handleRedoClick}
            disabled={!canRedo || loading}
            className={`redo-button ${loading ? 'loading' : ''}`}
            title="Redo last undone change"
          >
            {loading ? (
              <LoadingSpinner size="small" inline />
            ) : (
              'Redo'
            )}
          </button>
          {!isEditMode && (
            <button
              onClick={handleEditClick}
              disabled={loading}
              className="edit-button primary"
            >
              Edit Table
            </button>
          )}
        </div>
      </div>

      {isEditMode && (
        <div className="edit-prompt-section">
          <form onSubmit={handleSubmitEdit} className="edit-form">
            <div className="prompt-input-group">
              <label htmlFor="edit-prompt">
                Describe how you want to modify the table:
              </label>
              <textarea
                id="edit-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'Add a new column for phone numbers' or 'Remove rows where status is inactive'"
                rows={3}
                disabled={loading}
                className="prompt-textarea"
                autoFocus
              />
            </div>
            <div className="form-actions">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={loading}
                className="cancel-button"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className={`submit-button primary ${loading ? 'loading' : ''}`}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="small" inline />
                    Processing...
                  </>
                ) : (
                  'Apply Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && (
        <div className="edit-loading">
          <LoadingSpinner 
            size="medium" 
            text="Processing your request..." 
            className="edit-loading-spinner"
          />
        </div>
      )}
    </div>
  );
};

export default EditControls;