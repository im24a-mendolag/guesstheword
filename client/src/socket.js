import io from 'socket.io-client';

// Get the server URL from environment variable or use current hostname (for Railway)
// In production, use the same domain as the frontend
const getServerUrl = () => {
  if (process.env.REACT_APP_SERVER_URL) {
    return process.env.REACT_APP_SERVER_URL;
  }
  
  // In production, use the same origin (Railway serves both frontend and backend)
  if (process.env.NODE_ENV === 'production') {
    return window.location.origin;
  }
  
  // Development default
  return 'http://localhost:5000';
};

const serverUrl = getServerUrl();

// Create a single socket instance that's shared across all components
const socket = io(serverUrl, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

export default socket;

