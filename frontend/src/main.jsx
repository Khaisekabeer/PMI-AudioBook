import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';

// Get Google Client ID from environment variables
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  console.error('Google Client ID is not set. Please check your .env file');
} else {
  console.log('Google Client ID loaded successfully');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* The provider loads the Google Identity Services script itself. */}
    <GoogleOAuthProvider
      clientId={GOOGLE_CLIENT_ID}
      onScriptLoadError={() => console.error('Failed to load Google OAuth script')}
    >
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
