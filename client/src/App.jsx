import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

const socket = io();

const playerColors = {
  P1: "text-green-400 border-green-400",
  P2: "text-purple-400 border-purple-500",
  P3: "text-pink-400 border-pink-500",
  P4: "text-teal-400 border-teal-500",
};

const playerDialogueColors = {
  P1: "text-green-300",
  P2: "text-purple-300", 
  P3: "text-pink-300",
  P4: "text-teal-300",
};

const playerNameMap = {
  P1: "You",
  P2: "Hazel",
  P3: "Delilah", 
  P4: "Blake"
};

const playerAvatars = {
  P1: { 
    bg: "bg-green-500", 
    text: "bg-green-100", 
    initial: "P1",
    image: "/avatars/player1.jpg", // You can replace with your own avatar
    gender: "male"
  },
  P2: { 
    bg: "bg-purple-500", 
    text: "bg-purple-100", 
    initial: "P2",
    image: "/avatars/player2.jpg", // You can replace with your own avatar
    gender: "female"
  },
  P3: { 
    bg: "bg-pink-500", 
    text: "bg-pink-100", 
    initial: "P3",
    image: "/avatars/player3.jpg", // You can replace with your own avatar
    gender: "male"
  },
  P4: { 
    bg: "bg-teal-500", 
    text: "bg-teal-100", 
    initial: "P4",
    image: "/avatars/player4.jpg", // You can replace with your own avatar
    gender: "female"
  },
};

function TurnDot({ active, gamePhase }) {
  return (
    <span
      className={`inline-block w-3 h-3 rounded-full ml-1 mr-3 ${
        active && gamePhase !== "GameOver" ? "bg-yellow-400 animate-ping" : "bg-gray-500"
      }`}
    ></span>
  );
}

function PlayerAvatar({ playerId, isActive, isFinished, isPassed }) {
  const avatar = playerAvatars[playerId];
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get player color for border
  const getBorderColor = () => {
    switch (playerId) {
      case 'P1': return 'border-green-400';
      case 'P2': return 'border-purple-400';
      case 'P3': return 'border-pink-400';
      case 'P4': return 'border-teal-400';
      default: return 'border-gray-300';
    }
  };

  // Debug logging
  useEffect(() => {
    console.log(`Avatar ${playerId}: imageLoaded=${imageLoaded}, imageError=${imageError}, imageUrl=${avatar.image}`);
  }, [imageLoaded, imageError, playerId, avatar.image]);

  return (
    <div className={`w-24 h-24 rounded-full overflow-hidden border-2 ${getBorderColor()} ${isFinished ? 'opacity-50' : ''} relative`}>
      {!imageError && (
        <img 
          src={avatar.image} 
          alt={`${avatar.gender} player avatar`}
          className={`w-full h-full object-cover ${isFinished || isPassed ? 'grayscale' : ''}`}
          onLoad={() => {
            console.log(`Image loaded successfully for ${playerId}`);
            setImageLoaded(true);
          }}
          onError={(e) => {
            console.log(`Image failed to load for ${playerId}:`, e);
            setImageError(true);
          }}
        />
      )}
      <div className={`w-full h-full ${avatar.bg} flex items-center justify-center ${imageLoaded && !imageError ? 'hidden' : ''}`}>
        <span className={`text-white font-bold text-sm ${isFinished ? 'line-through' : ''}`}>
          {avatar.initial}
        </span>
      </div>
    </div>
  );
}

export default function App() {
  const [game, setGame] = useState(null);
  const [selectedCards, setSelectedCards] = useState([]);
  const [showDebug, setShowDebug] = useState(false);
  const [showBotCards, setShowBotCards] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [botDifficulty, setBotDifficulty] = useState('medium'); // 'easy', 'medium', 'hard'
  const [showDialogues, setShowDialogues] = useState(true); // Enable/disable dialogue display
  const [isDealing, setIsDealing] = useState(false);
  const [dealtCards, setDealtCards] = useState({ P1: [], P2: [], P3: [], P4: [] });
  const [hasDealt, setHasDealt] = useState(false);
  const [showPlayer1Hand, setShowPlayer1Hand] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [currentDialogue, setCurrentDialogue] = useState(null);
  const [showPassThoughtBubble, setShowPassThoughtBubble] = useState(false);
  const usedDialoguesRef = useRef(new Set());

  useEffect(() => {
    socket.emit("createGame");
    socket.on("gameState", (data) => {
      setGame(data);
      
      // Only process dialogue if we have debug logs and dialogues are enabled
      if (data.debugLog && data.debugLog.length > 0 && data.phase === "Playing" && showDialogues) {
        // Only check the last 3 log entries for performance
        const recentLogs = data.debugLog.slice(-3);
        
        for (const log of recentLogs) {
          if (log && log.includes(' says: "')) {
            const dialogueMatch = log.match(/(?:Step \d+: )?(Hazel|Delilah|Blake) says: "([^"]+)"/);
            
            if (dialogueMatch) {
              const player = dialogueMatch[1];
              const message = dialogueMatch[2];
              
              // Simplified dialogue processing
              if (message.toLowerCase() === "pass") {
                const dialogueKey = `${player}:pass:${data.trickNumber}`;
                
                if (!usedDialoguesRef.current.has(dialogueKey)) {
                  setCurrentDialogue({
                    player: player,
                    message: "Pass",
                    timestamp: Date.now()
                  });
                  
                  usedDialoguesRef.current.add(dialogueKey);
                  
                  setTimeout(() => {
                    setCurrentDialogue(null);
                  }, 2000); // Reduced from 3000ms to 2000ms
                  break;
                }
              } else {
                // For non-pass messages, use a simpler key
                const dialogueKey = `${player}:${message}:${data.trickNumber}`;
                
                if (!usedDialoguesRef.current.has(dialogueKey)) {
                  setCurrentDialogue({
                    player: player,
                    message: message,
                    timestamp: Date.now()
                  });
                  
                  usedDialoguesRef.current.add(dialogueKey);
                  
                  setTimeout(() => {
                    setCurrentDialogue(null);
                  }, 2000);
                  break;
                }
              }
            }
          }
        }
      }
    });
    return () => socket.off("gameState");
  }, []); // Removed usedDialogues dependency to prevent re-runs

  // Separate effect for dealing animation
  useEffect(() => {
    if (game && game.players && game.phase === "Playing") {
      // Only trigger dealing animation if we have a fresh game with cards and haven't dealt yet
      const allPlayersHaveCards = game.players.every(player => player.hand && player.hand.length > 0);
      if (allPlayersHaveCards && !isDealing && !hasDealt) {
        setIsDealing(true);
        setDealtCards({ P1: [], P2: [], P3: [], P4: [] });
        setHasDealt(true);
        setShowPlayer1Hand(false);
        
        // Capture all players' cards at the start of animation
        const cardsToDeal = {
          P1: [...game.players[0].hand],
          P2: [...game.players[1].hand],
          P3: [...game.players[2].hand],
          P4: [...game.players[3].hand]
        };
        
        // Simulate dealing animation to all players
        const dealCards = async () => {
          const maxCards = Math.max(...Object.values(cardsToDeal).map(cards => cards.length));
          
          for (let cardIndex = 0; cardIndex < maxCards; cardIndex++) {
            await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay between rounds
            
            // Deal one card to each player in order
            setDealtCards(prev => ({
              P1: cardIndex < cardsToDeal.P1.length ? [...prev.P1, cardsToDeal.P1[cardIndex]] : prev.P1,
              P2: cardIndex < cardsToDeal.P2.length ? [...prev.P2, cardsToDeal.P2[cardIndex]] : prev.P2,
              P3: cardIndex < cardsToDeal.P3.length ? [...prev.P3, cardsToDeal.P3[cardIndex]] : prev.P3,
              P4: cardIndex < cardsToDeal.P4.length ? [...prev.P4, cardsToDeal.P4[cardIndex]] : prev.P4
            }));
          }
          
          // After all cards are dealt, wait a moment then reveal Player 1's hand
          setTimeout(() => {
            setIsDealing(false);
            setDealtCards({ P1: [], P2: [], P3: [], P4: [] });
            // Reveal Player 1's hand after a short delay
            setTimeout(() => {
              setShowPlayer1Hand(true);
            }, 300);
          }, 500);
        };
        dealCards();
      }
    }
  }, [game?.phase, game?.players, isDealing, hasDealt]);

  const me = game?.players?.find((p) => p.id === "P1") || null;
  const isMyTurn = game && me && game.players[game.turn].id === me.id;
  
  // Check if player has 3♠ and it's the first trick
  const isFirstTrick = game?.centerPile?.length === 0 && (!game?.trickNumber || game?.trickNumber === 1);
  const hasThreeSpades = me?.hand?.find(c => c.value === 3 && c.suit === "♠");
  const canPass = !(isFirstTrick && hasThreeSpades);

  const toggleCard = (card) => {
    if (selectedCards.find((c) => c.value === card.value && c.suit === card.suit)) {
      setSelectedCards(selectedCards.filter((c) => !(c.value === card.value && c.suit === card.suit)));
    } else {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const handlePlay = () => {
    if (!selectedCards.length || !isMyTurn) return;
    socket.emit("playMove", { playerId: me.id, cards: selectedCards });
    setSelectedCards([]);
  };

  const handlePass = () => {
    if (!isMyTurn) return;
    socket.emit("passTurn", { playerId: me.id });
    setSelectedCards([]);
    
    // Show "Pass" thought bubble
    setShowPassThoughtBubble(true);
    setTimeout(() => {
      setShowPassThoughtBubble(false);
    }, 3000); // Show for 3 seconds
  };

  const startNewGame = () => {
    // Start clearing animation
    setIsClearing(true);
    setSelectedCards([]);
    setHasDealt(false); // Reset dealing flag for new game
    setShowPlayer1Hand(false); // Reset hand reveal flag for new game
    usedDialoguesRef.current.clear(); // Reset used dialogues for new game
    
    // Clear cards first, then start new game
    setTimeout(() => {
      setIsClearing(false);
      socket.emit("createGame");
    }, 800); // 800ms clearing animation
  };

  const findCards = (pid) => {
    if (!Array.isArray(game?.centerPile)) return [];
    const plays = game.centerPile.filter((p) => p.playerId === pid);
    return plays.length ? plays[plays.length - 1].cards : [];
  };

  if (!game) return <div className="text-center text-white p-8">Waiting for server...</div>;

  const activeHighlight = (pid) =>
    game.players[game.turn].id === pid ? "bg-gray-800" : "border-gray-600 bg-gray-800";
  const inactiveHighlight = (player) => (player.passed ? "opacity-40 grayscale" : "");

  return (
    <div className="relative w-screen h-screen bg-green-900 flex items-center justify-center">
      {/* Game Container */}
      <div className="relative w-[50rem] h-[50rem] flex items-center justify-center">
        
        {/* Table */}
        <div className="relative w-[30rem] h-[30rem] bg-green-800 rounded-full shadow-2xl border-8 border-yellow-500">
          
          {/* Center Pile */}
          <div className="absolute inset-0 flex items-center justify-center">
            {game.centerPile.length > 0 && (
              <div className="flex justify-center items-center space-x-1">
                {game.centerPile[game.centerPile.length - 1].cards.map((card, i) => {
                  const playerId = game.centerPile[game.centerPile.length - 1].playerId;
                  let animationClass = "animate-slide-in";
                  
                  if (playerId === "P1") {
                    animationClass = "animate-slide-in-bottom";
                  } else if (playerId === "P2") {
                    animationClass = "animate-slide-in-left";
                  } else if (playerId === "P3") {
                    animationClass = "animate-slide-in-top";
                  } else if (playerId === "P4") {
                    animationClass = "animate-slide-in-right";
                  }
                  
                  return (
                    <div key={`${playerId}-${i}-${game.centerPile.length}`} className={`relative ${animationClass}`}>
                      <div className="w-16 h-20 border rounded shadow bg-white flex flex-col items-center justify-center">
                        <div className="absolute top-1 left-1 text-left">
                          <div className={`text-sm font-bold ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"}`}>{card.value}</div>
                          <div className={`text-xs ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"}`}>{card.suit}</div>
                        </div>
                        <div className="absolute bottom-1 right-1 text-right transform rotate-180">
                          <div className={`text-sm font-bold ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"}`}>{card.value}</div>
                          <div className={`text-xs ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"}`}>{card.suit}</div>
                        </div>
                        <div className="flex items-center justify-center">
                          <span className={`text-2xl ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"}`}>{card.suit}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Dealing Status */}
            {game.phase !== "RoundOver" && game.phase !== "GameOver" && !showPlayer1Hand && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black bg-opacity-50 text-white text-xl font-bold px-6 py-3 rounded-lg shadow-lg">
                  Dealing cards...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Players */}
        <Player 
          playerId="P3"
          player={{...game.players[2], isActive: game.turn === 2}}
          position="top"
          isMyTurn={isMyTurn}
          currentDialogue={currentDialogue}
          showDialogues={showDialogues}
          playerColors={playerColors}
          playerDialogueColors={playerDialogueColors}
          activeHighlight={activeHighlight}
          inactiveHighlight={inactiveHighlight}
          isClearing={isClearing}
          isDealing={isDealing}
          dealtCards={dealtCards}
          showBotCards={showBotCards}
          showPlayer1Hand={showPlayer1Hand}
          toggleCard={toggleCard}
          selectedCards={selectedCards}
          renderFannedCards={renderFannedCards}
          showPassThoughtBubble={showPassThoughtBubble}
          gamePhase={game.phase}
        />

        <Player 
          playerId="P1"
          player={{...game.players[0], isActive: game.turn === 0}}
          position="bottom"
          isMyTurn={isMyTurn}
          currentDialogue={currentDialogue}
          showDialogues={showDialogues}
          playerColors={playerColors}
          playerDialogueColors={playerDialogueColors}
          activeHighlight={activeHighlight}
          inactiveHighlight={inactiveHighlight}
          isClearing={isClearing}
          isDealing={isDealing}
          dealtCards={dealtCards}
          showBotCards={showBotCards}
          showPlayer1Hand={showPlayer1Hand}
          toggleCard={toggleCard}
          selectedCards={selectedCards}
          renderFannedCards={renderFannedCards}
          showPassThoughtBubble={showPassThoughtBubble}
          gamePhase={game.phase}
        />

        <Player 
          playerId="P2"
          player={{...game.players[1], isActive: game.turn === 1}}
          position="left"
          isMyTurn={isMyTurn}
          currentDialogue={currentDialogue}
          showDialogues={showDialogues}
          playerColors={playerColors}
          playerDialogueColors={playerDialogueColors}
          activeHighlight={activeHighlight}
          inactiveHighlight={inactiveHighlight}
          isClearing={isClearing}
          isDealing={isDealing}
          dealtCards={dealtCards}
          showBotCards={showBotCards}
          showPlayer1Hand={showPlayer1Hand}
          toggleCard={toggleCard}
          selectedCards={selectedCards}
          renderFannedCards={renderFannedCards}
          showPassThoughtBubble={showPassThoughtBubble}
          gamePhase={game.phase}
        />

        <Player 
          playerId="P4"
          player={{...game.players[3], isActive: game.turn === 3}}
          position="right"
          isMyTurn={isMyTurn}
          currentDialogue={currentDialogue}
          showDialogues={showDialogues}
          playerColors={playerColors}
          playerDialogueColors={playerDialogueColors}
          activeHighlight={activeHighlight}
          inactiveHighlight={inactiveHighlight}
          isClearing={isClearing}
          isDealing={isDealing}
          dealtCards={dealtCards}
          showBotCards={showBotCards}
          showPlayer1Hand={showPlayer1Hand}
          toggleCard={toggleCard}
          selectedCards={selectedCards}
          renderFannedCards={renderFannedCards}
          showPassThoughtBubble={showPassThoughtBubble}
          gamePhase={game.phase}
        />



      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-4">
        {game.phase !== "RoundOver" && game.phase !== "GameOver" && showPlayer1Hand && (
          <>
            <button 
              onClick={handlePlay} 
              className={`px-6 py-2 rounded ${isFirstTrick && hasThreeSpades ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              title={isFirstTrick && hasThreeSpades ? "You must play 3♠ to start the game" : "Play selected cards"}
            >
              {isFirstTrick && hasThreeSpades ? "Play 3♠" : "Play"}
            </button>
            <button 
              onClick={handlePass} 
              disabled={!canPass}
              className={`px-6 py-2 rounded ${canPass ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-400 cursor-not-allowed'}`}
              title={!canPass ? "You must play 3♠ to start the game" : "Pass your turn"}
            >
              Pass
            </button>
          </>
        )}


      </div>

      {/* Game Buttons - Right Side */}
      <div className="absolute top-5 right-5 flex flex-col space-y-2">
        <button 
          onClick={startNewGame}
          className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 transition-all duration-300 text-white"
          title="Start a new game with shuffled cards"
        >
          🃏 New Game
        </button>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700 transition-all duration-300 text-white"
          title="Game Settings"
        >
          ⚙️ Settings
        </button>
      </div>



      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 text-white p-6 rounded-xl shadow-2xl border border-gray-600 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-300">Game Settings</h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white text-xl font-bold"
              >
                ×
              </button>
            </div>
            
            {/* Bot Difficulty */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-300">
                Bot Difficulty
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="difficulty"
                    value="easy"
                    checked={botDifficulty === 'easy'}
                    onChange={(e) => setBotDifficulty(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-green-400">Easy</span>
                  <span className="text-xs text-gray-400">- Basic strategy, makes mistakes</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="difficulty"
                    value="medium"
                    checked={botDifficulty === 'medium'}
                    onChange={(e) => setBotDifficulty(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-yellow-400">Medium</span>
                  <span className="text-xs text-gray-400">- Balanced play, current AI</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="difficulty"
                    value="hard"
                    checked={botDifficulty === 'hard'}
                    onChange={(e) => setBotDifficulty(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-red-400">Hard</span>
                  <span className="text-xs text-gray-400">- Advanced strategy, very challenging</span>
                </label>
              </div>
            </div>

            {/* Show Bot Cards Toggle */}
            <div className="mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBotCards}
                  onChange={(e) => setShowBotCards(e.target.checked)}
                  className="text-blue-600"
                />
                <span className="text-sm font-semibold text-gray-300">Show Bot Cards</span>
                <span className="text-xs text-gray-400">- Reveal bot player cards</span>
              </label>
            </div>

            {/* Show Dialogues Toggle */}
            <div className="mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDialogues}
                  onChange={(e) => setShowDialogues(e.target.checked)}
                  className="text-blue-600"
                />
                <span className="text-sm font-semibold text-gray-300">Show Character Dialogues</span>
                <span className="text-xs text-gray-400">- Display bot character dialogue during gameplay</span>
              </label>
            </div>

            {/* Debug Panel Toggle */}
            <div className="mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDebug}
                  onChange={(e) => setShowDebug(e.target.checked)}
                  className="text-blue-600"
                />
                <span className="text-sm font-semibold text-gray-300">Show Debug Panel</span>
                <span className="text-xs text-gray-400">- Display game debug information</span>
              </label>
            </div>

            {/* Apply Button */}
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700 transition-all duration-300"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  // Apply settings and close panel
                  setShowSettings(false);
                  // Send difficulty setting to server
                  socket.emit("updateDifficulty", botDifficulty);
                }}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 transition-all duration-300"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Winner Banner */}
      {game.phase === "GameOver" && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-500 text-black text-4xl font-bold px-12 py-6 rounded-xl shadow-lg">
          🎉 Winner: {game.winner || "Unknown"} 🎉
          <div className="text-sm mt-2">Finish Order: {game.finishOrder?.map(name => playerNameMap[name] || name).join(', ') || 'None'}</div>
        </div>
      )}

{/* Debug Panel - Only show when enabled in settings */}
{showDebug && (
  <div className="fixed bottom-4 right-4 w-80 bg-gray-950 text-white p-4 rounded-xl shadow-2xl border border-gray-700 z-50">
    <div className="flex justify-between items-center mb-3">
      <h2 className="text-lg font-bold text-yellow-400">Debug Log</h2>
      <button 
        onClick={() => setShowDebug(false)}
        className="text-gray-400 hover:text-white text-xl font-bold"
      >
        ×
      </button>
    </div>
    <div className="text-sm mb-2">
      <p><strong>Phase:</strong> {game?.phase}</p>
      <p><strong>Current Turn:</strong> {game?.players?.[game?.turn]?.name}</p>
    </div>
    <div className="max-h-[40vh] overflow-y-auto space-y-1 pr-2 custom-scrollbar">
      {(game?.debugLog || []).map((log, i) => (
        <div
          key={i}
          className="text-gray-300 text-xs bg-gray-800 px-2 py-1 rounded hover:bg-gray-700 transition"
        >
          {log}
        </div>
      ))}
    </div>
  </div>
)}

    </div>
  );
}

function Player({ 
  playerId, 
  player, 
  position, 
  isMyTurn, 
  currentDialogue, 
  showDialogues, 
  playerColors, 
  playerDialogueColors, 
  activeHighlight, 
  inactiveHighlight,
  isClearing,
  isDealing,
  dealtCards,
  showBotCards,
  showPlayer1Hand,
  toggleCard,
  selectedCards,
  renderFannedCards,
  showPassThoughtBubble,
  gamePhase
}) {
  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'absolute top-12 left-1/2 -translate-x-1/2';
      case 'bottom':
        return 'absolute -bottom-16 left-1/2 -translate-x-1/2 z-50';
      case 'left':
        return 'absolute -left-56 top-1/2 -translate-y-1/2';
      case 'right':
        return 'absolute -right-48 top-1/2 -translate-y-1/2';
      default:
        return '';
    }
  };

  const getAnimationClass = () => {
    switch (position) {
      case 'top':
        return 'animate-slide-in-top';
      case 'bottom':
        return 'animate-slide-in-bottom';
      case 'left':
        return 'animate-slide-in-left';
      case 'right':
        return 'animate-slide-in-right';
      default:
        return '';
    }
  };

  const getPlayerName = () => {
    return playerId === "P1" ? "You" : player.name;
  };

  const getDialoguePlayer = () => {
    switch (playerId) {
      case "P1": return "You";
      case "P2": return "Hazel";
      case "P3": return "Delilah";
      case "P4": return "Blake";
      default: return "";
    }
  };

  return (
    <div className={getPositionClasses()}>
      <div className="relative">
        {/* Cards Container - Reference for centering */}
        <div className="flex justify-center mb-4">
          {isClearing ? (
            renderFannedCards(
              Array.from({ length: player.hand.length || 0 }, (_, idx) => ({ value: 'back', suit: 'back' })), 
              false, () => {}, [], true, 0, true, player.passed
            )
          ) : isDealing ? (
            renderFannedCards(
              dealtCards[playerId].map(() => ({ value: 'back', suit: 'back' })), 
              false, () => {}, [], true, 0, false, player.passed, getAnimationClass()
            )
          ) : playerId === "P1" && showPlayer1Hand ? (
            renderFannedCards(
              player.hand, isMyTurn, toggleCard, selectedCards, false, 0, false, player.passed
            )
          ) : (
            renderFannedCards(
              player.hand, false, () => {}, [], !showBotCards, 0, false, player.passed
            )
          )}
        </div>
        
        {/* Name - Centered above cards */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-20 z-20">
          <div className={`font-bold px-1 py-0.5 rounded-lg border-2 ${playerColors[playerId]} ${activeHighlight(playerId)} ${inactiveHighlight(player)} text-center whitespace-nowrap text-sm w-[150px]`}>
            <TurnDot active={player.isActive} gamePhase={gamePhase} /> {getPlayerName()} {player.passed && "(Passed)"}
          </div>
        </div>
        
        {/* Avatar - Centered above name */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[calc(100%+1.5rem)] z-10">
          <div className="relative">
            <PlayerAvatar 
              playerId={playerId} 
              isActive={player.isActive} 
              isFinished={player.finished} 
              isPassed={player.passed} 
            />
            
            {/* Dialogue Speech Bubble */}
            {showDialogues && currentDialogue && currentDialogue.player === getDialoguePlayer() && (
              <div className={`absolute ${playerId === "P1" ? "-top-12 left-1/2 -translate-x-1/2" : playerId === "P4" ? "top-1/2 -translate-y-1/2 right-full mr-4" : "top-1/2 -translate-y-1/2 left-full ml-4"} text-sm font-medium px-3 py-2 rounded-lg bg-black bg-opacity-90 ${playerDialogueColors[playerId]} animate-pulse shadow-lg whitespace-nowrap max-w-xs`} style={{ minWidth: 'fit-content', width: 'auto' }}>
                "{currentDialogue.message}"
                {/* Speech bubble tail */}
                <div className={`absolute ${playerId === "P1" ? "top-full left-1/2 -translate-x-1/2" : playerId === "P4" ? "top-1/2 -translate-y-1/2 -right-2" : "top-1/2 -translate-y-1/2 -left-2"} w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black border-opacity-90`}></div>
              </div>
            )}
            
            {/* Pass Thought Bubble */}
            {showPassThoughtBubble && playerId === "P1" && (
              <div className={`absolute -top-12 left-1/2 -translate-x-1/2 text-sm font-medium px-3 py-2 rounded-lg bg-black bg-opacity-90 ${playerDialogueColors[playerId]} animate-pulse shadow-lg whitespace-nowrap`} style={{ minWidth: 'fit-content', width: 'auto' }}>
                "Pass"
                {/* Speech bubble tail */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black border-opacity-90"></div>
              </div>
            )}
            

          </div>
        </div>
      </div>
    </div>
  );
}

function renderCards(cards, selectable = false, vertical = false, toggle = () => {}, selected = [], isHidden = false) {
  return cards.map((card, idx) => {
    const isSelected = selected.find((c) => c.value === card.value && c.suit === card.suit);
    return (
      <div
        key={idx}
        onClick={() => selectable && toggle(card)}
                    className={`w-12 h-16 border rounded shadow flex flex-col items-center justify-center transition-all duration-300
          ${isHidden ? "" : "bg-white"}
          ${selectable ? "cursor-pointer hover:bg-yellow-200" : ""}
          ${isSelected ? "ring-2 ring-yellow-400" : ""}
          ${vertical ? "transform rotate-90" : ""}`}
      >
        {isHidden ? (
          <>
            {/* Classic casino card back pattern */}
            <div className="w-full h-full bg-gradient-to-br from-red-700 to-red-800 relative overflow-hidden">
              {/* Outer border */}
              <div className="absolute inset-0.5 border border-white rounded-sm"></div>
              {/* Inner border */}
              <div className="absolute inset-1.5 border border-white rounded-sm"></div>
              {/* Central ornate pattern */}
              <div className="absolute inset-2 flex items-center justify-center">
                <div className="w-6 h-8 bg-white rounded-sm relative">
                  {/* Central cross/star motif */}
                  <div className="absolute inset-1 bg-red-700 rounded-sm flex items-center justify-center">
                    <div className="w-1 h-3 bg-white"></div>
                    <div className="w-3 h-1 bg-white absolute"></div>
                  </div>
                </div>
              </div>
              {/* Corner scrollwork patterns */}
              <div className="absolute top-2 left-2 w-2 h-2">
                <div className="w-full h-full bg-white rounded-full opacity-80"></div>
                <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-red-700 rounded-full"></div>
              </div>
              <div className="absolute top-2 right-2 w-2 h-2">
                <div className="w-full h-full bg-white rounded-full opacity-80"></div>
                <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-red-700 rounded-full"></div>
              </div>
              <div className="absolute bottom-2 left-2 w-2 h-2">
                <div className="w-full h-full bg-white rounded-full opacity-80"></div>
                <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-red-700 rounded-full"></div>
              </div>
              <div className="absolute bottom-2 right-2 w-2 h-2">
                <div className="w-full h-full bg-white rounded-full opacity-80"></div>
                <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-red-700 rounded-full"></div>
              </div>
              {/* Decorative vine patterns */}
              <div className="absolute top-3 left-3 w-1 h-1 bg-white rounded-full opacity-60"></div>
              <div className="absolute top-3 right-3 w-1 h-1 bg-white rounded-full opacity-60"></div>
              <div className="absolute bottom-3 left-3 w-1 h-1 bg-white rounded-full opacity-60"></div>
              <div className="absolute bottom-3 right-3 w-1 h-1 bg-white rounded-full opacity-60"></div>
              {/* Center decorative dots */}
              <div className="absolute top-4 left-4 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
              <div className="absolute top-4 right-4 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
              <div className="absolute bottom-4 left-4 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
              <div className="absolute bottom-4 right-4 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
            </div>
          </>
        ) : (
          <>
            {/* Simple design for bot cards - just center content */}
            <div className="flex flex-col items-center justify-center">
              <div className={`text-lg font-bold ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"}`}>{card.value}</div>
              <div className={`text-xl ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"}`}>{card.suit}</div>
            </div>
          </>
        )}
      </div>
    );
  });
}

function renderFannedCards(cards, selectable = false, toggle = () => {}, selected = [], isHidden = false, animationDelay = 0, isClearing = false, isPassed = false, animationClass = "") {
  return (
    <div className={`relative flex items-end justify-center ${animationClass}`} style={{ width: `${Math.max(cards.length * 24, 200)}px`, height: '80px' }}>
      {cards.map((card, idx) => {
        const isSelected = selected.find((c) => c.value === card.value && c.suit === card.suit);
        // Calculate fan angle - cards spread from left to right
        const totalCards = cards.length;
        const maxAngle = 25; // Maximum spread angle in degrees
        const angleStep = totalCards > 1 ? maxAngle / (totalCards - 1) : 0;
        const currentAngle = totalCards > 1 ? -maxAngle / 2 + (idx * angleStep) : 0;
        
        // Calculate position for overlapping effect - tighter fan
        const cardWidth = 64; // w-16 = 64px
        const overlap = 40; // Tighter overlap for more compact fan
        const leftPosition = idx * (cardWidth - overlap);
        
        return (
          <div
            key={idx}
            onClick={() => selectable && toggle(card)}
            className={`w-16 h-20 border rounded shadow flex flex-col items-center justify-center transition-all duration-300 absolute
              ${isHidden ? "" : "bg-white"}
              ${selectable ? "cursor-pointer hover:bg-yellow-200" : ""}
              ${isSelected ? "ring-2 ring-yellow-400" : ""}
              ${isPassed ? "opacity-90 grayscale" : ""}
              ${animationDelay > 0 ? "animate-slide-in-bottom" : ""}
              ${isClearing ? "animate-fade-out" : ""}`}
            style={{
              transform: `rotateY(${currentAngle}deg) ${isSelected ? 'translateY(-8px)' : ''}`,
              transformOrigin: 'bottom center',
              left: `${leftPosition}px`,
              zIndex: idx,
              bottom: '0',
              animationDelay: animationDelay > 0 ? `${idx * 50 + animationDelay}ms` : isClearing ? `${idx * 30}ms` : undefined
            }}
          >
            {isHidden ? (
              <>
                {/* Classic casino card back pattern */}
                <div className="w-full h-full bg-gradient-to-br from-red-700 to-red-800 relative overflow-hidden">
                  {/* Outer border */}
                  <div className="absolute inset-0.5 border border-white rounded-sm"></div>
                  {/* Inner border */}
                  <div className="absolute inset-1.5 border border-white rounded-sm"></div>
                  {/* Central ornate pattern */}
                  <div className="absolute inset-2 flex items-center justify-center">
                    <div className="w-6 h-8 bg-white rounded-sm relative">
                      {/* Central cross/star motif */}
                      <div className="absolute inset-1 bg-red-700 rounded-sm flex items-center justify-center">
                        <div className="w-1 h-3 bg-white"></div>
                        <div className="w-3 h-1 bg-white absolute"></div>
                      </div>
                    </div>
                  </div>
                  {/* Corner scrollwork patterns */}
                  <div className="absolute top-2 left-2 w-2 h-2">
                    <div className="w-full h-full bg-white rounded-full opacity-80"></div>
                    <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-red-700 rounded-full"></div>
                  </div>
                  <div className="absolute top-2 right-2 w-2 h-2">
                    <div className="w-full h-full bg-white rounded-full opacity-80"></div>
                    <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-red-700 rounded-full"></div>
                  </div>
                  <div className="absolute bottom-2 left-2 w-2 h-2">
                    <div className="w-full h-full bg-white rounded-full opacity-80"></div>
                    <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-red-700 rounded-full"></div>
                  </div>
                  <div className="absolute bottom-2 right-2 w-2 h-2">
                    <div className="w-full h-full bg-white rounded-full opacity-80"></div>
                    <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-red-700 rounded-full"></div>
                  </div>
                  {/* Decorative vine patterns */}
                  <div className="absolute top-3 left-3 w-1 h-1 bg-white rounded-full opacity-60"></div>
                  <div className="absolute top-3 right-3 w-1 h-1 bg-white rounded-full opacity-60"></div>
                  <div className="absolute bottom-3 left-3 w-1 h-1 bg-white rounded-full opacity-60"></div>
                  <div className="absolute bottom-3 right-3 w-1 h-1 bg-white rounded-full opacity-60"></div>
                  {/* Center decorative dots */}
                  <div className="absolute top-4 left-4 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
                  <div className="absolute top-4 right-4 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
                  <div className="absolute bottom-4 left-4 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
                  <div className="absolute bottom-4 right-4 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
                </div>
              </>
            ) : (
              <>
                {/* Top-left corner */}
                <div className="absolute top-1 left-1 text-left">
                  <div className={`text-sm font-bold ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"}`}>{card.value}</div>
                  <div className={`text-xs ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"}`}>{card.suit}</div>
                </div>
                {/* Bottom-right corner (rotated) */}
                <div className="absolute bottom-1 right-1 text-right transform rotate-180">
                  <div className={`text-sm font-bold ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"}`}>{card.value}</div>
                  <div className={`text-xs ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"}`}>{card.suit}</div>
                </div>
                {/* Center suit - only show on the rightmost card (top of stack) */}
                {idx === cards.length - 1 && (
                  <div className="flex items-center justify-center">
                    <span className={`text-2xl ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"}`}>{card.suit}</span>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
