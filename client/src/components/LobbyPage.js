import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../socket';

function LobbyPage() {
  const { lobbyId } = useParams();
  const navigate = useNavigate();
  const [lobby, setLobby] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [settings, setSettings] = useState({
    timeLimit: 60,
    hintInterval: 15,
    maxPlayers: 8
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const playerName = localStorage.getItem('playerName') || 'Player';
    
    // Request to join/get lobby data
    socket.emit('joinLobby', { lobbyId, playerName });

    socket.on('lobbyJoined', (lobbyData) => {
      setLobby(lobbyData);
      setIsHost(lobbyData.hostId === socket.id);
      setSettings(lobbyData.settings);
      setError(''); // Clear any errors
    });

    socket.on('lobbyUpdated', (lobbyData) => {
      setLobby(lobbyData);
      setIsHost(lobbyData.hostId === socket.id);
      setSettings(lobbyData.settings);
    });

    socket.on('gameStarted', () => {
      navigate(`/game/${lobbyId}`);
    });

    socket.on('lobbyError', (data) => {
      console.error('Lobby error:', data);
      setError(data.message || 'An error occurred');
    });
    
    // Log connection status
    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
      setError(''); // Clear errors on successful connection
    });
    
    socket.on('disconnect', (reason) => {
      console.error('Disconnected from server:', reason);
      setError('Disconnected from server. Please refresh the page.');
    });
    
    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setError('Failed to connect to server. Please check your connection.');
    });

    return () => {
      socket.off('lobbyJoined');
      socket.off('lobbyUpdated');
      socket.off('gameStarted');
      socket.off('lobbyError');
    };
  }, [lobbyId, navigate]);

  const handleStartGame = () => {
    socket.emit('startGame', { lobbyId });
  };

  const handleUpdateSettings = () => {
    socket.emit('updateLobbySettings', { lobbyId, settings });
  };

  const handleLeaveLobby = () => {
    socket.emit('leaveLobby', { lobbyId });
    navigate('/');
  };

  if (!lobby) {
    return <div className="container loading">Loading lobby...</div>;
  }

  return (
    <div className="container">
      <h1>Lobby</h1>
      
      {error && <div className="error-message">{error}</div>}

      <div className="lobby-id">
        Lobby ID: {lobby.id}
      </div>

      <h2>Players ({lobby.players.length}/{lobby.settings.maxPlayers})</h2>
      <ul className="player-list">
        {lobby.players.map((player) => (
          <li
            key={player.id}
            className={`player-item ${player.id === lobby.hostId ? 'host' : ''}`}
          >
            <span>{player.name}</span>
            {player.id === lobby.hostId && (
              <span className="host-badge">HOST</span>
            )}
          </li>
        ))}
      </ul>

      {isHost && (
        <div className="settings-section">
          <h2>Lobby Settings</h2>
          
          <div className="settings-row">
            <label>Time Limit (seconds):</label>
            <input
              type="number"
              min="30"
              max="300"
              value={settings.timeLimit}
              onChange={(e) =>
                setSettings({ ...settings, timeLimit: parseInt(e.target.value) || 60 })
              }
            />
          </div>

          <div className="settings-row">
            <label>Hint Interval (seconds):</label>
            <input
              type="number"
              min="5"
              max="60"
              value={settings.hintInterval}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  hintInterval: parseInt(e.target.value) || 15,
                })
              }
            />
          </div>

          <div className="settings-row">
            <label>Max Players:</label>
            <input
              type="number"
              min="2"
              max="16"
              value={settings.maxPlayers}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxPlayers: parseInt(e.target.value) || 8,
                })
              }
            />
          </div>

          <button onClick={handleUpdateSettings} className="secondary-button">
            Update Settings
          </button>
        </div>
      )}

      {isHost && (
        <button
          onClick={handleStartGame}
          disabled={lobby.players.length < 2 || lobby.gameState.status === 'playing'}
        >
          Start Game
        </button>
      )}

      {!isHost && (
        <div style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
          Waiting for host to start the game...
        </div>
      )}

      <button onClick={handleLeaveLobby} className="secondary-button">
        Leave Lobby
      </button>
    </div>
  );
}

export default LobbyPage;

