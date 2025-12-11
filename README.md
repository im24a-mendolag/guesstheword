# Guess The Word

A real-time multiplayer word guessing game where players compete to guess a word based on hints that appear every 15 seconds.

## Features

- 🎮 Real-time multiplayer gameplay
- 🏠 Lobby system with host controls
- ⏱️ Configurable timer (default: 60 seconds)
- 💡 Automatic hints every 15 seconds (configurable)
- 🏆 Winner announcement with scores
- ⚙️ Customizable lobby settings (time limit, hint interval, max players)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install server dependencies:
```bash
npm install
```

2. Install client dependencies:
```bash
cd client
npm install
cd ..
```

Or install all at once:
```bash
npm run install-all
```

### Running the Application

Start both server and client in development mode:
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend React app on `http://localhost:3000`

Or run them separately:
```bash
# Terminal 1 - Start server
npm run server

# Terminal 2 - Start client
npm run client
```

## How to Play

1. **Create or Join a Lobby**
   - Enter your name
   - Create a new lobby or join an existing one using the lobby ID

2. **Lobby Setup**
   - Wait for other players to join
   - Host can adjust settings (time limit, hint interval, max players)
   - Host clicks "Start Game" when ready

3. **Gameplay**
   - A word is randomly selected
   - Hints appear every 15 seconds (or as configured)
   - Type your guess and submit
   - First player to guess correctly wins!

4. **Winner**
   - See the winner and final scores
   - Return to lobby or start a new game

## Project Structure

```
guesstheword/
├── server/
│   ├── index.js          # Express server with Socket.io
│   ├── gameManager.js    # Game logic and lobby management
│   └── wordDatabase.js   # Word database with hints
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── HomePage.js    # Landing page
│   │   │   ├── LobbyPage.js   # Lobby management
│   │   │   ├── GamePage.js    # Game interface
│   │   │   └── WinnerPage.js  # Winner announcement
│   │   ├── App.js
│   │   └── index.js
│   └── public/
└── package.json
```

## Technologies Used

- **Backend**: Node.js, Express, Socket.io
- **Frontend**: React, React Router
- **Real-time Communication**: Socket.io

## Notes

### npm Warnings and Vulnerabilities

When installing dependencies, you may see:
- **Deprecation warnings**: These are normal and come from transitive dependencies. They don't affect functionality.
- **Security vulnerabilities**: The client dependencies may show 9 vulnerabilities (mostly in development dependencies like `webpack-dev-server`, `svgo`, etc.). These are:
  - Only in development dependencies (not in production builds)
  - Common with `react-scripts 5.0.1` (latest stable version)
  - Not critical for local development
  - Will be resolved when `react-scripts` releases updates

These warnings can be safely ignored for development purposes. The production build is not affected.

## Deployment to Railway

### Prerequisites
- Railway account (sign up at [railway.app](https://railway.app))
- GitHub repository with your code

### Steps

1. **Connect your repository to Railway**
   - Go to Railway dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Configure Environment Variables**
   In Railway, go to your service → Variables and add:
   ```
   NODE_ENV=production
   PORT=5000
   ALLOWED_ORIGINS=https://your-app.railway.app
   REACT_APP_SERVER_URL=https://your-app.railway.app
   ```
   Replace `your-app.railway.app` with your actual Railway domain.

3. **Deploy**
   - Railway will automatically detect the Dockerfile
   - It will build the Docker image
   - The app will be deployed and you'll get a URL

4. **Update CORS after deployment**
   - Once deployed, Railway will give you a domain (e.g., `your-app.up.railway.app`)
   - Update the `ALLOWED_ORIGINS` variable to include this domain
   - Redeploy if needed

### Alternative: Using Nixpacks

If Docker doesn't work, Railway can use the `nixpacks.toml` file instead. Railway will automatically detect it and use Nixpacks for building.

### Troubleshooting

- **Build fails**: Make sure all dependencies are listed in `package.json`
- **Socket.io not connecting**: Check that `ALLOWED_ORIGINS` includes your Railway domain
- **Static files not loading**: Ensure `NODE_ENV=production` is set
- **Port issues**: Railway automatically sets the `PORT` environment variable

## License

ISC


