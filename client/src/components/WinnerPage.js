import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../socket';

function WinnerPage() {
  const { lobbyId } = useParams();
  const navigate = useNavigate();
  const [lobby, setLobby] = useState(null);
  const [roundWinner, setRoundWinner] = useState(null);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    const playerName = localStorage.getItem('playerName') || 'Player';
    socket.emit('joinLobby', { lobbyId, playerName });

    const handleLobbyJoined = (lobbyData) => {
      setLobby(lobbyData);
      setIsHost(lobbyData.hostId === socket.id);
      if (lobbyData.gameState.roundWinner) {
        setRoundWinner(lobbyData.gameState.roundWinner);
      } else if (lobbyData.gameState.winner) {
        setRoundWinner(lobbyData.gameState.winner);
      }
    };

    const handleRoundEnded = (gameStateData) => {
      if (gameStateData.roundWinner) {
        setRoundWinner(gameStateData.roundWinner);
      }
    };

    const handleGameEnded = (gameStateData) => {
      if (gameStateData.winner) {
        setRoundWinner(gameStateData.winner);
      }
      // Update lobby state when game ends
      setLobby(prevLobby => {
        if (prevLobby) {
          return {
            ...prevLobby,
            gameState: gameStateData
          };
        }
        return prevLobby;
      });
    };

    const handleGameStarted = () => {
      navigate(`/game/${lobbyId}`);
    };

    const handleLobbyError = (data) => {
      console.error('Lobby error:', data);
      alert(data.message || 'An error occurred');
    };

    socket.on('lobbyJoined', handleLobbyJoined);
    socket.on('roundEnded', handleRoundEnded);
    socket.on('gameEnded', handleGameEnded);
    socket.on('gameStarted', handleGameStarted);
    socket.on('lobbyError', handleLobbyError);

    return () => {
      socket.off('lobbyJoined', handleLobbyJoined);
      socket.off('roundEnded', handleRoundEnded);
      socket.off('gameEnded', handleGameEnded);
      socket.off('gameStarted', handleGameStarted);
      socket.off('lobbyError', handleLobbyError);
    };
  }, [lobbyId, navigate]);

  const handleNextRound = () => {
    socket.emit('startNextRound', { lobbyId });
  };

  const handleEndGame = () => {
    socket.emit('endGame', { lobbyId });
  };

  const handleBackToLobby = () => {
    navigate(`/lobby/${lobbyId}`);
  };

  const handleNewGame = () => {
    navigate('/');
  };

  if (!lobby) {
    return <div className="container loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="winner-container">
        {lobby.gameState.status === 'ended' ? (
          <h1>🎉 Game Over! 🎉</h1>
        ) : (
          <h1>🎯 Round {lobby.gameState.round} Complete!</h1>
        )}

        {roundWinner ? (
          <>
            <div className="winner-name">{roundWinner.name}</div>
            <div className="winner-score">
              {lobby.gameState.status === 'ended' 
                ? `Final Score: ${roundWinner.score} points`
                : `Round Score: +${roundWinner.roundScore || 0} points | Total: ${roundWinner.score} points`}
            </div>
            {lobby.gameState.currentWord && (
              <div style={{ 
                marginTop: '15px', 
                fontSize: '1.3em', 
                color: '#667eea',
                fontWeight: '600',
                letterSpacing: '3px'
              }}>
                The word was: <strong style={{ color: '#28a745' }}>{lobby.gameState.currentWord}</strong>
              </div>
            )}
            <p style={{ marginTop: '20px', fontSize: '1.2em', color: '#666' }}>
              {lobby.gameState.status === 'ended' 
                ? 'Congratulations! You won the game!'
                : 'Congratulations! You guessed the word correctly!'}
            </p>
          </>
        ) : (
          <div>
            <h2 style={{ color: '#666', marginTop: '20px' }}>
              No one guessed the word in time!
            </h2>
            {lobby.gameState.currentWord && (
              <p style={{ marginTop: '20px', fontSize: '1.5em', color: '#333' }}>
                The word was: <strong style={{ color: '#28a745' }}>{lobby.gameState.currentWord}</strong>
              </p>
            )}
          </div>
        )}

        <div style={{ marginTop: '40px' }}>
          <h2>Final Scores</h2>
          <ul className="player-list">
            {lobby.players
              .sort((a, b) => b.score - a.score)
              .map((player, index) => (
                <li key={player.id} className="player-item">
                  <span>
                    {index + 1}. {player.name}
                  </span>
                  <span style={{ fontWeight: 'bold', color: '#667eea' }}>
                    {player.score} pts
                  </span>
                </li>
              ))}
          </ul>
        </div>

        <div style={{ marginTop: '40px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {lobby.gameState.status !== 'ended' && isHost && (
            <button onClick={handleNextRound}>
              Next Round
            </button>
          )}
          {lobby.gameState.status !== 'ended' && isHost && (
            <button onClick={handleEndGame} className="secondary-button">
              End Game
            </button>
          )}
          {lobby.gameState.status === 'ended' && (
            <>
              <button onClick={handleBackToLobby} className="secondary-button">
                Back to Lobby
              </button>
              <button onClick={handleNewGame}>
                New Game
              </button>
            </>
          )}
          {lobby.gameState.status !== 'ended' && !isHost && (
            <div style={{ textAlign: 'center', color: '#666', width: '100%' }}>
              Waiting for host to start next round...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WinnerPage;
