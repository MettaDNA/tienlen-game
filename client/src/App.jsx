import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

// Dynamic socket connection based on environment
const getSocketUrl = () => {
  // If we're in development (localhost), use the local server
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  // For production (deployed on Render), use the current hostname
  return window.location.origin;
};

const socket = io(getSocketUrl());

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
  P3: "Dina", 
  P4: "Blake"
};

const playerAvatars = {
  P1: { 
    bg: "bg-green-500", 
    text: "bg-green-100", 
    initial: "P1",
    image: "/avatars/player1.jpg",
    gender: "male"
  },
  P2: { 
    bg: "bg-purple-500", 
    text: "bg-purple-100", 
    initial: "P2",
    image: "/avatars/player2.jpg",
    gender: "female"
  },
  P3: { 
    bg: "bg-pink-500", 
    text: "bg-pink-100", 
    initial: "P3",
    image: "/avatars/player3.jpg",
    gender: "male"
  },
  P4: { 
    bg: "bg-teal-500", 
    text: "bg-teal-100", 
    initial: "P4",
    image: "/avatars/player4.jpg",
    gender: "female"
  },
};

function TurnDot({ active, gamePhase, playerId }) {
  // Position the dot to the right of the name tag
  const getTurnDotPosition = () => {
    return 'absolute top-1/2 right-0 -translate-y-1/2 translate-x-full translate-x-[8px]';
  };

  return (
    <span
      className={`${getTurnDotPosition()} w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
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

  return (
    <div className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden border-2 ${getBorderColor()} ${isFinished ? 'opacity-50' : ''} relative`}>
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
          style={{ display: imageLoaded ? 'block' : 'none' }}
          crossOrigin="anonymous"
        />
      )}
      <div className={`w-full h-full ${avatar.bg} flex items-center justify-center ${imageLoaded && !imageError ? 'hidden' : ''}`}>
        <span className={`text-white font-bold text-xs sm:text-sm ${isFinished ? 'line-through' : ''}`}>
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
  const [botDifficulty, setBotDifficulty] = useState('medium');
  const [showDialogues, setShowDialogues] = useState(true);
  const [isDealing, setIsDealing] = useState(false);
  const [dealtCards, setDealtCards] = useState({ P1: [], P2: [], P3: [], P4: [] });
  const [hasDealt, setHasDealt] = useState(false);
  const [showPlayer1Hand, setShowPlayer1Hand] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [currentDialogue, setCurrentDialogue] = useState(null);
  const [showPassThoughtBubble, setShowPassThoughtBubble] = useState(false);
  const [playAnimation, setPlayAnimation] = useState(null);
  const usedDialoguesRef = useRef(new Set());
  const passedPlayersRef = useRef(new Set());
  const currentTrickRef = useRef(1);
  const previousCenterPileRef = useRef([]);
  const [showHelp, setShowHelp] = useState(false);
  const [helpMessage, setHelpMessage] = useState("");
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showHelpDialog, setShowHelpDialog] = useState(false);

  useEffect(() => {
    socket.emit("createGame");
    socket.on("gameState", (data) => {
      setGame(data);
      
      // Track when a new round starts
      if (data.trickNumber && data.trickNumber !== currentTrickRef.current) {
        // New round started, clear passed players
        passedPlayersRef.current.clear();
        currentTrickRef.current = data.trickNumber;
      }
      
      // Track players who have passed in current round
      if (data.players) {
        data.players.forEach(player => {
          if (player.passed) {
            passedPlayersRef.current.add(player.id);
          }
        });
      }
      
      // Check for new card plays and trigger animations
      if (data.centerPile && data.centerPile.length > 0) {
        const currentCenterPile = data.centerPile;
        const previousCenterPile = previousCenterPileRef.current;
        
        // If there's a new play (center pile grew)
        if (currentCenterPile.length > previousCenterPile.length) {
          const latestPlay = currentCenterPile[currentCenterPile.length - 1];
          const playerId = latestPlay.playerId;
          
          // Set animation based on player
          setPlayAnimation({
            playerId: playerId,
            cards: latestPlay.cards,
            timestamp: Date.now()
          });
          
          // Clear animation after it completes
          setTimeout(() => {
            setPlayAnimation(null);
          }, 800);
        }
        
        // Update previous center pile reference
        previousCenterPileRef.current = currentCenterPile;
      }
      
      // Debug: Log center pile data
      if (data.centerPile && data.centerPile.length > 0) {
        console.log("Center pile data:", data.centerPile);
        console.log("Center pile length:", data.centerPile.length);
      }
      
      // Generate help message for Player 1 only when it's their turn
      if (data.phase === "Playing" && showHelpDialog && data.turn === 0) {
        const player1 = data.players[0];
        const isMyTurn = data.turn === 0;
        const canPass = data.centerPile && data.centerPile.length > 0;
        const has3Spades = player1.hand && player1.hand.some(card => card.value === 3 && card.suit === "♠");
        const isFirstTrick = !data.centerPile || data.centerPile.length === 0;
        
        // Get information about the last played cards
        let lastPlayInfo = "";
        let currentTrick = null;
        if (data.centerPile && data.centerPile.length > 0) {
          const latestPlay = data.centerPile[data.centerPile.length - 1];
          const lastPlayerName = playerNameMap[latestPlay.playerId] || latestPlay.playerId;
          const lastCards = latestPlay.cards.map(card => `${card.value}${card.suit}`).join(", ");
          lastPlayInfo = `${lastPlayerName} played: ${lastCards}`;
          
          // Determine the combo type of the current trick
          const cardCount = latestPlay.cards.length;
          if (cardCount === 1) {
            currentTrick = { type: "single", cards: latestPlay.cards };
          } else if (cardCount === 2 && latestPlay.cards[0].value === latestPlay.cards[1].value) {
            currentTrick = { type: "pair", cards: latestPlay.cards };
          } else if (cardCount === 3 && latestPlay.cards.every(c => c.value === latestPlay.cards[0].value)) {
            currentTrick = { type: "triplet", cards: latestPlay.cards };
          } else if (cardCount === 4 && latestPlay.cards.every(c => c.value === latestPlay.cards[0].value)) {
            currentTrick = { type: "four", cards: latestPlay.cards };
          }
        }
        
        // Analyze Player 1's hand for valid moves to beat the current trick
        let validMoves = "";
        let rationale = "";
        let suggestedCard = "";
        
        if (player1.hand && player1.hand.length > 0 && currentTrick) {
          const hand = player1.hand;
          const valueOrder = {3:0,4:1,5:2,6:3,7:4,8:5,9:6,10:7,J:8,Q:9,K:10,A:11,2:12};
          const suitOrder = {"♠":0,"♣":1,"♦":2,"♥":3};
          
          // Find valid moves based on current trick type
          const validOptions = [];
          
          if (currentTrick.type === "single") {
            // Find singles that beat the current single
            const currentHigh = currentTrick.cards[0];
            hand.forEach(card => {
              if (valueOrder[card.value] > valueOrder[currentHigh.value] || 
                  (valueOrder[card.value] === valueOrder[currentHigh.value] && suitOrder[card.suit] > suitOrder[currentHigh.suit])) {
                validOptions.push({ type: "single", cards: [card], value: card.value, suit: card.suit });
              }
            });
            rationale = "You need to play a single card higher than the current play.";
          } else if (currentTrick.type === "pair") {
            // Find pairs that beat the current pair
            const currentHigh = currentTrick.cards[0];
            const valueCounts = {};
            hand.forEach(card => {
              valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
            });
            Object.entries(valueCounts).forEach(([value, count]) => {
              if (count >= 2 && valueOrder[value] > valueOrder[currentHigh.value]) {
                const pairCards = hand.filter(card => card.value === value).slice(0, 2);
                validOptions.push({ type: "pair", cards: pairCards, value: value });
              }
            });
            rationale = "You need to play a pair with higher value than the current pair.";
          } else if (currentTrick.type === "triplet") {
            // Find triplets that beat the current triplet
            const currentHigh = currentTrick.cards[0];
            const valueCounts = {};
            hand.forEach(card => {
              valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
            });
            Object.entries(valueCounts).forEach(([value, count]) => {
              if (count >= 3 && valueOrder[value] > valueOrder[currentHigh.value]) {
                const tripletCards = hand.filter(card => card.value === value).slice(0, 3);
                validOptions.push({ type: "triplet", cards: tripletCards, value: value });
              }
            });
            rationale = "You need to play a triplet with higher value than the current triplet.";
          } else if (currentTrick.type === "four") {
            // Find fours that beat the current four
            const currentHigh = currentTrick.cards[0];
            const valueCounts = {};
            hand.forEach(card => {
              valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
            });
            Object.entries(valueCounts).forEach(([value, count]) => {
              if (count >= 4 && valueOrder[value] > valueOrder[currentHigh.value]) {
                const fourCards = hand.filter(card => card.value === value).slice(0, 4);
                validOptions.push({ type: "four", cards: fourCards, value: value });
              }
            });
            rationale = "You need to play four cards with higher value than the current four.";
          } else if (currentTrick.type === "straight") {
            // Find straights that beat the current straight
            const currentStraight = currentTrick.cards;
            const currentHigh = currentStraight[currentStraight.length - 1]; // Highest card in straight
            
            // Check for straights of the same length
            for (let start = 0; start <= hand.length - currentStraight.length; start++) {
              for (let length = currentStraight.length; length <= Math.min(13, hand.length); length++) {
                const potentialStraight = hand.slice(start, start + length);
                if (potentialStraight.length >= currentStraight.length) {
                  // Check if it's a valid straight
                  let isValidStraight = true;
                  const sortedPotential = potentialStraight.sort((a, b) => valueOrder[a.value] - valueOrder[b.value]);
                  for (let i = 1; i < sortedPotential.length; i++) {
                    if (valueOrder[sortedPotential[i].value] - valueOrder[sortedPotential[i-1].value] !== 1) {
                      isValidStraight = false;
                      break;
                    }
                  }
                  if (isValidStraight && !sortedPotential.some(c => c.value === 2)) {
                    const straightHigh = sortedPotential[sortedPotential.length - 1];
                    if (valueOrder[straightHigh.value] > valueOrder[currentHigh.value]) {
                      validOptions.push({ type: "straight", cards: sortedPotential, value: straightHigh.value });
                    }
                  }
                }
              }
            }
            rationale = "You need to play a straight with higher value than the current straight.";
          } else if (currentTrick.type.includes("pairseq")) {
            // Find pair sequences that beat the current pair sequence
            const currentPairSeq = currentTrick.cards;
            const currentHigh = currentPairSeq[currentPairSeq.length - 2]; // Highest pair in sequence
            
            // Check for pair sequences of the same length
            const valueCounts = {};
            hand.forEach(card => {
              valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
            });
            
            const pairCount = currentPairSeq.length / 2;
            const requiredValues = [3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"];
            
            for (let start = 0; start <= requiredValues.length - pairCount; start++) {
              const sequenceValues = requiredValues.slice(start, start + pairCount);
              let hasAllPairs = true;
              const pairSequence = [];
              
              for (const value of sequenceValues) {
                const cardsOfValue = hand.filter(c => c.value === value);
                if (cardsOfValue.length < 2) {
                  hasAllPairs = false;
                  break;
                }
                pairSequence.push(cardsOfValue[0], cardsOfValue[1]);
              }
              
              if (hasAllPairs) {
                const pairSeqHigh = pairSequence[pairSequence.length - 2];
                if (valueOrder[pairSeqHigh.value] > valueOrder[currentHigh.value]) {
                  validOptions.push({ type: "pairseq", cards: pairSequence, value: pairSeqHigh.value });
                }
              }
            }
            rationale = "You need to play a pair sequence with higher value than the current pair sequence.";
          }
          
          // Sort valid options by value (lowest first for better suggestions)
          validOptions.sort((a, b) => valueOrder[a.value] - valueOrder[b.value]);
          
          if (validOptions.length > 0) {
            const bestOption = validOptions[0];
            suggestedCard = bestOption.cards.map(card => `${card.value}${card.suit}`).join(", ");
            validMoves = validOptions.map(option => 
              option.cards.map(card => `${card.value}${card.suit}`).join(", ")
            ).join("\n");
          } else {
            rationale = "You cannot beat the current play. Consider passing.";
            validMoves = "None available";
            suggestedCard = "Pass";
          }
        }
        
        let helpMsg = "";
        
        if (isFirstTrick && !has3Spades) {
          helpMsg = "You must have 3♠ to start the game. Wait for another player to lead.";
        } else if (isFirstTrick && has3Spades) {
          // Find all valid combinations that include 3♠
          const validCombinations = [];
          const hand = player1.hand || [];
          const threeSpades = hand.find(c => c.value === 3 && c.suit === "♠");
          
          if (threeSpades) {
            // Single 3♠
            validCombinations.push("3♠");
            
            // Find pairs with 3♠
            const otherThrees = hand.filter(c => c.value === 3 && c.suit !== "♠");
            if (otherThrees.length > 0) {
              validCombinations.push(`3♠, ${otherThrees[0].value}${otherThrees[0].suit}`);
            }
            
            // Find triplets with 3♠
            if (otherThrees.length >= 2) {
              validCombinations.push(`3♠, ${otherThrees[0].value}${otherThrees[0].suit}, ${otherThrees[1].value}${otherThrees[1].suit}`);
            }
            
            // Find fours with 3♠
            if (otherThrees.length >= 3) {
              validCombinations.push(`3♠, ${otherThrees[0].value}${otherThrees[0].suit}, ${otherThrees[1].value}${otherThrees[1].suit}, ${otherThrees[2].value}${otherThrees[2].suit}`);
            }
            
            // Find straights that include 3♠
            const valueOrder = {3:0,4:1,5:2,6:3,7:4,8:5,9:6,10:7,J:8,Q:9,K:10,A:11,2:12};
            
            // Find all possible straights of length 3-13 that include 3♠
            for (let length = 3; length <= Math.min(13, hand.length); length++) {
              // Generate all possible combinations of 'length' cards from hand
              const combinations = [];
              const generateCombinations = (arr, size, start, current) => {
                if (current.length === size) {
                  combinations.push([...current]);
                  return;
                }
                for (let i = start; i < arr.length; i++) {
                  current.push(arr[i]);
                  generateCombinations(arr, size, i + 1, current);
                  current.pop();
                }
              };
              
              generateCombinations(hand, length, 0, []);
              
              // Check each combination for valid straights that include 3♠
              for (const combo of combinations) {
                if (combo.some(c => c.value === 3 && c.suit === "♠")) {
                  // Sort by value
                  const sortedCombo = combo.sort((a, b) => valueOrder[a.value] - valueOrder[b.value]);
                  
                  // Check if it's a valid straight (consecutive values, no 2's)
                  let isValidStraight = true;
                  for (let i = 1; i < sortedCombo.length; i++) {
                    if (valueOrder[sortedCombo[i].value] - valueOrder[sortedCombo[i-1].value] !== 1) {
                      isValidStraight = false;
                      break;
                    }
                  }
                  
                  if (isValidStraight && !sortedCombo.some(c => c.value === 2)) {
                    const straightStr = sortedCombo.map(c => `${c.value}${c.suit}`).join(", ");
                    if (!validCombinations.includes(straightStr)) {
                      validCombinations.push(straightStr);
                    }
                  }
                }
              }
            }
            
            // Find pair sequences starting with 3♠
            const valueCounts = {};
            hand.forEach(card => {
              valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
            });
            
            // Check for pair sequences of length 2, 3, 4, 5, 6 pairs
            for (let pairCount = 2; pairCount <= 6; pairCount++) {
              const requiredValues = [3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"];
              const sequenceValues = requiredValues.slice(0, pairCount);
              
              // Check if we have pairs for all required values starting from 3
              let hasAllPairs = true;
              const pairSequence = [];
              for (const value of sequenceValues) {
                const cardsOfValue = hand.filter(c => c.value === value);
                if (cardsOfValue.length < 2) {
                  hasAllPairs = false;
                  break;
                }
                // Take first two cards of this value
                pairSequence.push(cardsOfValue[0], cardsOfValue[1]);
              }
              
              if (hasAllPairs && pairSequence.some(c => c.value === 3 && c.suit === "♠")) {
                const pairSeqStr = pairSequence.map(c => `${c.value}${c.suit}`).join(", ");
                if (!validCombinations.includes(pairSeqStr)) {
                  validCombinations.push(pairSeqStr);
                }
              }
            }
          }
          
          if (validCombinations.length > 0) {
            helpMsg = `You must play 3♠ to start. Valid combinations:\n${validCombinations.slice(0, 5).join("\n")}${validCombinations.length > 5 ? "\n..." : ""}`;
          } else {
            helpMsg = "Select 3♠ to start the game.";
          }
        } else if (canPass) {
          if (lastPlayInfo && validMoves && rationale && suggestedCard) {
            const suggestion = suggestedCard === "Pass" ? "Pass" : `${suggestedCard} or Pass`;
            helpMsg = `${lastPlayInfo}.\n${rationale}\n\nValid moves:\n${validMoves}.\nSuggested: ${suggestion}.\n\nNote: If you pass, you're out of this round until the next round restarts.`;
          } else if (lastPlayInfo && validMoves && rationale) {
            helpMsg = `${lastPlayInfo}.\n${rationale}\n\nValid moves:\n${validMoves}.\n\nNote: If you pass, you're out of this round until the next round restarts.`;
          } else if (lastPlayInfo) {
            helpMsg = `${lastPlayInfo}.\nSelect cards to beat the play or click Pass.\n\nNote: If you pass, you're out of this round until the next round restarts.`;
          } else {
            helpMsg = "Select cards to play or click Pass to skip your turn.\n\nNote: If you pass, you're out of this round until the next round restarts.";
          }
        } else {
          helpMsg = "Select cards to play any valid combination.";
        }
        
        setHelpMessage(helpMsg);
      } else if (data.phase === "Playing" && showHelpDialog && data.turn !== 0) {
        // Clear help message when it's not Player 1's turn
        setHelpMessage("");
      }
      
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
                  }, 2000);
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
  }, []);

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
            await new Promise(resolve => setTimeout(resolve, 200));
            
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
    }, 3000);
  };

  const startNewGame = () => {
    // Start clearing animation
    setIsClearing(true);
    setSelectedCards([]);
    setHasDealt(false);
    setShowPlayer1Hand(false);
    usedDialoguesRef.current.clear();
    
    // Clear cards first, then start new game
    setTimeout(() => {
      setIsClearing(false);
      socket.emit("createGame");
    }, 800);
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
    <div className="relative w-screen h-screen bg-green-900 flex items-center justify-center overflow-hidden">
      {/* Game Container - Responsive */}
      <div className="relative w-full h-full max-w-6xl max-h-6xl flex items-center justify-center p-0">
        
        {/* Center Pile - Display played cards with improved visibility */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -translate-y-[35px] z-50">
                      <div className="text-center mb-0 bg-black bg-opacity-30 backdrop-blur-sm rounded-lg pt-0 pb-5 pl-5 pr-5">
            <div className="text-white text-xs sm:text-sm font-semibold mb-0">
              {game.phase === "Playing" && game.centerPile && game.centerPile.length > 0 ? 
                "" : 
                game.phase === "Playing" ? "Waiting for play..." : ""
              }
            </div>
            {/* Debug info - show center pile status */}
            {showDebug && (
              <div className="text-white text-xs opacity-60 mb-1">
                Center pile: {game.centerPile ? game.centerPile.length : 'null'} items
              </div>
            )}
                            <div className="relative flex justify-center items-center max-w-48" style={{ minHeight: '80px' }}>
              {/* Animated cards being played */}
              {playAnimation && playAnimation.cards && (
                <div className="absolute inset-0 flex justify-center items-center">
                  <div className="flex relative">
                    {playAnimation.cards.map((card, cardIndex) => {
                      const animationClass = `animate-play-from-p${playAnimation.playerId.slice(-1)}`;
                      return (
                        <div
                          key={`animated-${cardIndex}-${playAnimation.timestamp}`}
                                                     className={`w-10 h-14 sm:w-12 sm:h-16 rounded shadow-lg flex flex-col items-center justify-center bg-white relative ${animationClass}`}
                          style={{
                            // Overlap cards by positioning them with negative margins
                            marginLeft: cardIndex === 0 ? '0' : '-8px',
                            zIndex: cardIndex + 100
                          }}
                        >
                          <div className={`text-xs sm:text-sm font-bold ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"}`}>
                            {card.value}
                          </div>
                          <div className={`text-sm sm:text-lg ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"}`}>
                            {card.suit}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {game.centerPile && game.centerPile.length > 0 && !playAnimation ? (
                // Only show the most recent play (last item in centerPile) when no animation is playing
                (() => {
                  const latestPlay = game.centerPile[game.centerPile.length - 1];
                  return (
                    <div className="flex flex-col items-center">
                      <div className="text-white text-xs mb-2 opacity-80">
                        {playerNameMap[latestPlay.playerId] || latestPlay.playerId}
                      </div>
                      <div className="flex relative">
                        {latestPlay.cards && latestPlay.cards.map((card, cardIndex) => (
                          <div
                            key={`latest-${cardIndex}`}
                            className="w-10 h-14 sm:w-12 sm:h-16 rounded shadow-lg flex flex-col items-center justify-center bg-white animate-bounce-in relative"
                            style={{
                              animationDelay: `${cardIndex * 100}ms`,
                              animationDuration: '0.5s',
                              // Overlap cards by positioning them with negative margins
                              marginLeft: cardIndex === 0 ? '0' : '-8px',
                              zIndex: cardIndex + 10
                            }}
                          >
                            <div className={`text-xs sm:text-sm font-bold ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"}`}>
                              {card.value}
                            </div>
                            <div className={`text-sm sm:text-lg ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"}`}>
                              {card.suit}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()
              ) : (
                // Debug fallback - show when center pile should be visible but isn't
                game.phase === "Playing" && !playAnimation && (
                  <div className="text-white text-xs opacity-60">
                    No cards in center pile
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Players - Compact positioning around center */}
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
          renderVerticalCards={renderVerticalCards}
          showPassThoughtBubble={showPassThoughtBubble}
          gamePhase={game.phase}
          passedPlayers={passedPlayersRef.current}
          playAnimation={playAnimation}
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
          renderVerticalCards={renderVerticalCards}
          showPassThoughtBubble={showPassThoughtBubble}
          gamePhase={game.phase}
          passedPlayers={passedPlayersRef.current}
          playAnimation={playAnimation}
          showHelpDialog={showHelpDialog}
          helpMessage={helpMessage}
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
          renderVerticalCards={renderVerticalCards}
          showPassThoughtBubble={showPassThoughtBubble}
          gamePhase={game.phase}
          passedPlayers={passedPlayersRef.current}
          playAnimation={playAnimation}
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
          renderVerticalCards={renderVerticalCards}
          showPassThoughtBubble={showPassThoughtBubble}
          gamePhase={game.phase}
          passedPlayers={passedPlayersRef.current}
          playAnimation={playAnimation}
        />

      </div>

      {/* Help Dialog - Fixed at bottom right of screen */}
      {showHelpDialog && helpMessage && game.phase === "Playing" && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-gray-800 text-white text-xs sm:text-sm px-4 py-3 rounded-lg shadow-lg max-w-96 text-left border border-gray-600 whitespace-pre-line">
            💡 {helpMessage}
          </div>
        </div>
      )}

                     {/* Controls - Positioned at bottom of table, above player 1 cards */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[calc(50%+65px)] translate-x-[-78px] flex flex-row space-x-2 z-50">
        {game.phase !== "RoundOver" && game.phase !== "GameOver" && showPlayer1Hand && (
          <>
            <button 
              onClick={handlePlay} 
              disabled={!isMyTurn}
              className={`px-4 sm:px-6 py-2 rounded text-sm sm:text-base font-semibold ${isMyTurn ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-400 cursor-not-allowed'} text-white shadow-lg transition-all duration-200`}
              title={!isMyTurn ? "Not your turn" : (isFirstTrick && hasThreeSpades ? "You must play 3♠ to start the game" : "Play selected cards")}
            >
              {isFirstTrick && hasThreeSpades ? "Play 3♠" : "Play"}
            </button>
            <button 
              onClick={handlePass} 
              disabled={!isMyTurn || !canPass}
              className={`px-4 sm:px-6 py-2 rounded text-sm sm:text-base font-semibold ${isMyTurn && canPass ? 'bg-green-400 hover:bg-green-500' : 'bg-gray-400 cursor-not-allowed'} text-white shadow-lg transition-all duration-200`}
              title={!isMyTurn ? "Not your turn" : (!canPass ? "You must play 3♠ to start the game" : "Pass your turn")}
            >
              Pass
            </button>
            <button 
              onClick={() => setShowHelpDialog(!showHelpDialog)}
              className={`px-2 sm:px-3 py-1 rounded text-sm font-semibold ${showHelpDialog ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'} text-white shadow-lg transition-all duration-200`}
              title={showHelpDialog ? "Hide help hints" : "Show help hints"}
            >
              💡
            </button>
          </>
        )}
      </div>

      {/* Game Buttons - Centered positioning */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-row space-x-4 z-50">
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="px-3 sm:px-4 py-2 rounded bg-gray-600 hover:bg-gray-700 transition-all duration-300 text-white text-xs sm:text-sm font-semibold shadow-lg"
          title="Game Settings"
        >
          ⚙️ Settings
        </button>
        <button 
          onClick={startNewGame}
          className="px-3 sm:px-4 py-2 rounded bg-green-600 hover:bg-green-700 transition-all duration-300 text-white text-xs sm:text-sm font-semibold shadow-lg"
          title="Start a new game with shuffled cards"
        >
          🃏 New Game
        </button>
      </div>

      {/* Settings Panel - Responsive */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 text-white p-4 sm:p-6 rounded-xl shadow-2xl border border-gray-600 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-300">Game Settings</h2>
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
                  <span className="text-green-400 text-sm">Easy</span>
                  <span className="text-xs text-gray-400">- Basic strategy</span>
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
                  <span className="text-yellow-400 text-sm">Medium</span>
                  <span className="text-xs text-gray-400">- Balanced play</span>
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
                  <span className="text-red-400 text-sm">Hard</span>
                  <span className="text-xs text-gray-400">- Advanced strategy</span>
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
                <span className="text-xs text-gray-400">- Reveal bot cards</span>
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
                <span className="text-xs text-gray-400">- Display bot dialogue</span>
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
                <span className="text-xs text-gray-400">- Display debug info</span>
              </label>
            </div>

            {/* Apply Button */}
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700 transition-all duration-300 text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowSettings(false);
                  socket.emit("updateDifficulty", botDifficulty);
                }}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 transition-all duration-300 text-sm"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Winner Banner - Responsive */}
      {game.phase === "GameOver" && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-500 text-black text-2xl sm:text-4xl font-bold px-6 sm:px-12 py-4 sm:py-6 rounded-xl shadow-lg z-50">
          🎉 Winner: {game.winner || "Unknown"} 🎉
          <div className="text-xs sm:text-sm mt-2">Finish Order: {game.finishOrder?.map(name => playerNameMap[name] || name).join(', ') || 'None'}</div>
        </div>
      )}

      {/* Debug Panel - Responsive */}
      {showDebug && (
        <div className="fixed bottom-4 right-4 w-72 sm:w-80 bg-gray-950 text-white p-3 sm:p-4 rounded-xl shadow-2xl border border-gray-700 z-50 max-h-[60vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base sm:text-lg font-bold text-yellow-400">Debug Log</h2>
            <button 
              onClick={() => setShowDebug(false)}
              className="text-gray-400 hover:text-white text-xl font-bold"
            >
              ×
            </button>
          </div>
          <div className="text-xs sm:text-sm mb-2">
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
  renderVerticalCards,
  showPassThoughtBubble,
  gamePhase,
  passedPlayers,
  playAnimation,
  showHelpDialog,
  helpMessage
}) {
  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[calc(50%+130px)]';
      case 'bottom':
        return 'absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-[calc(50%+130px)] z-50';
      case 'left':
        return 'absolute top-1/2 left-1/2 transform -translate-x-[calc(50%+170px)] -translate-y-1/2';
      case 'right':
        return 'absolute top-1/2 left-1/2 transform translate-x-[calc(50%+160px)] -translate-y-1/2';
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
    return playerNameMap[playerId] || player.name;
  };

  // Track if player has passed in current round to maintain pass text even when server resets passed state
  const hasPassedInCurrentRound = () => {
    // If player is currently passed, show pass text
    if (player.passed) return true;
    
    // Check if this player has passed in the current round (even if server reset passed state)
    if (passedPlayers && passedPlayers.has(playerId)) {
      return true;
    }
    
    return false;
  };

  const getDialoguePlayer = () => {
    switch (playerId) {
      case "P1": return "You";
      case "P2": return "Hazel";
      case "P3": return "Dina";
      case "P4": return "Blake";
      default: return "";
    }
  };

  return (
    <div className={getPositionClasses()}>
      <div className="relative">

        
        {/* Cards Container - Reference for centering */}
        <div className="flex justify-center mb-0">
          {isClearing ? (
            (playerId === "P2" || playerId === "P4") ? 
            renderVerticalCards(
              Array.from({ length: player.hand.length || 0 }, (_, idx) => ({ value: 'back', suit: 'back' })), 
              false, () => {}, [], true, 0, true, player.passed
            ) :
            renderFannedCards(
              Array.from({ length: player.hand.length || 0 }, (_, idx) => ({ value: 'back', suit: 'back' })), 
              false, () => {}, [], true, 0, true, player.passed
            )
          ) : isDealing ? (
            (playerId === "P2" || playerId === "P4") ? 
            renderVerticalCards(
              dealtCards[playerId].map(() => ({ value: 'back', suit: 'back' })), 
              false, () => {}, [], true, 0, false, player.passed, getAnimationClass()
            ) :
            renderFannedCards(
              dealtCards[playerId].map(() => ({ value: 'back', suit: 'back' })), 
              false, () => {}, [], true, 0, false, player.passed, getAnimationClass()
            )
          ) : playerId === "P1" && showPlayer1Hand ? (
            renderFannedCards(
              player.hand, isMyTurn, toggleCard, selectedCards, false, 0, false, player.passed, "", true
            )
          ) : (
            (playerId === "P2" || playerId === "P4") ? 
            renderVerticalCards(
              player.hand, false, () => {}, [], !showBotCards, 0, false, player.passed
            ) :
            renderFannedCards(
              player.hand, false, () => {}, [], !showBotCards, 0, false, player.passed
            )
          )}
        </div>
        
                                         {/* Name - Positioned under avatar based on player */}
                <div className={`absolute z-20 ${
                  playerId === "P2" ? "top-1/2 left-0 -translate-y-1/2 -translate-x-full -translate-x-[115px] translate-y-full translate-y-[27px]" : // Hazel: left of cards, below avatar, moved 115px left, moved 27px down
                  playerId === "P4" ? "top-1/2 right-0 -translate-y-1/2 translate-x-full translate-y-full translate-x-[90px] translate-y-[27px]" : // Blake: right of cards, below avatar, moved 90px right, moved 27px down
                   playerId === "P1" ? "bottom-0 left-1/2 -translate-x-1/2 translate-y-[calc(100%+114px)]" : // You: below avatar, moved down 40px
                       playerId === "P3" ? "top-0 left-1/2 -translate-x-1/2 -translate-y-[calc(100%+30px)]" : // Dina: above cards, moved up 30px (20px + 10px)
                  "top-0 left-1/2 -translate-x-1/2 -translate-y-full translate-y-[20px]" // Default: above cards, moved 20px down
                }`}>
                      <div className={`relative font-bold px-1 py-0.5 rounded-lg ${playerColors[playerId]} ${activeHighlight(playerId)} ${inactiveHighlight(player)} text-center whitespace-nowrap text-xs sm:text-sm w-[30px] sm:w-[60px]`}>
              <TurnDot active={player.isActive} gamePhase={gamePhase} playerId={playerId} />
              <span className="text-center">{getPlayerName()}</span>
            </div>
        </div>
        
                                                                  {/* Avatar - Positioned based on player */}
                 <div className={`absolute z-10 ${
                                                                           playerId === "P2" ? "top-1/2 left-0 -translate-y-1/2 -translate-x-[calc(100%+40px)] translate-y-[-73px]" : // Hazel: left of cards, moved 40px left, moved down 5px
                  playerId === "P4" ? "top-1/2 right-0 -translate-y-1/2 translate-x-[calc(100%+20px)] translate-y-[-43px]" : // Blake: right of cards, moved 20px right, moved up 70px
                                                                                   playerId === "P1" ? "bottom-0 left-1/2 -translate-x-1/2 translate-y-[calc(100%+10px)]" : // You: below cards, moved down 10px
                    playerId === "P3" ? "top-0 left-1/2 -translate-x-1/2 -translate-y-[calc(100%+50px)]" : // Dina: above name, moved up 50px (30px + 20px)
                   "top-0 left-1/2 -translate-x-1/2 -translate-y-[calc(100%+0rem)]" // Default: above name
                 }`}>
          <div className="relative">
            <PlayerAvatar 
              playerId={playerId} 
              isActive={player.isActive} 
              isFinished={player.finished} 
              isPassed={player.passed} 
            />
            
            {/* Dialogue Speech Bubble - Responsive */}
            {showDialogues && currentDialogue && currentDialogue.player === getDialoguePlayer() && (
              <div className={`absolute ${playerId === "P1" ? "-top-2 left-1/2 -translate-x-1/2" : playerId === "P4" ? "top-1/2 -translate-y-1/2 right-full mr-0" : "top-1/2 -translate-y-1/2 left-full ml-0"} text-xs sm:text-sm font-medium px-1 py-0.5 rounded-lg bg-black bg-opacity-90 ${playerDialogueColors[playerId]} animate-pulse shadow-lg whitespace-nowrap max-w-32 sm:max-w-xs`} style={{ minWidth: 'fit-content', width: 'auto' }}>
                "{currentDialogue.message}"
                {/* Speech bubble tail */}
                <div className={`absolute ${playerId === "P1" ? "top-full left-1/2 -translate-x-1/2" : playerId === "P4" ? "top-1/2 -translate-y-1/2 -right-2" : "top-1/2 -translate-y-1/2 -left-2"} w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black border-opacity-90`}></div>
              </div>
            )}
            
            {/* Pass Thought Bubble */}
            {showPassThoughtBubble && playerId === "P1" && (
              <div className={`absolute -top-2 left-1/2 -translate-x-1/2 text-xs sm:text-sm font-medium px-1 py-0.5 rounded-lg bg-black bg-opacity-90 ${playerDialogueColors[playerId]} animate-pulse shadow-lg whitespace-nowrap`} style={{ minWidth: 'fit-content', width: 'auto' }}>
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
        className={`w-10 h-14 sm:w-12 sm:h-16 border rounded shadow flex flex-col items-center justify-center transition-all duration-300
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
                <div className="w-4 h-6 sm:w-6 sm:h-8 bg-white rounded-sm relative">
                  {/* Central cross/star motif */}
                  <div className="absolute inset-1 bg-red-700 rounded-sm flex items-center justify-center">
                    <div className="w-0.5 h-2 sm:w-1 sm:h-3 bg-white"></div>
                    <div className="w-2 h-0.5 sm:w-3 sm:h-1 bg-white absolute"></div>
                  </div>
                </div>
              </div>
              {/* Corner scrollwork patterns */}
              <div className="absolute top-1 sm:top-2 left-1 sm:left-2 w-1.5 h-1.5 sm:w-2 sm:h-2">
                <div className="w-full h-full bg-white rounded-full opacity-80"></div>
                <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-red-700 rounded-full"></div>
              </div>
              <div className="absolute top-1 sm:top-2 right-1 sm:right-2 w-1.5 h-1.5 sm:w-2 sm:h-2">
                <div className="w-full h-full bg-white rounded-full opacity-80"></div>
                <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-red-700 rounded-full"></div>
              </div>
              <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 w-1.5 h-1.5 sm:w-2 sm:h-2">
                <div className="w-full h-full bg-white rounded-full opacity-80"></div>
                <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-red-700 rounded-full"></div>
              </div>
              <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 w-1.5 h-1.5 sm:w-2 sm:h-2">
                <div className="w-full h-full bg-white rounded-full opacity-80"></div>
                <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-red-700 rounded-full"></div>
              </div>
              {/* Decorative vine patterns */}
              <div className="absolute top-2 sm:top-3 left-2 sm:left-3 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-full opacity-60"></div>
              <div className="absolute top-2 sm:top-3 right-2 sm:right-3 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-full opacity-60"></div>
              <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-full opacity-60"></div>
              <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-full opacity-60"></div>
              {/* Center decorative dots */}
              <div className="absolute top-3 sm:top-4 left-3 sm:left-4 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
              <div className="absolute top-3 sm:top-4 right-3 sm:right-4 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
              <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
              <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
            </div>
          </>
        ) : (
          <>
            {/* Simple design for bot cards - just center content */}
            <div className="flex flex-col items-center justify-center">
              <div className={`text-sm sm:text-lg font-bold ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"}`}>{card.value}</div>
              <div className={`text-base sm:text-xl ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"}`}>{card.suit}</div>
            </div>
          </>
        )}
      </div>
    );
  });
}

function renderFannedCards(cards, selectable = false, toggle = () => {}, selected = [], isHidden = false, animationDelay = 0, isClearing = false, isPassed = false, animationClass = "", isPlayer1 = false) {
  return (
    <div className={`relative flex items-end justify-center ${animationClass}`} style={{ width: `${Math.max(cards.length * 20, 160)}px`, height: '60px' }}>
      {cards.map((card, idx) => {
        const isSelected = selected.find((c) => c.value === card.value && c.suit === card.suit);
        // Calculate fan angle - cards spread from left to right
        const totalCards = cards.length;
        const maxAngle = 20; // Reduced maximum spread angle for mobile
        const angleStep = totalCards > 1 ? maxAngle / (totalCards - 1) : 0;
        const currentAngle = totalCards > 1 ? -maxAngle / 2 + (idx * angleStep) : 0;
        
        // Calculate position for overlapping effect - tighter fan for mobile
        const cardWidth = 48; // w-12 = 48px on mobile
        const overlap = 27; // Tighter overlap for more compact fan (reduced by 5px for better spacing)
        const leftPosition = idx * (cardWidth - overlap);
        
        return (
          <div
            key={idx}
            onClick={() => selectable && toggle(card)}
            className={`w-12 h-16 sm:w-16 sm:h-20 border rounded shadow flex flex-col items-center justify-center transition-all duration-300 absolute
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
                    <div className="w-4 h-6 sm:w-6 sm:h-8 bg-white rounded-sm relative">
                      {/* Central cross/star motif */}
                      <div className="absolute inset-1 bg-red-700 rounded-sm flex items-center justify-center">
                        <div className="w-0.5 h-2 sm:w-1 sm:h-3 bg-white"></div>
                        <div className="w-2 h-0.5 sm:w-3 sm:h-1 bg-white absolute"></div>
                      </div>
                    </div>
                  </div>
                  {/* Corner scrollwork patterns */}
                  <div className="absolute top-1 sm:top-2 left-1 sm:left-2 w-1.5 h-1.5 sm:w-2 sm:h-2">
                    <div className="w-full h-full bg-white rounded-full opacity-80"></div>
                    <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-red-700 rounded-full"></div>
                  </div>
                  <div className="absolute top-1 sm:top-2 right-1 sm:right-2 w-1.5 h-1.5 sm:w-2 sm:h-2">
                    <div className="w-full h-full bg-white rounded-full opacity-80"></div>
                    <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-red-700 rounded-full"></div>
                  </div>
                  <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 w-1.5 h-1.5 sm:w-2 sm:h-2">
                    <div className="w-full h-full bg-white rounded-full opacity-80"></div>
                    <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-red-700 rounded-full"></div>
                  </div>
                  <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 w-1.5 h-1.5 sm:w-2 sm:h-2">
                    <div className="w-full h-full bg-white rounded-full opacity-80"></div>
                    <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-red-700 rounded-full"></div>
                  </div>
                  {/* Decorative vine patterns */}
                  <div className="absolute top-2 sm:top-3 left-2 sm:left-3 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-full opacity-60"></div>
                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-full opacity-60"></div>
                  <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-full opacity-60"></div>
                  <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-full opacity-60"></div>
                  {/* Center decorative dots */}
                  <div className="absolute top-3 sm:top-4 left-3 sm:left-4 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
                  <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
                </div>
              </>
            ) : (
              <>
                {/* Top-left corner */}
                <div className="absolute top-1 left-1 text-left">
                  <div className={`${isPlayer1 ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'} font-bold ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"} ${card.value === "10" ? 'text-xs sm:text-xs' : ''}`}>{card.value}</div>
                  <div className={`${isPlayer1 ? 'text-sm' : 'text-xs'} ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"}`}>{card.suit}</div>
                </div>
                {/* Bottom-right corner (rotated) */}
                <div className="absolute bottom-1 right-1 text-right transform rotate-180">
                  <div className={`${isPlayer1 ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'} font-bold ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"} ${card.value === "10" ? 'text-xs sm:text-xs' : ''}`}>{card.value}</div>
                  <div className={`${isPlayer1 ? 'text-sm' : 'text-xs'} ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"}`}>{card.suit}</div>
                </div>
                {/* Center suit - only show on the rightmost card (top of stack) */}
                {idx === cards.length - 1 && (
                  <div className="flex items-center justify-center">
                    <span className={`${isPlayer1 ? 'text-xl sm:text-3xl' : 'text-lg sm:text-2xl'} ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"}`}>{card.suit}</span>
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

function renderVerticalCards(cards, selectable = false, toggle = () => {}, selected = [], isHidden = false, animationDelay = 0, isClearing = false, isPassed = false, animationClass = "") {
  return (
    <div className={`relative flex items-center justify-center ${animationClass}`} style={{ width: '60px', height: `${Math.max(cards.length * 16, 160)}px` }}>
      {cards.map((card, idx) => {
        const isSelected = selected.find((c) => c.value === card.value && c.suit === card.suit);
        // Calculate fan angle - cards spread from top to bottom
        const totalCards = cards.length;
        const maxAngle = 20; // Reduced maximum spread angle for mobile
        const angleStep = totalCards > 1 ? maxAngle / (totalCards - 1) : 0;
        const currentAngle = totalCards > 1 ? -maxAngle / 2 + (idx * angleStep) : 0;
        
        // Calculate position for overlapping effect - vertical fan
        const cardHeight = 64; // h-16 = 64px on mobile
        const overlap = 48; // Tighter overlap for more compact vertical fan
        const topPosition = idx * (cardHeight - overlap);
        
        return (
          <div
            key={idx}
            onClick={() => selectable && toggle(card)}
            className={`w-12 h-16 sm:w-16 sm:h-20 border rounded shadow flex flex-col items-center justify-center transition-all duration-300 absolute
              ${isHidden ? "" : "bg-white"}
              ${selectable ? "cursor-pointer hover:bg-yellow-200" : ""}
              ${isSelected ? "ring-2 ring-yellow-400" : ""}
              ${isPassed ? "opacity-90 grayscale" : ""}
              ${animationDelay > 0 ? "animate-slide-in-left" : ""}
              ${isClearing ? "animate-fade-out" : ""}`}
            style={{
              transform: `rotateX(${currentAngle}deg) ${isSelected ? 'translateX(-8px)' : ''}`,
              transformOrigin: 'center left',
              top: `${topPosition}px`,
              zIndex: idx,
              left: '0',
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
                    <div className="w-4 h-6 sm:w-6 sm:h-8 bg-white rounded-sm relative">
                      {/* Central cross/star motif */}
                      <div className="absolute inset-1 bg-red-700 rounded-sm flex items-center justify-center">
                        <div className="w-0.5 h-2 sm:w-1 sm:h-3 bg-white"></div>
                        <div className="w-2 h-0.5 sm:w-3 sm:h-1 bg-white absolute"></div>
                      </div>
                    </div>
                  </div>
                  {/* Corner scrollwork patterns */}
                  <div className="absolute top-1 sm:top-2 left-1 sm:left-2 w-1.5 h-1.5 sm:w-2 sm:h-2">
                    <div className="w-full h-full bg-white rounded-full opacity-80"></div>
                    <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-red-700 rounded-full"></div>
                  </div>
                  <div className="absolute top-1 sm:top-2 right-1 sm:right-2 w-1.5 h-1.5 sm:w-2 sm:h-2">
                    <div className="w-full h-full bg-white rounded-full opacity-80"></div>
                    <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-red-700 rounded-full"></div>
                  </div>
                  <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 w-1.5 h-1.5 sm:w-2 sm:h-2">
                    <div className="w-full h-full bg-white rounded-full opacity-80"></div>
                    <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-red-700 rounded-full"></div>
                  </div>
                  <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 w-1.5 h-1.5 sm:w-2 sm:h-2">
                    <div className="w-full h-full bg-white rounded-full opacity-80"></div>
                    <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-red-700 rounded-full"></div>
                  </div>
                  {/* Decorative vine patterns */}
                  <div className="absolute top-2 sm:top-3 left-2 sm:left-3 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-full opacity-60"></div>
                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-full opacity-60"></div>
                  <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-full opacity-60"></div>
                  <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-full opacity-60"></div>
                  {/* Center decorative dots */}
                  <div className="absolute top-3 sm:top-4 left-3 sm:left-4 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
                  <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
                </div>
              </>
            ) : (
              <>
                {/* Top-left corner */}
                <div className="absolute top-1 left-1 text-left">
                  <div className={`text-xs sm:text-sm font-bold ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"}`}>{card.value}</div>
                  <div className={`text-xs ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"}`}>{card.suit}</div>
                </div>
                {/* Bottom-right corner (rotated) */}
                <div className="absolute bottom-1 right-1 text-right transform rotate-180">
                  <div className={`text-xs sm:text-sm font-bold ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"}`}>{card.value}</div>
                  <div className={`text-xs ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"}`}>{card.suit}</div>
                </div>
                {/* Center suit - only show on the bottommost card (left of stack) */}
                {idx === cards.length - 1 && (
                  <div className="flex items-center justify-center">
                    <span className={`text-lg sm:text-2xl ${card.suit === "♦" || card.suit === "♥" ? "text-red-600" : "text-black"}`}>{card.suit}</span>
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
