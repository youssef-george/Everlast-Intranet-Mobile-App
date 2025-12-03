import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Safari compatibility check
if (typeof window !== 'undefined') {
  // Log browser info for debugging
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (isSafari) {
    console.log('🌐 Safari detected - using compatibility mode');
  }
  
  // Suppress Chrome extension message errors and workbox verbose logs (harmless)
  const originalError = console.error;
  const originalLog = console.log;
  
  console.error = (...args) => {
    const message = args[0]?.toString() || '';
    // Suppress Chrome extension async message errors
    if (
      message.includes('listener indicated an asynchronous response') ||
      message.includes('message channel closed') ||
      message.includes('runtime.lastError') ||
      // Suppress 404 errors that are already handled gracefully
      message.includes('Request failed with status code 404') ||
      message.includes('Failed to fetch users') ||
      message.includes('GET http://localhost:3001/users') ||
      message.includes('ERR_BAD_REQUEST')
    ) {
      return; // Suppress these harmless/handled errors
    }
    originalError.apply(console, args);
  };
  
  // Suppress workbox verbose logs (informational, not errors)
  console.log = (...args) => {
    const message = args[0]?.toString() || '';
    // Suppress workbox router logs (they're just informational)
    if (
      message.includes('workbox Router is responding to') ||
      message.includes('workbox Using') ||
      message.includes('workbox Precaching') ||
      message.includes('workbox During precaching') ||
      message.includes('Download the React DevTools') ||
      message.includes('View mode changed:') ||
      message.includes('Selected department:') ||
      message.includes('Filter:') ||
      message.includes('Departments:') ||
      message.includes('Rendering department card:') ||
      message.includes('Card clicked:') ||
      message.includes('Department clicked:')
    ) {
      return; // Suppress these informational/debug messages
    }
    originalLog.apply(console, args);
  };
  
  // Handle unhandled errors (but filter out Chrome extension errors)
  window.addEventListener('error', (event) => {
    const errorMessage = event.message || '';
    // Don't log Chrome extension errors
    if (
      errorMessage.includes('listener indicated an asynchronous response') ||
      errorMessage.includes('message channel closed') ||
      errorMessage.includes('runtime.lastError')
    ) {
      event.preventDefault(); // Prevent default error handling
      return;
    }
    console.error('Global error:', event.error);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.toString() || '';
    // Don't log Chrome extension errors
    if (
      reason.includes('listener indicated an asynchronous response') ||
      reason.includes('message channel closed') ||
      reason.includes('runtime.lastError')
    ) {
      event.preventDefault(); // Prevent default error handling
      return;
    }
    console.error('Unhandled promise rejection:', event.reason);
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
