import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function HomePage() {
  const [playerName, setPlayerName] = useState('');
  const [lobbyId, setLobbyId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCreateLobby = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    const name = playerName.trim();
    localStorage.setItem('playerName', name);
    socket.emit('createLobby', { playerName: name });
    
    socket.once('lobbyCreated', (lobby) => {
      navigate(`/lobby/${lobby.id}`);
    });
  };

  const handleJoinLobby = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!lobbyId.trim()) {
      setError('Please enter a lobby ID');
      return;
    }

    const name = playerName.trim();
    localStorage.setItem('playerName', name);
    socket.emit('joinLobby', { 
      lobbyId: lobbyId.trim().toUpperCase(), 
      playerName: name 
    });

    socket.once('lobbyJoined', (lobby) => {
      navigate(`/lobby/${lobby.id}`);
    });

    socket.once('lobbyError', (data) => {
      setError(data.message);
    });
  };

  return (
    <div className="container">
      <h1>🎯 Guess The Word</h1>
      
      {error && <div className="error-message">{error}</div>}

      <div className="input-group">
        <label htmlFor="playerName">Your Name</label>
        <input
          id="playerName"
          type="text"
          value={playerName}
          onChange={(e) => {
            setPlayerName(e.target.value);
            setError('');
          }}
          placeholder="Enter your name"
          maxLength={20}
        />
      </div>

      <button onClick={handleCreateLobby}>
        Create New Lobby
      </button>

      <div style={{ margin: '30px 0', textAlign: 'center', color: '#666' }}>
        OR
      </div>

      <div className="input-group">
        <label htmlFor="lobbyId">Lobby ID</label>
        <input
          id="lobbyId"
          type="text"
          value={lobbyId}
          onChange={(e) => {
            setLobbyId(e.target.value.toUpperCase());
            setError('');
          }}
          placeholder="Enter lobby ID"
          maxLength={6}
          style={{ textTransform: 'uppercase', letterSpacing: '2px' }}
        />
      </div>

      <button onClick={handleJoinLobby}>
        Join Lobby
      </button>
    </div>
  );
}

export default HomePage;

