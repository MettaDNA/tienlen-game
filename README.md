
# Tien Len Card Game - Main Version

A fully-featured Tien Len (Vietnamese card game) implementation with advanced UI/UX features and robust game logic.

## 🎮 Features

### **Core Gameplay**
- **4-player Tien Len**: Human player + 3 AI bots
- **Complete game logic**: All Tien Len rules implemented
- **Real-time multiplayer**: Socket.IO communication
- **3♠ Lead Rule**: Must play 3♠ to start the game
- **Bomb mechanics**: Play any combo when no current trick
- **Trick-based gameplay**: Beat the current trick or pass

### **Advanced UI/UX**
- **Fanned human cards**: Realistic card fanning with 3D effects
- **Casino card back design**: Authentic casino-style card backs
- **Professional card design**: Corner numbers + center suit display
- **Responsive card sizing**: Human cards 30% larger than others
- **Smooth animations**: Card sliding animations from players to center
- **Debug panel**: Minimizable debug panel with game state info

### **Visual Enhancements**
- **AI-generated avatars**: Sexy anime-inspired character avatars
- **Player status indicators**: Active turn, passed, finished states
- **Card visibility toggle**: Show/hide bot cards with animations
- **Winner announcements**: Clear game end with finish order
- **Professional styling**: Modern UI with Tailwind CSS

### **Game Logic Features**
- **Automatic game ending**: Last player auto-finishes
- **Proper winner detection**: First player to finish wins
- **Bot AI improvements**: Enhanced decision making with debug logging
- **3D card fanning**: Realistic human player card display
- **Trick management**: Proper trick reset and advancement

## 🚀 Technical Implementation

### **Frontend (React + Tailwind)**
- **Responsive design**: Works on all screen sizes
- **Smooth animations**: CSS transitions and transforms
- **State management**: Real-time game state updates
- **Professional UI**: Modern card game interface

### **Backend (Node.js + Socket.IO)**
- **Real-time communication**: Instant game updates
- **Robust game logic**: Complete Tien Len rule implementation
- **Bot AI**: Intelligent decision making
- **Error handling**: Comprehensive game state validation

### **Game Features**
- **Card sorting**: Proper Tien Len card ordering
- **Combo detection**: Singles, pairs, trips, quads, straights
- **Bomb mechanics**: Play any combo when leading
- **Trick validation**: Must beat current trick or pass
- **Player states**: Active, passed, finished tracking

## 🎯 Key Improvements

### **UI/UX Enhancements**
1. **Fanned human cards** with realistic 3D effects
2. **Casino card back design** with ornate patterns
3. **Professional card layout** with corner numbers and center suits
4. **Larger human cards** for better visibility
5. **Smooth animations** for card movements
6. **Minimizable debug panel** with game state info

### **Game Logic Fixes**
1. **Proper winner detection** - first player to finish wins
2. **Automatic game ending** - last player auto-finishes
3. **Enhanced bot AI** with debug logging
4. **3♠ lead rule enforcement** for both human and bots
5. **Bomb mechanics** - play any combo when leading
6. **Trick management** - proper reset and advancement

### **Visual Polish**
1. **AI-generated avatars** with anime-inspired characters
2. **Card visibility toggle** with smooth animations
3. **Professional styling** with modern UI design
4. **Responsive layout** for all screen sizes
5. **Clear game state indicators** for all players

## 🎮 How to Play

1. **Start the game**: Server automatically deals cards
2. **Lead with 3♠**: First player must play 3♠
3. **Beat the trick**: Play higher cards or pass
4. **Bomb when leading**: Play any combo when no current trick
5. **Win by finishing**: First player to play all cards wins

## 🛠️ Installation & Setup

```bash
# Install dependencies
npm install

# Start the server
cd server && npm start

# Start the client
cd client && npm run dev
```

## 🎯 Game Rules

- **4 players**: 1 human + 3 AI bots
- **52 cards**: Standard deck
- **Lead with 3♠**: Must play 3♠ to start
- **Beat or pass**: Must beat current trick or pass
- **Bomb when leading**: Play any combo when no current trick
- **Win by finishing**: First to play all cards wins

## 🎨 Visual Features

- **Fanned human cards**: Realistic 3D card fanning
- **Casino card backs**: Authentic casino-style design
- **Professional card layout**: Corner numbers + center suits
- **AI avatars**: Anime-inspired character designs
- **Smooth animations**: Card movement and transitions
- **Responsive design**: Works on all devices

This main version represents a complete, polished Tien Len implementation with advanced features, professional UI/UX, and robust game logic.
