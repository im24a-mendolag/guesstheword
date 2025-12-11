import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function GamePage() {
  const { lobbyId } = useParams();
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [hints, setHints] = useState([]);
  const [guess, setGuess] = useState('');
  const [message, setMessage] = useState('');
  const [gameState, setGameState] = useState(null);
  const [lobby, setLobby] = useState(null);
  const [timerInterval, setTimerInterval] = useState(null);

  useEffect(() => {
    const playerName = localStorage.getItem('playerName') || 'Player';
    socket.emit('joinLobby', { lobbyId, playerName });

    socket.on('lobbyJoined', (lobbyData) => {
      setLobby(lobbyData);
      if (lobbyData.gameState.status === 'playing') {
        setGameState(lobbyData.gameState);
        setTimeRemaining(lobbyData.gameState.timeRemaining);
        setHints(lobbyData.gameState.hints || []);
        if (!timerInterval) {
          startTimer(lobbyData.gameState, lobbyData.settings);
        }
      }
    });

    socket.on('gameStarted', (gameStateData) => {
      setGameState(gameStateData);
      setTimeRemaining(gameStateData.timeRemaining);
      setHints([]);
      // Get lobby settings from current lobby state or request update
      if (lobby && lobby.settings) {
        startTimer(gameStateData, lobby.settings);
      } else {
        // Request lobby data to get settings
        const playerName = localStorage.getItem('playerName') || 'Player';
        socket.emit('joinLobby', { lobbyId, playerName });
      }
    });

    socket.on('gameEnded', (gameStateData) => {
      navigate(`/winner/${lobbyId}`);
    });

    socket.on('correctGuess', (data) => {
      setMessage(`${data.playerName} guessed correctly: ${data.guess}`);
    });

    socket.on('incorrectGuess', (data) => {
      setMessage(data.message);
      setTimeout(() => setMessage(''), 2000);
    });

    socket.on('hint', (hint) => {
      setHints((prev) => [...prev, hint]);
    });

    return () => {
      socket.off('lobbyJoined');
      socket.off('gameStarted');
      socket.off('gameEnded');
      socket.off('correctGuess');
      socket.off('incorrectGuess');
      socket.off('hint');
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [lobbyId, navigate, timerInterval]);

  const startTimer = (gameStateData, settings) => {
    const startTime = gameStateData.startTime || Date.now();
    const timeLimit = settings?.timeLimit || 60;

    // Clear any existing timer
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    const timer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, timeLimit - elapsed);
      setTimeRemaining(Math.floor(remaining));

      if (remaining <= 0) {
        clearInterval(timer);
        setTimerInterval(null);
      }
    }, 100);

    setTimerInterval(timer);
  };

  const handleSubmitGuess = (e) => {
    e.preventDefault();
    if (!guess.trim()) return;

    socket.emit('submitGuess', { lobbyId, guess: guess.trim() });
    setGuess('');
  };

  if (!gameState || gameState.status !== 'playing') {
    return (
      <div className="container loading">
        Waiting for game to start...
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Guess The Word!</h1>

      <div className="timer">
        {Math.floor(timeRemaining / 60)}:
        {(timeRemaining % 60).toString().padStart(2, '0')}
      </div>

      {message && (
        <div className={message.includes('correctly') ? 'success-message' : 'error-message'}>
          {message}
        </div>
      )}

      <div className="hints-container">
        <h2>Hints:</h2>
        {hints.length === 0 ? (
          <p style={{ color: '#999', fontStyle: 'italic' }}>
            Hints will appear every 15 seconds...
          </p>
        ) : (
          hints.map((hint, index) => (
            <div key={index} className="hint-item">
              {index + 1}. {hint}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmitGuess} className="guess-input-container">
        <div className="input-group">
          <label htmlFor="guess">Your Guess</label>
          <input
            id="guess"
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value.toUpperCase())}
            placeholder="Enter your guess"
            disabled={timeRemaining === 0}
            autoFocus
          />
        </div>
        <button type="submit" disabled={timeRemaining === 0}>
          Submit Guess
        </button>
      </form>

      {timeRemaining === 0 && (
        <div className="error-message" style={{ textAlign: 'center', marginTop: '20px' }}>
          Time's up! The game has ended.
        </div>
      )}
    </div>
  );
}

export default GamePage;

