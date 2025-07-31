import React, { useState } from 'react';
import '../App.css';

const ReplyControls = ({ 
  onCreateReply, 
  onEditReply,
  chatData,
  loading,
  disabled 
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [prompt, setPrompt] = useState('');

  const handleCreateReply = async () => {
    if (!prompt.trim()) return;
    
    setIsCreating(true);
    try {
      await onCreateReply(prompt);
      setPrompt('');
    } catch (error) {
      console.error('Error creating reply:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditReply = async () => {
    if (!prompt.trim()) return;
    
    setIsEditing(true);
    try {
      await onEditReply(prompt);
      setPrompt('');
    } catch (error) {
      console.error('Error editing reply:', error);
    } finally {
      setIsEditing(false);
    }
  };

  const hasReply = chatData && chatData.response;

  return (
    <div className="reply-controls">
      <div className="reply-controls-header">
        <h3>Email Reply</h3>
        {hasReply && (
          <div className="reply-status">
            <span className="reply-indicator">✓ Reply Generated</span>
          </div>
        )}
      </div>

      {hasReply && (
        <div className="reply-display">
          <div className="reply-content">
            <h4>Current Reply:</h4>
            <div className="reply-text">
              {chatData.response}
            </div>
          </div>
        </div>
      )}

      <div className="reply-input-section">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            hasReply 
              ? "Describe how you want to modify the reply..." 
              : "Describe what you want to include in your reply to this email..."
          }
          className="reply-prompt-input"
          rows={4}
          disabled={loading || disabled}
        />
        
        <div className="reply-actions">
          {!hasReply ? (
            <button
              onClick={handleCreateReply}
              disabled={!prompt.trim() || isCreating || loading || disabled}
              className="reply-button create-reply"
            >
              {isCreating ? 'Generating Reply...' : 'Generate Reply'}
            </button>
          ) : (
            <button
              onClick={handleEditReply}
              disabled={!prompt.trim() || isEditing || loading || disabled}
              className="reply-button edit-reply"
            >
              {isEditing ? 'Updating Reply...' : 'Edit Reply'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReplyControls;
