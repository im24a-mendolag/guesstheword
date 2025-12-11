class GameManager {
  constructor() {
    this.lobbies = new Map();
    this.playerToLobby = new Map();
  }

  createLobby(hostId, hostName) {
    const lobbyId = this.generateLobbyId();
    const lobby = {
      id: lobbyId,
      hostId: hostId,
      players: [{ id: hostId, name: hostName, score: 0 }],
      settings: {
        timeLimit: 60, // seconds
        hintInterval: 15, // seconds
        maxPlayers: 8
      },
      gameState: {
        status: 'waiting', // waiting, playing, roundEnded, ended
        currentWord: null,
        hints: [],
        timeRemaining: null,
        startTime: null,
        winner: null,
        round: 0,
        roundWinner: null
      }
    };
    
    this.lobbies.set(lobbyId, lobby);
    this.playerToLobby.set(hostId, lobbyId);
    return lobby;
  }

  joinLobby(lobbyId, playerId, playerName) {
    const lobby = this.lobbies.get(lobbyId);
    
    if (!lobby) {
      return { success: false, message: 'Lobby not found' };
    }
    
    // Check if player is already in the lobby
    const existingPlayer = lobby.players.find(p => p.id === playerId);
    if (existingPlayer) {
      // Player is already in lobby, just return the lobby (for reconnection/room joining)
      // This works even if game is playing - allows rejoining to see game state
      return { success: true, lobby, alreadyInLobby: true };
    }
    
    // Only block new joins if game is playing
    if (lobby.gameState.status === 'playing') {
      return { success: false, message: 'Game is already in progress. Cannot join mid-game.' };
    }
    
    if (lobby.players.length >= lobby.settings.maxPlayers) {
      return { success: false, message: 'Lobby is full' };
    }
    
    lobby.players.push({ id: playerId, name: playerName, score: 0 });
    this.playerToLobby.set(playerId, lobbyId);
    
    return { success: true, lobby };
  }

  updateLobbySettings(lobbyId, playerId, settings) {
    const lobby = this.lobbies.get(lobbyId);
    
    if (!lobby) {
      return { success: false, message: 'Lobby not found' };
    }
    
    if (lobby.hostId !== playerId) {
      return { success: false, message: 'Only the host can update settings' };
    }
    
    if (lobby.gameState.status === 'playing') {
      return { success: false, message: 'Cannot update settings during game' };
    }
    
    // Update settings
    lobby.settings = { ...lobby.settings, ...settings };
    
    return { success: true, lobby };
  }

  startGame(lobbyId, playerId, wordDatabase) {
    const lobby = this.lobbies.get(lobbyId);
    
    if (!lobby) {
      return { success: false, message: 'Lobby not found' };
    }
    
    if (lobby.hostId !== playerId) {
      return { success: false, message: 'Only the host can start the game' };
    }
    
    if (lobby.gameState.status === 'playing') {
      return { success: false, message: 'Game is already in progress' };
    }
    
    if (lobby.players.length < 2) {
      return { success: false, message: 'Need at least 2 players to start' };
    }
    
    // Select a random word
    const wordData = wordDatabase.getRandomWord();
    
    // Start first round
    lobby.gameState = {
      status: 'playing',
      currentWord: wordData.word,
      wordData: wordData, // Store full word data including hints
      hints: [],
      hintIndex: 0,
      timeRemaining: lobby.settings.timeLimit,
      startTime: Date.now(),
      winner: null,
      round: 1,
      roundWinner: null
    };
    
    // Reset player scores only on first round
    if (lobby.gameState.round === 1) {
      lobby.players.forEach(player => {
        player.score = 0;
      });
    }
    
    return { success: true, gameState: lobby.gameState };
  }

  submitGuess(lobbyId, playerId, guess) {
    const lobby = this.lobbies.get(lobbyId);
    
    if (!lobby) {
      return { success: false, message: 'Lobby not found' };
    }
    
    if (lobby.gameState.status !== 'playing') {
      return { success: false, message: 'Game is not in progress' };
    }
    
    const player = lobby.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, message: 'Player not found in lobby' };
    }
    
    const normalizedGuess = guess.toLowerCase().trim();
    const normalizedWord = lobby.gameState.currentWord.toLowerCase().trim();
    
    if (normalizedGuess === normalizedWord) {
      // Calculate score based on time remaining
      const timeElapsed = (Date.now() - lobby.gameState.startTime) / 1000;
      const timeRemaining = lobby.settings.timeLimit - timeElapsed;
      const score = Math.max(1, Math.floor(timeRemaining / 10));
      
      player.score += score;
      lobby.gameState.roundWinner = {
        id: playerId,
        name: player.name,
        score: player.score,
        roundScore: score
      };
      
      return { success: true, correct: true, playerName: player.name, roundWinner: lobby.gameState.roundWinner };
    }
    
    return { success: true, correct: false };
  }

  endRound(lobbyId) {
    const lobby = this.lobbies.get(lobbyId);
    
    if (!lobby) {
      return { success: false, message: 'Lobby not found' };
    }
    
    lobby.gameState.status = 'roundEnded';
    lobby.gameState.timeRemaining = 0;
    
    return { success: true, gameState: lobby.gameState };
  }

  startNextRound(lobbyId, playerId, wordDatabase) {
    const lobby = this.lobbies.get(lobbyId);
    
    if (!lobby) {
      return { success: false, message: 'Lobby not found' };
    }
    
    if (lobby.hostId !== playerId) {
      return { success: false, message: 'Only the host can start the next round' };
    }
    
    if (lobby.gameState.status !== 'roundEnded') {
      return { success: false, message: 'Round is not ended' };
    }
    
    // Select a new random word
    const wordData = wordDatabase.getRandomWord();
    
    // Start next round
    lobby.gameState = {
      status: 'playing',
      currentWord: wordData.word,
      wordData: wordData,
      hints: [],
      hintIndex: 0,
      timeRemaining: lobby.settings.timeLimit,
      startTime: Date.now(),
      winner: null,
      round: lobby.gameState.round + 1,
      roundWinner: null
    };
    
    return { success: true, gameState: lobby.gameState };
  }

  endGame(lobbyId) {
    const lobby = this.lobbies.get(lobbyId);
    
    if (!lobby) {
      return { success: false, message: 'Lobby not found' };
    }
    
    // Find overall winner (player with highest score)
    const sortedPlayers = [...lobby.players].sort((a, b) => b.score - a.score);
    lobby.gameState.winner = {
      id: sortedPlayers[0].id,
      name: sortedPlayers[0].name,
      score: sortedPlayers[0].score
    };
    
    lobby.gameState.status = 'ended';
    lobby.gameState.timeRemaining = 0;
    
    return { success: true, gameState: lobby.gameState };
  }

  leaveLobby(lobbyId, playerId) {
    const lobby = this.lobbies.get(lobbyId);
    
    if (!lobby) {
      return { success: false, message: 'Lobby not found' };
    }
    
    const playerIndex = lobby.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return { success: false, message: 'Player not in lobby' };
    }
    
    // If host leaves, assign new host or disband lobby
    if (lobby.hostId === playerId) {
      if (lobby.players.length === 1) {
        // Only host in lobby, disband it
        this.lobbies.delete(lobbyId);
        this.playerToLobby.delete(playerId);
        return { success: true, lobby: null };
      } else {
        // Assign new host
        lobby.players.splice(playerIndex, 1);
        lobby.hostId = lobby.players[0].id;
      }
    } else {
      lobby.players.splice(playerIndex, 1);
    }
    
    this.playerToLobby.delete(playerId);
    
    return { success: true, lobby };
  }

  handleDisconnect(playerId) {
    const lobbyId = this.playerToLobby.get(playerId);
    if (!lobbyId) {
      return null;
    }
    
    const result = this.leaveLobby(lobbyId, playerId);
    if (result.success && result.lobby) {
      return [{ lobbyId, lobby: result.lobby }];
    }
    
    return null;
  }

  generateLobbyId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  getLobby(lobbyId) {
    return this.lobbies.get(lobbyId);
  }
}

module.exports = { GameManager };

