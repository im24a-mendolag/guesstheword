const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { GameManager } = require('./gameManager');
const { WordDatabase } = require('./wordDatabase');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// CORS configuration for Socket.io
// In production, allow all origins if ALLOWED_ORIGINS is not set (for Railway)
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : (process.env.NODE_ENV === 'production' ? true : ['http://localhost:3000']);

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'], // Allow both transports
  allowEIO3: true // Allow older clients
});

const gameManager = new GameManager();
const wordDatabase = new WordDatabase();

// Store active game timers
const gameTimers = new Map();

// REST API for health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../client/build');
  app.use(express.static(buildPath));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  console.log('Connection origin:', socket.handshake.headers.origin || 'unknown');
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // Create a new lobby
  socket.on('createLobby', (data) => {
    const { playerName } = data;
    const lobby = gameManager.createLobby(socket.id, playerName);
    socket.join(lobby.id);
    socket.emit('lobbyCreated', lobby);
    // Also emit lobbyJoined so the client knows they're in the lobby
    socket.emit('lobbyJoined', lobby);
    console.log(`Lobby created: ${lobby.id} by ${playerName}`);
  });

  // Join an existing lobby
  socket.on('joinLobby', (data) => {
    const { lobbyId, playerName } = data;
    console.log(`Join lobby request: ${playerName} trying to join ${lobbyId}`);
    
    if (!lobbyId || !playerName) {
      socket.emit('lobbyError', { message: 'Lobby ID and player name are required' });
      return;
    }
    
    const result = gameManager.joinLobby(lobbyId, socket.id, playerName);
    
    if (result.success) {
      socket.join(lobbyId);
      // Always send lobbyJoined so client gets current game state
      socket.emit('lobbyJoined', result.lobby);
      
      // If game is already playing, send gameStarted event to this client
      // This handles both new joins and rejoins during active games
      if (result.lobby.gameState.status === 'playing') {
        const gameStartData = {
          ...result.lobby.gameState,
          settings: result.lobby.settings,
          startTime: result.lobby.gameState.startTime || Date.now()
        };
        socket.emit('gameStarted', gameStartData);
        console.log(`Sent gameStarted to ${result.alreadyInLobby ? 'rejoining' : 'joining'} player ${playerName}`);
      }
      
      // Only broadcast update if it's a new player joining, not a rejoin
      if (!result.alreadyInLobby) {
        io.to(lobbyId).emit('lobbyUpdated', result.lobby);
        console.log(`${playerName} joined lobby ${lobbyId} (${result.lobby.players.length} players)`);
      } else {
        console.log(`${playerName} rejoined lobby ${lobbyId}`);
      }
    } else {
      console.error(`Failed to join lobby: ${result.message}`);
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
      // Send gameState with settings so clients can start the timer
      const gameStartData = {
        ...result.gameState,
        settings: lobby.settings,
        startTime: result.gameState.startTime || Date.now()
      };
      io.to(lobbyId).emit('gameStarted', gameStartData);
      console.log(`Game started in lobby ${lobbyId}`);
      
      // Start hint timer
      startHintTimer(lobbyId, lobby);
      
      // Start round end timer
      const gameEndTimer = setTimeout(() => {
        const timers = gameTimers.get(lobbyId);
        if (timers && timers.hintTimer) {
          clearInterval(timers.hintTimer);
        }
        const endResult = gameManager.endRound(lobbyId);
        io.to(lobbyId).emit('roundEnded', endResult.gameState);
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
      // Get player name for chat
      const lobby = gameManager.getLobby(lobbyId);
      const player = lobby ? lobby.players.find(p => p.id === socket.id) : null;
      const playerName = player ? player.name : 'Unknown';
      
      // Broadcast guess to all players (for chat)
      io.to(lobbyId).emit('playerGuess', {
        playerId: socket.id,
        playerName: playerName,
        guess: guess,
        correct: result.correct
      });
      
      if (result.correct) {
        // Player guessed correctly
        io.to(lobbyId).emit('correctGuess', {
          playerId: socket.id,
          playerName: result.playerName,
          guess: guess,
          roundWinner: result.roundWinner
        });
        
        // Clear timers
        const timers = gameTimers.get(lobbyId);
        if (timers) {
          if (timers.hintTimer) clearInterval(timers.hintTimer);
          if (timers.gameEndTimer) clearTimeout(timers.gameEndTimer);
          gameTimers.delete(lobbyId);
        }
        
        // End round (not full game)
        const endResult = gameManager.endRound(lobbyId);
        io.to(lobbyId).emit('roundEnded', endResult.gameState);
      } else {
        socket.emit('incorrectGuess', { message: 'Incorrect guess!' });
      }
    } else {
      socket.emit('lobbyError', { message: result.message });
    }
  });

  // Start next round (host only)
  socket.on('startNextRound', (data) => {
    const { lobbyId } = data;
    const result = gameManager.startNextRound(lobbyId, socket.id, wordDatabase);
    
    if (result.success) {
      const lobby = gameManager.getLobby(lobbyId);
      const gameStartData = {
        ...result.gameState,
        settings: lobby.settings,
        startTime: result.gameState.startTime || Date.now()
      };
      io.to(lobbyId).emit('gameStarted', gameStartData);
      console.log(`Round ${result.gameState.round} started in lobby ${lobbyId}`);
      
      // Start hint timer
      startHintTimer(lobbyId, lobby);
      
      // Start round end timer
      const gameEndTimer = setTimeout(() => {
        const timers = gameTimers.get(lobbyId);
        if (timers && timers.hintTimer) {
          clearInterval(timers.hintTimer);
        }
        const endResult = gameManager.endRound(lobbyId);
        io.to(lobbyId).emit('roundEnded', endResult.gameState);
        gameTimers.delete(lobbyId);
      }, lobby.settings.timeLimit * 1000);
      
      const timers = gameTimers.get(lobbyId) || {};
      timers.gameEndTimer = gameEndTimer;
      gameTimers.set(lobbyId, timers);
    } else {
      socket.emit('lobbyError', { message: result.message });
    }
  });

  // End game completely (host only)
  socket.on('endGame', (data) => {
    const { lobbyId } = data;
    const lobby = gameManager.getLobby(lobbyId);
    
    if (!lobby) {
      socket.emit('lobbyError', { message: 'Lobby not found' });
      return;
    }
    
    if (lobby.hostId !== socket.id) {
      socket.emit('lobbyError', { message: 'Only the host can end the game' });
      return;
    }
    
    const result = gameManager.endGame(lobbyId);
    
    if (result.success) {
      const timers = gameTimers.get(lobbyId);
      if (timers) {
        if (timers.hintTimer) clearInterval(timers.hintTimer);
        if (timers.gameEndTimer) clearTimeout(timers.gameEndTimer);
        gameTimers.delete(lobbyId);
      }
      io.to(lobbyId).emit('gameEnded', result.gameState);
      console.log(`Game ended in lobby ${lobbyId}`);
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
  
  // Send first hint immediately
  const firstHint = wordData.hints[0];
  lobby.gameState.hints.push(firstHint);
  lobby.gameState.hintIndex = 1;
  io.to(lobbyId).emit('hint', firstHint);
  console.log(`Hint 1 sent immediately to lobby ${lobbyId}: ${firstHint}`);
  
  let hintIndex = 1; // Start from second hint
  
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

