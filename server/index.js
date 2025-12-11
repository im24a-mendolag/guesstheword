const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { GameManager } = require('./gameManager');
const { WordDatabase } = require('./wordDatabase');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const gameManager = new GameManager();
const wordDatabase = new WordDatabase();

// Store active game timers
const gameTimers = new Map();

// REST API for health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create a new lobby
  socket.on('createLobby', (data) => {
    const { playerName } = data;
    const lobby = gameManager.createLobby(socket.id, playerName);
    socket.join(lobby.id);
    socket.emit('lobbyCreated', lobby);
    console.log(`Lobby created: ${lobby.id} by ${playerName}`);
  });

  // Join an existing lobby
  socket.on('joinLobby', (data) => {
    const { lobbyId, playerName } = data;
    const result = gameManager.joinLobby(lobbyId, socket.id, playerName);
    
    if (result.success) {
      socket.join(lobbyId);
      socket.emit('lobbyJoined', result.lobby);
      io.to(lobbyId).emit('lobbyUpdated', result.lobby);
      console.log(`${playerName} joined lobby ${lobbyId}`);
    } else {
      socket.emit('lobbyError', { message: result.message });
    }
  });

  // Update lobby settings (host only)
  socket.on('updateLobbySettings', (data) => {
    const { lobbyId, settings } = data;
    const result = gameManager.updateLobbySettings(lobbyId, socket.id, settings);
    
    if (result.success) {
      io.to(lobbyId).emit('lobbyUpdated', result.lobby);
    } else {
      socket.emit('lobbyError', { message: result.message });
    }
  });

  // Start game (host only)
  socket.on('startGame', (data) => {
    const { lobbyId } = data;
    const result = gameManager.startGame(lobbyId, socket.id, wordDatabase);
    
    if (result.success) {
      const lobby = gameManager.getLobby(lobbyId);
      io.to(lobbyId).emit('gameStarted', result.gameState);
      console.log(`Game started in lobby ${lobbyId}`);
      
      // Start hint timer
      startHintTimer(lobbyId, lobby);
      
      // Start game end timer
      const gameEndTimer = setTimeout(() => {
        const timers = gameTimers.get(lobbyId);
        if (timers && timers.hintTimer) {
          clearInterval(timers.hintTimer);
        }
        const endResult = gameManager.endGame(lobbyId);
        io.to(lobbyId).emit('gameEnded', endResult.gameState);
        gameTimers.delete(lobbyId);
      }, lobby.settings.timeLimit * 1000);
      
      const timers = gameTimers.get(lobbyId) || {};
      timers.gameEndTimer = gameEndTimer;
      gameTimers.set(lobbyId, timers);
    } else {
      socket.emit('lobbyError', { message: result.message });
    }
  });

  // Submit guess
  socket.on('submitGuess', (data) => {
    const { lobbyId, guess } = data;
    const result = gameManager.submitGuess(lobbyId, socket.id, guess);
    
    if (result.success) {
      if (result.correct) {
        // Player guessed correctly
        io.to(lobbyId).emit('correctGuess', {
          playerId: socket.id,
          playerName: result.playerName,
          guess: guess
        });
        
        // Clear timers
        const timers = gameTimers.get(lobbyId);
        if (timers) {
          if (timers.hintTimer) clearInterval(timers.hintTimer);
          if (timers.gameEndTimer) clearTimeout(timers.gameEndTimer);
          gameTimers.delete(lobbyId);
        }
        
        // End game
        const endResult = gameManager.endGame(lobbyId);
        io.to(lobbyId).emit('gameEnded', endResult.gameState);
      } else {
        socket.emit('incorrectGuess', { message: 'Incorrect guess!' });
      }
    } else {
      socket.emit('lobbyError', { message: result.message });
    }
  });

  // Leave lobby
  socket.on('leaveLobby', (data) => {
    const { lobbyId } = data;
    const result = gameManager.leaveLobby(lobbyId, socket.id);
    
    if (result.success) {
      socket.leave(lobbyId);
      socket.emit('lobbyLeft');
      io.to(lobbyId).emit('lobbyUpdated', result.lobby);
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const result = gameManager.handleDisconnect(socket.id);
    
    if (result) {
      result.forEach(({ lobbyId, lobby }) => {
        io.to(lobbyId).emit('lobbyUpdated', lobby);
      });
    }
  });
});

// Function to start hint timer for a lobby
function startHintTimer(lobbyId, lobby) {
  const gameState = lobby.gameState;
  const wordData = gameState.wordData;
  const hintInterval = lobby.settings.hintInterval * 1000; // Convert to milliseconds
  
  if (!wordData || !wordData.hints || wordData.hints.length === 0) {
    return;
  }
  
  let hintIndex = 0;
  
  const hintTimer = setInterval(() => {
    const lobby = gameManager.getLobby(lobbyId);
    if (!lobby || lobby.gameState.status !== 'playing') {
      clearInterval(hintTimer);
      return;
    }
    
    if (hintIndex < wordData.hints.length) {
      const hint = wordData.hints[hintIndex];
      lobby.gameState.hints.push(hint);
      lobby.gameState.hintIndex = hintIndex + 1;
      
      io.to(lobbyId).emit('hint', hint);
      console.log(`Hint ${hintIndex + 1} sent to lobby ${lobbyId}: ${hint}`);
      
      hintIndex++;
    } else {
      clearInterval(hintTimer);
    }
  }, hintInterval);
  
  // Store hint timer
  const timers = gameTimers.get(lobbyId) || {};
  timers.hintTimer = hintTimer;
  gameTimers.set(lobbyId, timers);
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

