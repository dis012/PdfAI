import { useState, useEffect, useRef } from 'react'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import ErrorBoundary from './components/ErrorBoundary'
import ToastContainer, { setToastContainerRef, showErrorToast, showSuccessToast } from './components/ToastContainer'
import { getSessions } from './services/api'
import { logError } from './utils/errorHandling'
import './App.css'

function App() {
  // Global state for sessions and active session
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [loading, setLoading] = useState(false)
  const toastContainerRef = useRef(null)

  // Initialize toast container reference
  useEffect(() => {
    if (toastContainerRef.current) {
      setToastContainerRef(toastContainerRef.current);
    }
  }, [])

  // Fetch existing sessions on app load
  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true)
      try {
        const result = await getSessions()
        if (result.success && result.data) {
          setSessions(result.data)
          // If there are sessions but no active session, select the first one
          if (result.data.length > 0 && !activeSessionId) {
            setActiveSessionId(result.data[0].id)
          }
        } else {
          logError(new Error(result.error || 'Failed to fetch sessions'), 'App.fetchSessions')
          showErrorToast(result.error || 'Failed to load sessions. Please refresh the page.')
        }
      } catch (error) {
        logError(error, 'App.fetchSessions')
        showErrorToast('Unable to connect to server. Please check your connection and try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, []) // Empty dependency array means this runs once on mount

  // Handler functions for state management (to be used by child components)
  const handleUploadSuccess = (uploadResponse) => {
    // Create a new session object from the upload response
    // The upload response should contain session information
    const newSession = {
      id: uploadResponse.session_id || uploadResponse.id || Date.now().toString(),
      title: uploadResponse.title || uploadResponse.filename || `Session ${Date.now()}`,
      created_at: uploadResponse.created_at || new Date().toISOString()
    }

    setSessions(prev => [...prev, newSession])
    setActiveSessionId(newSession.id)
    showSuccessToast(`Successfully uploaded ${newSession.title}`)
  }

  const handleTabSelect = (sessionId) => {
    setActiveSessionId(sessionId)
  }

  const handleUploadError = (error) => {
    logError(new Error(error), 'App.handleUploadError')
    showErrorToast(error || 'File upload failed. Please try again.')
  }

  const handleGlobalError = (error, errorInfo) => {
    logError(error, 'App.ErrorBoundary')
    showErrorToast('An unexpected error occurred. The page will be reloaded.')
  }

  return (
    <ErrorBoundary
      context="Application"
      onError={handleGlobalError}
      userMessage="Something went wrong with the application. Please try refreshing the page."
    >
      <div className="app">
        <ErrorBoundary
          context="Sidebar"
          userMessage="There was an issue with the file upload area."
        >
          <Sidebar
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </ErrorBoundary>

        <ErrorBoundary
          context="MainContent"
          userMessage="There was an issue displaying the table content."
        >
          <MainContent
            sessions={sessions}
            activeSessionId={activeSessionId}
            onTabSelect={handleTabSelect}
            loading={loading}
          />
        </ErrorBoundary>

        <ToastContainer ref={toastContainerRef} />
      </div>
    </ErrorBoundary>
  )
}

export default App
