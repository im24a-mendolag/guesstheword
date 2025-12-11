import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../socket';

function GamePage() {
  const { lobbyId } = useParams();
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [hints, setHints] = useState([]);
  const [guess, setGuess] = useState('');
  const [message, setMessage] = useState('');
  const [gameState, setGameState] = useState(null);
  const [lobby, setLobby] = useState(null);
  const timerIntervalRef = useRef(null);
  const lobbyRef = useRef(null);

  // Update ref when lobby changes
  useEffect(() => {
    lobbyRef.current = lobby;
  }, [lobby]);

  const startTimer = useCallback((gameStateData, settings) => {
    const startTime = gameStateData.startTime || Date.now();
    const timeLimit = settings?.timeLimit || 60;

    // Clear any existing timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const timer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, timeLimit - elapsed);
      setTimeRemaining(Math.floor(remaining));

      if (remaining <= 0) {
        clearInterval(timer);
        timerIntervalRef.current = null;
      }
    }, 100);

    timerIntervalRef.current = timer;
  }, []);

  useEffect(() => {
    // Set up all event listeners FIRST before emitting joinLobby
    const handleLobbyJoined = (lobbyData) => {
      console.log('Lobby joined in GamePage:', lobbyData);
      setLobby(lobbyData);
      if (lobbyData.gameState.status === 'playing') {
        console.log('Game is already playing, setting up game state');
        const settings = lobbyData.settings || { timeLimit: 60, hintInterval: 15 };
        setGameState(lobbyData.gameState);
        setTimeRemaining(lobbyData.gameState.timeRemaining || settings.timeLimit);
        setHints(lobbyData.gameState.hints || []);
        if (!timerIntervalRef.current && lobbyData.gameState.startTime) {
          console.log('Starting timer from lobbyJoined');
          startTimer(lobbyData.gameState, settings);
        }
      }
    };

    const handleGameStarted = (gameStateData) => {
      console.log('Game started event received:', gameStateData);
      const settings = gameStateData.settings || lobbyRef.current?.settings || { timeLimit: 60, hintInterval: 15 };
      
      setGameState(gameStateData);
      setTimeRemaining(gameStateData.timeRemaining || settings.timeLimit);
      setHints([]);
      
      // Clear any existing timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      if (gameStateData.startTime) {
        console.log('Starting timer from gameStarted');
        startTimer(gameStateData, settings);
      } else {
        // Fallback: create a new startTime if not provided
        const gameStateWithTime = {
          ...gameStateData,
          startTime: Date.now()
        };
        startTimer(gameStateWithTime, settings);
      }
    };

    // Register event listeners
    socket.on('lobbyJoined', handleLobbyJoined);
    socket.on('gameStarted', handleGameStarted);

    // Set up other event listeners
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

    // Now emit joinLobby after all listeners are set up
    const playerName = localStorage.getItem('playerName') || 'Player';
    socket.emit('joinLobby', { lobbyId, playerName });

    return () => {
      socket.off('lobbyJoined', handleLobbyJoined);
      socket.off('gameStarted', handleGameStarted);
      socket.off('gameEnded');
      socket.off('correctGuess');
      socket.off('incorrectGuess');
      socket.off('hint');
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [lobbyId, navigate, startTimer]);

  const handleSubmitGuess = (e) => {
    e.preventDefault();
    if (!guess.trim()) return;

    socket.emit('submitGuess', { lobbyId, guess: guess.trim() });
    setGuess('');
  };

  // Show loading if game hasn't started yet
  if (!gameState || gameState.status !== 'playing') {
    return (
      <div className="container loading">
        {gameState?.status === 'ended' ? 'Game has ended' : 'Waiting for game to start...'}
        {gameState && (
          <div style={{ marginTop: '20px', color: '#666' }}>
            Status: {gameState.status}
          </div>
        )}
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

