import React, { useState, useEffect, useRef } from 'react';
import '../App.css';

const ConversationPanel = ({
  messages,
  onAskQuestion,
  loading,
  disabled
}) => {
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    setIsAsking(true);
    try {
      await onAskQuestion(question);
      setQuestion('');
    } catch (error) {
      console.error('Error asking question:', error);
    } finally {
      setIsAsking(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  return (
    <div className="conversation-panel">
      <div className="conversation-header">
        <h3>Ask Questions About This Email</h3>
        <div className="conversation-info">
          <span className="message-count">
            {messages.length > 0 ? `${Math.floor(messages.length / 2)} Q&A pairs` : 'Start a conversation'}
          </span>
        </div>
      </div>

      <div className="conversation-messages">
        {messages.length === 0 ? (
          <div className="conversation-empty">
            <p>No questions yet. Ask anything about the email content!</p>
            <div className="conversation-suggestions">
              <p className="suggestions-title">Try asking:</p>
              <ul>
                <li>"What is the main topic of this email?"</li>
                <li>"When is the deadline mentioned?"</li>
                <li>"Who is the sender?"</li>
                <li>"Summarize the key points"</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
              >
                <div className="message-header">
                  <span className="message-role">
                    {msg.role === 'user' ? '👤 You' : '🤖 AI Assistant'}
                  </span>
                  <span className="message-time">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-content">
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="conversation-input-section">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question about the email content..."
          className="conversation-input"
          rows={3}
          disabled={loading || disabled || isAsking}
        />

        <div className="conversation-actions">
          <button
            onClick={handleAskQuestion}
            disabled={!question.trim() || isAsking || loading || disabled}
            className="conversation-button ask-question"
          >
            {isAsking ? 'Asking...' : 'Ask Question'}
          </button>
          <div className="input-hint">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationPanel;
