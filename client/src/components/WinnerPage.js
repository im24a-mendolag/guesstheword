import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function WinnerPage() {
  const { lobbyId } = useParams();
  const navigate = useNavigate();
  const [lobby, setLobby] = useState(null);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    const playerName = localStorage.getItem('playerName') || 'Player';
    socket.emit('joinLobby', { lobbyId, playerName });

    socket.on('lobbyJoined', (lobbyData) => {
      setLobby(lobbyData);
      if (lobbyData.gameState.winner) {
        setWinner(lobbyData.gameState.winner);
      }
    });

    socket.on('gameEnded', (gameStateData) => {
      if (gameStateData.winner) {
        setWinner(gameStateData.winner);
      }
    });

    return () => {
      socket.off('lobbyJoined');
      socket.off('gameEnded');
    };
  }, [lobbyId]);

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
        <h1>🎉 Game Over! 🎉</h1>

        {winner ? (
          <>
            <div className="winner-name">{winner.name}</div>
            <div className="winner-score">Score: {winner.score} points</div>
            <p style={{ marginTop: '20px', fontSize: '1.2em', color: '#666' }}>
              Congratulations! You guessed the word correctly!
            </p>
          </>
        ) : (
          <div>
            <h2 style={{ color: '#666', marginTop: '20px' }}>
              No one guessed the word in time!
            </h2>
            {lobby.gameState.currentWord && (
              <p style={{ marginTop: '20px', fontSize: '1.5em', color: '#333' }}>
                The word was: <strong>{lobby.gameState.currentWord}</strong>
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

        <div style={{ marginTop: '40px', display: 'flex', gap: '10px' }}>
          <button onClick={handleBackToLobby} className="secondary-button">
            Back to Lobby
          </button>
          <button onClick={handleNewGame}>
            New Game
          </button>
        </div>
      </div>
    </div>
  );
}

export default WinnerPage;

