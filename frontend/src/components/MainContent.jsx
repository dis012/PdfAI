import React from 'react';
import TabBar from './TabBar';
import TabContent from './TabContent';
import LoadingSpinner from './LoadingSpinner';

const MainContent = ({ sessions, activeSessionId, onTabSelect, loading }) => {
  return (
    <div className="main-content">
      <TabBar 
        sessions={sessions}
        activeSessionId={activeSessionId}
        onTabSelect={onTabSelect}
      />
      <div className="content-area">
        {sessions.length === 0 ? (
          <div className="empty-state">
            <p>Upload a PDF file to get started</p>
          </div>
        ) : (
          <TabContent sessionId={activeSessionId} />
        )}
        {loading && (
          <LoadingSpinner 
            size="large" 
            text="Loading sessions..." 
            overlay={true}
            className="main-content-loading-overlay"
          />
        )}
      </div>
    </div>
  );
};

export default MainContent;