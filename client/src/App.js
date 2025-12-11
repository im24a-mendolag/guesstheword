import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import LobbyPage from './components/LobbyPage';
import GamePage from './components/GamePage';
import WinnerPage from './components/WinnerPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lobby/:lobbyId" element={<LobbyPage />} />
          <Route path="/game/:lobbyId" element={<GamePage />} />
          <Route path="/winner/:lobbyId" element={<WinnerPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;


