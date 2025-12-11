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
  const [guessHistory, setGuessHistory] = useState([]);
  const timerIntervalRef = useRef(null);
  const lobbyRef = useRef(null);
  const chatRef = useRef(null);

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
      console.log('Game state status:', lobbyData.gameState?.status);
      setLobby(lobbyData);
      if (lobbyData.gameState && lobbyData.gameState.status === 'playing') {
        console.log('Game is already playing, setting up game state');
        const settings = lobbyData.settings || { timeLimit: 60, hintInterval: 15 };
        setGameState(lobbyData.gameState);
        setTimeRemaining(lobbyData.gameState.timeRemaining || settings.timeLimit);
        setHints(lobbyData.gameState.hints || []);
        // Reset guess history when joining a new game
        setGuessHistory([]);
        // Always start timer if game is playing, even if one exists (reset it)
        if (lobbyData.gameState.startTime) {
          console.log('Starting timer from lobbyJoined, startTime:', lobbyData.gameState.startTime);
          startTimer(lobbyData.gameState, settings);
        }
      }
    };

    const handleGameStarted = (gameStateData) => {
      console.log('Game started event received:', gameStateData);
      const settings = gameStateData.settings || lobbyRef.current?.settings || { timeLimit: 60, hintInterval: 15 };
      
      // Reset guess history for new round
      setGuessHistory([]);
      setGameState(gameStateData);
      setTimeRemaining(gameStateData.timeRemaining || settings.timeLimit);
      // Use hints from gameState if available (includes first hint), otherwise start empty
      setHints(gameStateData.hints || []);
      
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

    const handleLobbyError = (data) => {
      console.error('Lobby error:', data);
      if (data.message === 'Lobby not found') {
        alert('Lobby not found. You have been removed from the lobby.');
        navigate('/');
      } else {
        setMessage(data.message || 'An error occurred');
      }
    };

    const handleRoundEnded = (gameStateData) => {
      navigate(`/winner/${lobbyId}`);
    };

    const handleGameEnded = (gameStateData) => {
      navigate(`/winner/${lobbyId}`);
    };

    const handleCorrectGuess = (data) => {
      setMessage(`${data.playerName} guessed correctly: ${data.guess}`);
      // Reveal the word when guessed correctly
      setGameState(prevState => {
        if (prevState) {
          return { ...prevState, currentWord: data.guess };
        }
        return prevState;
      });
    };

    const handleIncorrectGuess = (data) => {
      setMessage(data.message);
      setTimeout(() => setMessage(''), 2000);
    };

    const handleHint = (hint) => {
      setHints((prev) => [...prev, hint]);
    };

    const handlePlayerGuess = (data) => {
      setGuessHistory((prev) => [...prev, {
        ...data,
        timestamp: Date.now()
      }]);
      // Auto-scroll chat to bottom
      setTimeout(() => {
        if (chatRef.current) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
      }, 100);
    };

    const handleHostLeft = (data) => {
      alert(data.message || 'The host has left the lobby.');
      navigate('/');
    };

    // Register event listeners
    socket.on('lobbyJoined', handleLobbyJoined);
    socket.on('gameStarted', handleGameStarted);
    socket.on('lobbyError', handleLobbyError);
    socket.on('roundEnded', handleRoundEnded);
    socket.on('gameEnded', handleGameEnded);
    socket.on('correctGuess', handleCorrectGuess);
    socket.on('incorrectGuess', handleIncorrectGuess);
    socket.on('hint', handleHint);
    socket.on('playerGuess', handlePlayerGuess);
    socket.on('hostLeft', handleHostLeft);

    // Now emit joinLobby after all listeners are set up
    const playerName = localStorage.getItem('playerName') || 'Player';
    
    const joinLobby = () => {
      if (socket.connected) {
        console.log('Emitting joinLobby for GamePage, lobbyId:', lobbyId);
        socket.emit('joinLobby', { lobbyId, playerName });
      } else {
        console.log('Socket not connected, waiting...');
        socket.once('connect', () => {
          console.log('Socket connected, emitting joinLobby, lobbyId:', lobbyId);
          socket.emit('joinLobby', { lobbyId, playerName });
        });
      }
    };
    
    // Try to join immediately, or wait for connection
    if (socket.connected) {
      joinLobby();
    } else {
      socket.once('connect', joinLobby);
      // Also try after a short delay as fallback
      setTimeout(() => {
        if (socket.connected) {
          joinLobby();
        }
      }, 100);
    }

    return () => {
      socket.off('lobbyJoined', handleLobbyJoined);
      socket.off('gameStarted', handleGameStarted);
      socket.off('lobbyError', handleLobbyError);
      socket.off('roundEnded', handleRoundEnded);
      socket.off('gameEnded', handleGameEnded);
      socket.off('correctGuess', handleCorrectGuess);
      socket.off('incorrectGuess', handleIncorrectGuess);
      socket.off('hint', handleHint);
      socket.off('playerGuess', handlePlayerGuess);
      socket.off('hostLeft', handleHostLeft);
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
          <div style={{ marginTop: '20px', color: '#666', fontSize: '14px' }}>
            Status: {gameState.status}
            {lobby && lobby.gameState && (
              <div>Lobby game state: {lobby.gameState.status}</div>
            )}
          </div>
        )}
        {!gameState && lobby && (
          <div style={{ marginTop: '20px', color: '#666', fontSize: '14px' }}>
            Lobby loaded, waiting for game state...
          </div>
        )}
      </div>
    );
  }

  // Check if word should be revealed
  const isWordRevealed = message && message.includes('guessed correctly');
  
  // Generate word display - show word if revealed, otherwise show underscores with one revealed letter
  const getWordDisplay = () => {
    if (!gameState || !gameState.currentWord) return '';
    if (isWordRevealed) {
      // Show the actual word with spaces between letters
      return gameState.currentWord.split('').join(' ');
    }
    // Show underscores with one random letter revealed at the start
    const word = gameState.currentWord;
    const revealedIndex = gameState.revealedLetterIndex !== undefined ? gameState.revealedLetterIndex : -1;
    return word.split('').map((letter, index) => {
      if (index === revealedIndex) {
        return letter;
      }
      return '_';
    }).join(' ');
  };

  return (
    <div className="container">
      <h1>Guess The Word!</h1>
      
      {gameState && gameState.round && (
        <div style={{ textAlign: 'center', marginBottom: '10px', color: '#666', fontSize: '18px' }}>
          Round {gameState.round}
        </div>
      )}

      <div className="timer">
        {Math.floor(timeRemaining / 60)}:
        {(timeRemaining % 60).toString().padStart(2, '0')}
      </div>

      <div style={{ 
        textAlign: 'center', 
        fontSize: '32px', 
        letterSpacing: '8px', 
        fontFamily: 'monospace',
        margin: '20px 0',
        color: isWordRevealed ? '#28a745' : '#667eea',
        fontWeight: 'bold',
        minHeight: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {getWordDisplay()}
      </div>
      
      {isWordRevealed && (
        <div style={{ 
          textAlign: 'center', 
          color: '#28a745', 
          fontSize: '18px', 
          marginTop: '-10px',
          marginBottom: '10px',
          fontWeight: '600'
        }}>
          ✓ Word Revealed!
        </div>
      )}

      <div style={{ minHeight: '52px', margin: '10px 0' }}>
        {message && (
          <div className={message.includes('correctly') ? 'success-message' : 'error-message'}>
            {message}
          </div>
        )}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', 
        gap: '20px', 
        marginTop: '20px' 
      }}>
        <div className="hints-container">
          <h2>Hints:</h2>
          {hints.length === 0 ? (
            <p style={{ color: '#999', fontStyle: 'italic' }}>
              First hint will appear shortly...
            </p>
          ) : (
            hints.map((hint, index) => (
              <div key={index} className="hint-item">
                {index + 1}. {hint}
              </div>
            ))
          )}
        </div>

        <div style={{ 
          background: '#f8f9fa', 
          borderRadius: '8px', 
          padding: '15px',
          maxHeight: '300px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 style={{ marginBottom: '10px', fontSize: '1.2em' }}>Guess History</h2>
          <div 
            ref={chatRef}
            style={{ 
              overflowY: 'auto',
              flex: 1,
              minHeight: '100px',
              maxHeight: '250px'
            }}
          >
            {guessHistory.length === 0 ? (
              <p style={{ color: '#999', fontStyle: 'italic', fontSize: '14px' }}>
                No guesses yet...
              </p>
            ) : (
              guessHistory.map((item, index) => (
                <div 
                  key={index} 
                  style={{ 
                    marginBottom: '8px',
                    padding: '6px 10px',
                    background: item.correct ? '#d4edda' : '#fff',
                    borderRadius: '4px',
                    borderLeft: `3px solid ${item.correct ? '#28a745' : '#dee2e6'}`,
                    fontSize: '14px'
                  }}
                >
                  <strong style={{ color: item.correct ? '#28a745' : '#667eea' }}>
                    {item.playerName}:
                  </strong>{' '}
                  <span style={{ color: item.correct ? '#155724' : '#333' }}>
                    {item.guess}
                  </span>
                  {item.correct && (
                    <span style={{ color: '#28a745', marginLeft: '5px', fontWeight: 'bold' }}>
                      ✓
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmitGuess} className="guess-input-container" autoComplete="off">
        <div className="input-group">
          <label htmlFor="guess">Your Guess</label>
          <input
            id="guess"
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value.toLowerCase())}
            placeholder="Enter your guess"
            disabled={timeRemaining === 0}
            autoFocus
            autoComplete="off"
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
