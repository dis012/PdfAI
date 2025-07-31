import React, { useState, useEffect } from 'react';
import TableDisplay from './TableDisplay';
import EditControls from './EditControls';
import ReplyControls from './ReplyControls';
import InlineError from './InlineError';
import LoadingSpinner from './LoadingSpinner';
import { getTableData, editTable, undoTableEdit, redoTableEdit, getChat, createReply, editReply } from '../services/api';
import { showErrorToast, showSuccessToast } from './ToastContainer';
import { logError } from '../utils/errorHandling';
import './TabContent.css';

const TabContent = ({ sessionId }) => {
  const [tableState, setTableState] = useState(null);
  const [chatData, setChatData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editError, setEditError] = useState(null);
  const [chatError, setChatError] = useState(null);

  // Fetch table data when sessionId changes
  useEffect(() => {
    if (!sessionId) {
      setTableState(null);
      setError(null);
      return;
    }

    const fetchTableData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await getTableData(sessionId);
        
        if (result.success && result.data) {
          setTableState(result.data);
        } else {
          const errorMessage = result.error || 'Failed to fetch table data';
          setError(errorMessage);
          setTableState(null);
          logError(new Error(errorMessage), 'TabContent.fetchTableData');
          showErrorToast(errorMessage);
        }
      } catch (err) {
        const errorMessage = 'An unexpected error occurred while fetching table data';
        logError(err, 'TabContent.fetchTableData');
        setError(errorMessage);
        setTableState(null);
        showErrorToast(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    const fetchChatData = async () => {
      setChatLoading(true);
      setChatError(null);
      
      try {
        const result = await getChat(sessionId);
        
        if (result.success && result.data) {
          setChatData(result.data);
        } else {
          // No chat data exists yet, which is normal
          setChatData(null);
        }
      } catch (err) {
        // Chat not existing is not an error
        setChatData(null);
      } finally {
        setChatLoading(false);
      }
    };

    fetchTableData();
    fetchChatData();
  }, [sessionId]);

  // Handle create reply operation
  const handleCreateReply = async (prompt) => {
    if (!sessionId || !prompt.trim()) return;

    setChatLoading(true);
    setChatError(null);

    try {
      const result = await createReply(sessionId, { prompt: prompt.trim() });
      
      if (result.success && result.data) {
        setChatData(result.data);
        showSuccessToast('Reply generated successfully');
      } else {
        const errorMessage = result.error || 'Failed to create reply';
        setChatError(errorMessage);
        logError(new Error(errorMessage), 'TabContent.handleCreateReply');
        showErrorToast(errorMessage);
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred while creating the reply';
      logError(err, 'TabContent.handleCreateReply');
      setChatError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setChatLoading(false);
    }
  };

  // Handle edit reply operation
  const handleEditReply = async (prompt) => {
    if (!sessionId || !prompt.trim()) return;

    setChatLoading(true);
    setChatError(null);

    try {
      const result = await editReply(sessionId, { prompt: prompt.trim() });
      
      if (result.success && result.data) {
        setChatData(result.data);
        showSuccessToast('Reply updated successfully');
      } else {
        const errorMessage = result.error || 'Failed to edit reply';
        setChatError(errorMessage);
        logError(new Error(errorMessage), 'TabContent.handleEditReply');
        showErrorToast(errorMessage);
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred while editing the reply';
      logError(err, 'TabContent.handleEditReply');
      setChatError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setChatLoading(false);
    }
  };

  // Handle edit table operation
  const handleEdit = async (prompt) => {
    if (!sessionId || !prompt.trim()) return;

    setEditLoading(true);
    setEditError(null);

    try {
      const result = await editTable(sessionId, prompt.trim());
      
      if (result.success && result.data) {
        setTableState(result.data);
        showSuccessToast('Table updated successfully');
      } else {
        const errorMessage = result.error || 'Failed to edit table';
        setEditError(errorMessage);
        logError(new Error(errorMessage), 'TabContent.handleEdit');
        showErrorToast(errorMessage);
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred while editing the table';
      logError(err, 'TabContent.handleEdit');
      setEditError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  // Handle undo operation
  const handleUndo = async () => {
    if (!sessionId) return;

    setEditLoading(true);
    setEditError(null);

    try {
      const result = await undoTableEdit(sessionId);
      
      if (result.success && result.data) {
        setTableState(result.data);
        showSuccessToast('Changes undone successfully');
      } else {
        const errorMessage = result.error || 'Failed to undo changes';
        setEditError(errorMessage);
        logError(new Error(errorMessage), 'TabContent.handleUndo');
        showErrorToast(errorMessage);
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred while undoing changes';
      logError(err, 'TabContent.handleUndo');
      setEditError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  // Handle redo operation
  const handleRedo = async () => {
    if (!sessionId) return;

    setEditLoading(true);
    setEditError(null);

    try {
      const result = await redoTableEdit(sessionId);
      
      if (result.success && result.data) {
        setTableState(result.data);
        showSuccessToast('Changes redone successfully');
      } else {
        const errorMessage = result.error || 'Failed to redo changes';
        setEditError(errorMessage);
        logError(new Error(errorMessage), 'TabContent.handleRedo');
        showErrorToast(errorMessage);
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred while redoing changes';
      logError(err, 'TabContent.handleRedo');
      setEditError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  // Handle case where no session is selected
  if (!sessionId) {
    return (
      <div className="tab-content-empty">
        <p>Select a tab to view content</p>
      </div>
    );
  }

  // Handle loading state
  if (loading) {
    return (
      <div className="tab-content-loading">
        <LoadingSpinner 
          size="large" 
          text="Loading table data..." 
          className="tab-content-loading-spinner"
        />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="tab-content-error">
        <h3>Error Loading Table Data</h3>
        <InlineError 
          error={error}
          onRetry={() => {
            // Retry by triggering useEffect again
            setError(null);
            setTableState(null);
          }}
          retryText="Retry"
        />
      </div>
    );
  }

  // Handle case where no table data is available
  if (!tableState) {
    return (
      <div className="tab-content-empty">
        <p>No table data available for this session</p>
      </div>
    );
  }

  // Render table data with edit controls
  return (
    <div className="tab-content">
      <EditControls
        onEdit={handleEdit}
        onUndo={handleUndo}
        onRedo={handleRedo}
        loading={editLoading}
        canUndo={tableState?.canUndo || false}
        canRedo={tableState?.canRedo || false}
      />
      
      {editError && (
        <InlineError 
          error={editError}
          onRetry={() => setEditError(null)}
          retryText="Dismiss"
          className="edit-error"
        />
      )}

      <ReplyControls
        onCreateReply={handleCreateReply}
        onEditReply={handleEditReply}
        chatData={chatData}
        loading={chatLoading}
        disabled={!sessionId}
      />
      
      {chatError && (
        <InlineError 
          error={chatError}
          onRetry={() => setChatError(null)}
          retryText="Dismiss"
          className="chat-error"
        />
      )}
      
      <TableDisplay 
        data={tableState?.rows}
        loading={loading || editLoading}
      />
    </div>
  );
};

export default TabContent;