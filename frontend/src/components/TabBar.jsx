import React from 'react';

const TabBar = ({ sessions, activeSessionId, onTabSelect }) => {
  return (
    <div className="tab-bar">
      {sessions.length === 0 ? (
        <div className="no-tabs">
          <span>No sessions</span>
        </div>
      ) : (
        <div className="tabs">
          {sessions.map((session) => (
            <button
              key={session.id}
              className={`tab ${activeSessionId === session.id ? 'active' : ''}`}
              onClick={() => onTabSelect(session.id)}
            >
              {session.title || `Session ${session.id.slice(0, 8)}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TabBar;