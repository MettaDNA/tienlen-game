import express from "express";
import http from "http";
import { Server } from "socket.io";
import { TienLenGame } from "./tienlen-engine.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Serve static files from the React build
app.use(express.static(path.join(__dirname, "../client/dist")));

// Handle React routing, return all requests to React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
});

let game = null;
let debugLog = [];

function broadcastState() {
  const gameState = {
    players: game.players.map(p => ({
      id: p.id,
      name: p.name,
      hand: p.hand,
      passed: p.passed,
      finished: p.finished
    })),
    centerPile: game.centerPile,
    currentTrick: game.currentTrick,
    turn: game.turn,
    leadPlayer: game.leadPlayer,
    phase: game.phase,
    winner: game.winner,
    finishOrder: game.finishOrder,
    trickNumber: game.trickNumber,
    debugLog: game.debugLog
  };
  
  console.log(`[SERVER] Broadcasting game state - trickNumber: ${game.trickNumber}`);
  console.log(`[SERVER] Full gameState object:`, JSON.stringify(gameState, null, 2));
  io.emit('gameState', gameState);
}


function generateAllCombos(game, hand) {
  const combos = [];
  const sorted = game.sortCards([...hand]);

  // Singles
  for (let c of sorted) combos.push([c]);

  // Pairs, trips, quads
  const grouped = {};
  sorted.forEach((c) => {
    grouped[c.value] = grouped[c.value] || [];
    grouped[c.value].push(c);
  });
  for (const group of Object.values(grouped)) {
    if (group.length >= 2) combos.push(group.slice(0, 2));
    if (group.length >= 3) combos.push(group.slice(0, 3));
    if (group.length === 4) combos.push(group.slice(0, 4));
  }

  // Straights
  for (let len = 3; len <= 5; len++) {
    for (let i = 0; i <= sorted.length - len; i++) {
      const slice = sorted.slice(i, i + len);
      if (game.isStraight(slice)) combos.push(slice);
    }
  }

  // Multi-pair sequences
  for (let len of [6, 8]) {
    for (let i = 0; i <= sorted.length - len; i++) {
      const slice = sorted.slice(i, i + len);
      if (game.isPairSequence(slice, len / 2)) combos.push(slice);
    }
  }

  return combos;
}

function scoreCombo(game, combo, playerHand, playerId, difficulty = 'medium') {
  const typeWeights = {
    single: 1,
    pair: 2,
    triplet: 3,
    straight: 4,
    threepairseq: 5,
    fourpairseq: 6,
    four: 7,
  };
  
  let score = 0;
  const comboType = game.getComboType(combo);
  if (!comboType) return -999;

  // Base score from combo type
  score += typeWeights[comboType.type] * 10;
  
  // Penalty for using more cards
  score -= combo.length * 2;
  
  // Strategic considerations
  const isFirstTrick = game.centerPile.length === 0 && (!game.trickNumber || game.trickNumber === 1);
  const isLeading = !game.currentTrick;
  const handSize = playerHand.length;
  const remainingPlayers = game.players.filter(p => !p.finished).length;
  
  // Individual bot card counting and strategy
  const botPlayer = game.players.find(p => p.id === playerId);
  if (botPlayer && botPlayer.isBot) {
    // Count cards in hand by value and suit
    const cardCounts = {};
    const suitCounts = { "♠": 0, "♣": 0, "♦": 0, "♥": 0 };
    
    playerHand.forEach(card => {
      cardCounts[card.value] = (cardCounts[card.value] || 0) + 1;
      suitCounts[card.suit]++;
    });
    
    // Strategy based on card distribution
    const hasManyPairs = Object.values(cardCounts).filter(count => count >= 2).length >= 2;
    const hasManySingles = Object.values(cardCounts).filter(count => count === 1).length >= 4;
    const hasStrongSuits = Object.values(suitCounts).some(count => count >= 3);
    
    // Adjust score based on bot's card analysis
    if (hasManyPairs && comboType.type === 'pair') {
      score += 15; // Prefer pairs when you have many
    }
    
    if (hasManySingles && comboType.type === 'single') {
      score += 10; // Prefer singles when you have many
    }
    
    if (hasStrongSuits && comboType.type === 'straight') {
      score += 20; // Prefer straights when you have strong suits
    }
    
    // Late game strategy (few cards left)
    if (handSize <= 4) {
      if (comboType.type === 'single') score += 25; // Prefer singles to finish quickly
      if (comboType.type === 'pair') score += 20;
    }
    
    // Early game strategy (many cards left)
    if (handSize >= 8) {
      if (comboType.type === 'straight') score += 15; // Prefer straights early
      if (comboType.type === 'four') score += 30; // Prefer bombs early
    }
  }
  
      // Early game strategy (first 3-4 tricks)
    if (game.trickNumber <= 4) {
      // Use bot's memory for better early game decisions
      if (botPlayer && botPlayer.isBot && botPlayer.memory) {
        const remainingCards = botPlayer.memory.cardsPlayed.length > 0 ? 
          game.createDeck().filter(card => 
            !botPlayer.memory.cardsPlayed.some(played => 
              played.value === card.value && played.suit === card.suit
            )
          ) : game.createDeck();
        
        // Count high-value cards remaining
        const highCardsRemaining = remainingCards.filter(card => 
          ['A', 'K', 'Q', 'J', 2].includes(card.value)
        ).length;
        
        // Adjust strategy based on remaining high cards
        if (highCardsRemaining > 8) {
          score += 10; // More aggressive early if many high cards remain
        } else if (highCardsRemaining < 4) {
          score -= 15; // More conservative if few high cards remain
        }
      }
    // Prefer to lead with strong cards to establish control
    if (isLeading) {
      score += 50; // Bonus for leading
      // Prefer higher cards when leading
      const highCardBonus = combo.reduce((sum, card) => {
        const valueOrder = {3:0,4:1,5:2,6:3,7:4,8:5,9:6,10:7,J:8,Q:9,K:10,A:11,2:12};
        return sum + valueOrder[card.value];
      }, 0);
      score += highCardBonus;
    }
  }
  
  // Mid game strategy (5-8 tricks)
  else if (game.trickNumber <= 8) {
    // Balance between leading and following
    if (isLeading) {
      score += 30;
    } else {
      // Prefer to beat the current trick efficiently
      score += 20;
    }
  }
  
  // Late game strategy (9+ tricks)
  else {
    // Aggressive play to finish quickly
    if (handSize <= 3) {
      score += 100; // Strong preference to play when few cards left
    }
    if (remainingPlayers <= 2) {
      score += 50; // Even more aggressive when few players remain
    }
  }
  
  // Card value strategy
  const valueOrder = {3:0,4:1,5:2,6:3,7:4,8:5,9:6,10:7,J:8,Q:9,K:10,A:11,2:12};
  
  // Prefer to keep high cards for later
  if (handSize > 5) {
    const highCardPenalty = combo.reduce((sum, card) => {
      if (valueOrder[card.value] >= 8) { // J, Q, K, A, 2
        return sum + (valueOrder[card.value] - 7) * 5;
      }
      return sum;
    }, 0);
    score -= highCardPenalty;
  }
  
  // Prefer to use low cards early
  if (handSize <= 5) {
    const lowCardBonus = combo.reduce((sum, card) => {
      if (valueOrder[card.value] <= 4) { // 3, 4, 5, 6, 7
        return sum + 10;
      }
      return sum;
    }, 0);
    score += lowCardBonus;
  }
  
  // Special card strategy
  if (combo.some((c) => c.value === 2)) {
    if (handSize <= 3) {
      score += 30; // Use 2s aggressively when few cards left
    } else {
      score -= 30; // Avoid using 2s early
    }
  }
  
  // Combo efficiency - prefer smaller combos when possible
  if (combo.length === 1 && game.currentTrick && game.currentTrick.cards.length === 1) {
    score += 20; // Prefer singles to beat singles
  }
  
  // Avoid breaking up valuable combinations
  if (comboType.type === 'straight' || comboType.type === 'threepairseq' || comboType.type === 'fourpairseq') {
    // Check if this combo could be part of a larger combo
    const potentialLargerCombo = findLargerCombo(game, combo, playerHand);
    if (potentialLargerCombo && potentialLargerCombo.length > combo.length) {
      score -= 40; // Penalty for breaking up larger combos
    }
  }
  
  // Consider opponent hand sizes
  const opponents = game.players.filter(p => p.id !== playerId && !p.finished);
  const avgOpponentHandSize = opponents.reduce((sum, p) => sum + p.hand.length, 0) / opponents.length;
  
  // If opponents have few cards, be more aggressive
  if (avgOpponentHandSize <= 3) {
    score += 40;
  }
  
  // If we have many cards and opponents have few, be conservative
  if (handSize >= 8 && avgOpponentHandSize <= 2) {
    score -= 30;
  }
  
  return score;
}

function findLargerCombo(game, combo, hand) {
  // Check if this combo could be part of a larger straight or sequence
  const comboType = game.getComboType(combo);
  if (comboType.type === 'straight') {
    // Try to extend the straight
    const sortedHand = game.sortCards([...hand]);
    const comboValues = combo.map(c => c.value);
    const minValue = Math.min(...comboValues);
    const maxValue = Math.max(...comboValues);
    
    // Look for cards that could extend the straight
    const potentialExtensions = sortedHand.filter(c => 
      !combo.some(comboCard => comboCard.value === c.value && comboCard.suit === c.suit)
    );
    
    // Check for extensions
    for (let ext of potentialExtensions) {
      const newCombo = [...combo, ext];
      if (game.getComboType(newCombo) && game.getComboType(newCombo).type === 'straight') {
        return newCombo;
      }
    }
  }
  
  return null;
}

function getBotMove(game, hand, playerId, difficulty = 'medium') {
  const combos = generateAllCombos(game, hand);

  // First trick: must play 3♠
  const isFirstTrick =
    game.centerPile.length === 0 && (!game.trickNumber || game.trickNumber === 1);
  
  // Individual bot card counting and memory
  const botPlayer = game.players.find(p => p.id === playerId);
  if (botPlayer && botPlayer.isBot) {
    // Initialize bot memory if not exists
    if (!botPlayer.memory) {
      botPlayer.memory = {
        cardsPlayed: [], // Track cards played by all players
        myCardsPlayed: [], // Track my own cards played
        opponentPatterns: {}, // Track opponent playing patterns
        gamePhase: 'early' // early, mid, late
      };
    }
    
    // Update bot's memory with current game state
    botPlayer.memory.cardsPlayed = game.centerPile.flatMap(play => play.cards);
    botPlayer.memory.myCardsPlayed = game.centerPile
      .filter(play => play.playerId === playerId)
      .flatMap(play => play.cards);
    
    // Determine game phase based on hand size
    if (hand.length <= 4) botPlayer.memory.gamePhase = 'late';
    else if (hand.length <= 8) botPlayer.memory.gamePhase = 'mid';
    else botPlayer.memory.gamePhase = 'early';
    
    // Count remaining cards by value and suit
    const allCards = game.createDeck();
    const playedCards = botPlayer.memory.cardsPlayed;
    const remainingCards = allCards.filter(card => 
      !playedCards.some(played => played.value === card.value && played.suit === card.suit)
    );
    
    // Analyze remaining cards distribution
    const remainingCounts = {};
    const remainingSuits = { "♠": 0, "♣": 0, "♦": 0, "♥": 0 };
    remainingCards.forEach(card => {
      remainingCounts[card.value] = (remainingCounts[card.value] || 0) + 1;
      remainingSuits[card.suit]++;
    });
    
    // Debug bot's analysis
    game.debugLog.push(`Step ${game.stepCounter++}: ${playerId} bot analysis - Hand: ${hand.length} cards, Phase: ${botPlayer.memory.gamePhase}, Remaining cards: ${remainingCards.length}`);
  }
  
  // Debug logging
  game.debugLog.push(`Step ${game.stepCounter++}: ${playerId} bot decision (${difficulty}) - currentTrick: ${game.currentTrick ? 'exists' : 'null'}, centerPile length: ${game.centerPile.length}, isFirstTrick: ${isFirstTrick}`);
  
  let validPlays = combos.filter((cards) => {
    const combo = game.getComboType(cards);
    if (!combo) return false;
    if (isFirstTrick) return cards.some((c) => c.value === 3 && c.suit === "♠");
    // If no current trick, any combo is valid (bombing)
    if (!game.currentTrick) return true;
    // If there is a current trick, must beat it
    return game.beats(game.currentTrick, combo);
  });

  game.debugLog.push(`Step ${game.stepCounter++}: ${playerId} valid plays count: ${validPlays.length}`);

  if (validPlays.length === 0) {
    game.debugLog.push(`Step ${game.stepCounter++}: ${playerId} passes (no valid plays).`);
    return null;
  }

  // Apply difficulty-based modifications
  let scored = validPlays.map((c) => ({
    combo: c,
    score: scoreCombo(game, c, hand, playerId, difficulty),
  }));

  // Easy difficulty: Add randomness to make mistakes
  if (difficulty === 'easy') {
    scored = scored.map(item => ({
      ...item,
      score: item.score + (Math.random() - 0.5) * 100 // Add random noise
    }));
  }
  
  // Hard difficulty: Use advanced strategies
  if (difficulty === 'hard') {
    scored = scored.map(item => ({
      ...item,
      score: item.score * 1.2 // Boost scores for better moves
    }));
  }

  scored.sort((a, b) => b.score - a.score);
  
  // Easy difficulty: Sometimes choose suboptimal moves
  if (difficulty === 'easy' && Math.random() < 0.3) {
    const randomIndex = Math.floor(Math.random() * Math.min(3, scored.length));
    const choice = scored[randomIndex];
    game.debugLog.push(
      `Step ${game.stepCounter++}: ${playerId} plays (easy random): ${choice.combo.map((c) => c.value + c.suit).join(", ")}`
    );
    return choice.combo;
  }
  
  const choice = scored[0];
  game.debugLog.push(
    `Step ${game.stepCounter++}: ${playerId} plays (${difficulty}): ${choice.combo.map((c) => c.value + c.suit).join(", ")}`
  );
  return choice.combo;
}

function checkGameEnd() {
  const activePlayers = game.players.filter(p => !p.finished && !p.passed);
  if (activePlayers.length === 1) {
    const remainingPlayer = activePlayers[0];
    remainingPlayer.finished = true;
    game.finishOrder.push(remainingPlayer.id);
    game.debugLog.push(`Step ${game.stepCounter++}: ${remainingPlayer.name} is the last player and automatically finishes! Finish order: [${game.finishOrder.join(', ')}]`);
    game.checkGameOver();
    broadcastState();
  }
}

function handleBotTurns() {
  const currentPlayer = game.players[game.turn];

  // Skip if no current player, not a bot, round over, OR finished
  if (!currentPlayer || !currentPlayer.isBot || currentPlayer.finished || game.phase === "RoundOver") {
    game.debugLog.push(`Step ${game.stepCounter++}: handleBotTurns skipped - currentPlayer: ${currentPlayer?.name}, isBot: ${currentPlayer?.isBot}, finished: ${currentPlayer?.finished}, phase: ${game.phase}`);
    return;
  }

  setTimeout(() => {
    // Double check after delay
    if (currentPlayer.finished) {
      game.debugLog.push(`Step ${game.stepCounter++}: ${currentPlayer.name} is finished and skipped.`);
      game.advanceTurn();
      broadcastState();
      return handleBotTurns();
    }

    const move = getBotMove(game, currentPlayer.hand, currentPlayer.id, game.botDifficulty || 'medium');
    game.debugLog.push(`Step ${game.stepCounter++}: Bot ${currentPlayer.name} has ${currentPlayer.hand.length} cards, move: ${move ? move.map(c => c.value + c.suit).join(', ') : 'PASS'}`);
    
    if (move) {
      game.playMove(currentPlayer.id, move);
    } else {
      game.pass(currentPlayer.id);
    }
    broadcastState();
    checkGameEnd();
    handleBotTurns();
  }, 1200);
}




io.on("connection", (socket) => {
  socket.on("createGame", () => {
    game = new TienLenGame();
    game.startGame();
    debugLog = [];
    
    // Reset bot memory for new game
    game.players.forEach(player => {
      if (player.isBot) {
        player.memory = {
          cardsPlayed: [],
          myCardsPlayed: [],
          opponentPatterns: {},
          gamePhase: 'early'
        };
      }
    });
    
    broadcastState();

    // If the first turn is a bot, force them to start
    const currentPlayer = game.players[game.turn];
    if (currentPlayer.isBot) {
      setTimeout(() => handleBotTurns(), 1000);
    }
  });

  socket.on("updateDifficulty", (difficulty) => {
    if (game) {
      game.botDifficulty = difficulty;
      game.debugLog.push(`Step ${game.stepCounter++}: Bot difficulty updated to ${difficulty}`);
      broadcastState();
    }
  });

  socket.on("playMove", (data) => {
    if (!game) return;
    if (game.players[game.turn].id !== data.playerId) return;
    game.playMove(data.playerId, data.cards);
    broadcastState();
    checkGameEnd();
    handleBotTurns();
  });

  socket.on("passTurn", (data) => {
    if (!game) return;
    if (game.players[game.turn].id !== data.playerId) return;
    game.pass(data.playerId);
    broadcastState();
    checkGameEnd();
    handleBotTurns();
  });
});

server.listen(process.env.PORT || 3001, () => console.log(`Server running on port ${process.env.PORT || 3001}`));
