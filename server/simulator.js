
import { TienLenGame } from "./tienlen-engine.js";

class TienLenSimulator {
  constructor() {
    this.game = null;
    this.testResults = [];
    this.autoPlayEnabled = false;
  }

  // Initialize a new test game
  startTestGame() {
    this.game = new TienLenGame();
    this.game.startGame();
    console.log("🧪 Test game started");
    console.log(`📊 Initial state: ${this.game.players.length} players, ${this.game.players[0].hand.length} cards each`);
    return this.game;
  }

  // Simulate a complete game with random moves
  simulateRandomGame(maxTurns = 100) {
    console.log("🎲 Starting random game simulation...");
    this.startTestGame();
    
    let turnCount = 0;
    while (turnCount < maxTurns && this.game.phase !== "GameOver") {
      const currentPlayer = this.game.players[this.game.turn];
      
      if (currentPlayer.finished || currentPlayer.passed) {
        this.game.advanceTurn();
        turnCount++;
        continue;
      }

      // Generate all possible moves for current player
      const possibleMoves = this.generateAllPossibleMoves(currentPlayer.hand);
      
      if (possibleMoves.length === 0) {
        // Player must pass
        this.game.pass(currentPlayer.id);
        console.log(`🔄 Turn ${turnCount}: ${currentPlayer.name} passed`);
      } else {
        // Choose a random move
        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        this.game.playMove(currentPlayer.id, randomMove);
        console.log(`🎯 Turn ${turnCount}: ${currentPlayer.name} played ${randomMove.map(c => c.value + c.suit).join(', ')}`);
      }
      
      turnCount++;
    }

    console.log(`🏁 Game finished after ${turnCount} turns`);
    console.log(`🏆 Winner: ${this.game.winner ? this.game.players.find(p => p.id === this.game.winner)?.name : 'None'}`);
    console.log(`📋 Finish order: ${this.game.finishOrder.join(', ')}`);
    
    return {
      turns: turnCount,
      winner: this.game.winner,
      finishOrder: this.game.finishOrder,
      phase: this.game.phase
    };
  }

  // Generate all possible moves for a hand
  generateAllPossibleMoves(hand) {
    const moves = [];
    
    // Singles
    for (let card of hand) {
      moves.push([card]);
    }
    
    // Pairs
    const cardCounts = {};
    hand.forEach(card => {
      cardCounts[card.value] = (cardCounts[card.value] || 0) + 1;
    });
    
    for (let value in cardCounts) {
      if (cardCounts[value] >= 2) {
        const cards = hand.filter(c => c.value === value).slice(0, 2);
        moves.push(cards);
      }
    }
    
    // Triplets
    for (let value in cardCounts) {
      if (cardCounts[value] >= 3) {
        const cards = hand.filter(c => c.value === value).slice(0, 3);
        moves.push(cards);
      }
    }
    
    // Fours
    for (let value in cardCounts) {
      if (cardCounts[value] >= 4) {
        const cards = hand.filter(c => c.value === value).slice(0, 4);
        moves.push(cards);
      }
    }
    
    // Straights (3-5 cards)
    for (let len = 3; len <= 5; len++) {
      for (let i = 0; i <= hand.length - len; i++) {
        const slice = hand.slice(i, i + len);
        if (this.game.isStraight(slice)) {
          moves.push(slice);
        }
      }
    }
    
    // Pair sequences (2-6 pairs)
    for (let pairCount = 2; pairCount <= 6; pairCount++) {
      const requiredLength = pairCount * 2;
      if (hand.length >= requiredLength) {
        for (let i = 0; i <= hand.length - requiredLength; i++) {
          const slice = hand.slice(i, i + requiredLength);
          if (this.game.isPairSequence(slice, pairCount)) {
            moves.push(slice);
          }
        }
      }
    }
    
    // Filter valid moves based on current game state
    return moves.filter(move => {
      const combo = this.game.getComboType(move);
      if (!combo) return false;
      
      // First trick: must contain 3♠
      const isFirstTrick = this.game.centerPile.length === 0;
      if (isFirstTrick && !move.some(c => c.value === 3 && c.suit === "♠")) {
        return false;
      }
      
      // Must beat current trick (unless it's an auto-win)
      if (this.game.currentTrick && !this.game.isAutoWin(move) && !this.game.beats(this.game.currentTrick, combo)) {
        return false;
      }
      
      return true;
    });
  }

  // Test specific scenarios
  testAutoWinCombinations() {
    console.log("🧪 Testing auto-win combinations...");
    this.startTestGame();
    
    const testCases = [
      {
        name: "6 Pairs",
        cards: [
          {value: 3, suit: "♠"}, {value: 3, suit: "♣"},
          {value: 4, suit: "♠"}, {value: 4, suit: "♣"},
          {value: 5, suit: "♠"}, {value: 5, suit: "♣"},
          {value: 6, suit: "♠"}, {value: 6, suit: "♣"},
          {value: 7, suit: "♠"}, {value: 7, suit: "♣"},
          {value: 8, suit: "♠"}, {value: 8, suit: "♣"}
        ]
      },
      {
        name: "4 2's",
        cards: [
          {value: 2, suit: "♠"}, {value: 2, suit: "♣"},
          {value: 2, suit: "♦"}, {value: 2, suit: "♥"}
        ]
      },
      {
        name: "Straight Flush",
        cards: [
          {value: 3, suit: "♠"}, {value: 4, suit: "♠"},
          {value: 5, suit: "♠"}, {value: 6, suit: "♠"},
          {value: 7, suit: "♠"}
        ]
      },
      {
        name: "3 to Ace Straight",
        cards: [
          {value: 3, suit: "♠"}, {value: 4, suit: "♣"}, {value: 5, suit: "♦"},
          {value: 6, suit: "♥"}, {value: 7, suit: "♠"}, {value: 8, suit: "♣"},
          {value: 9, suit: "♦"}, {value: 10, suit: "♥"}, {value: "J", suit: "♠"},
          {value: "Q", suit: "♣"}, {value: "K", suit: "♦"}, {value: "A", suit: "♥"}
        ]
      }
    ];
    
    testCases.forEach(testCase => {
      const isAutoWin = this.game.isAutoWin(testCase.cards);
      const combo = this.game.getComboType(testCase.cards);
      console.log(`✅ ${testCase.name}: Auto-win = ${isAutoWin}, Combo = ${combo?.type || 'invalid'}`);
    });
  }

  // Test bot card counting
  testBotCardCounting() {
    console.log("🧪 Testing bot card counting...");
    this.startTestGame();
    
    // Simulate a few turns to see bot memory in action
    for (let i = 0; i < 5; i++) {
      const currentPlayer = this.game.players[this.game.turn];
      if (currentPlayer.isBot) {
        console.log(`🤖 ${currentPlayer.name} has ${currentPlayer.hand.length} cards`);
        if (currentPlayer.memory) {
          console.log(`📝 Memory: ${currentPlayer.memory.cardsPlayed.length} cards played, Phase: ${currentPlayer.memory.gamePhase}`);
        }
      }
      
      // Make a simple move
      const possibleMoves = this.generateAllPossibleMoves(currentPlayer.hand);
      if (possibleMoves.length > 0) {
        const move = possibleMoves[0];
        this.game.playMove(currentPlayer.id, move);
        console.log(`🎯 ${currentPlayer.name} played ${move.map(c => c.value + c.suit).join(', ')}`);
      } else {
        this.game.pass(currentPlayer.id);
        console.log(`🔄 ${currentPlayer.name} passed`);
      }
    }
  }

  // Run comprehensive tests
  runAllTests() {
    console.log("🚀 Starting comprehensive Tien Len tests...\n");
    
    // Test 1: Auto-win combinations
    this.testAutoWinCombinations();
    console.log("\n");
    
    // Test 2: Bot card counting
    this.testBotCardCounting();
    console.log("\n");
    
    // Test 3: Random game simulation
    console.log("🎲 Running random game simulation...");
    const result = this.simulateRandomGame(50);
    console.log(`📊 Simulation result: ${result.turns} turns, Winner: ${result.winner}, Phase: ${result.phase}`);
    
    console.log("\n✅ All tests completed!");
  }
}

// Export for use in other files
export { TienLenSimulator };

// If run directly, execute tests
if (import.meta.url === `file://${process.argv[1]}`) {
  const simulator = new TienLenSimulator();
  simulator.runAllTests();
}
