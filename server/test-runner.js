#!/usr/bin/env node

import { TienLenSimulator } from "./simulator.js";

console.log("🎮 Tien Len Game Test Runner");
console.log("=============================\n");

const simulator = new TienLenSimulator();

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'all';

switch (command) {
  case 'auto-win':
    console.log("🧪 Testing auto-win combinations...\n");
    simulator.testAutoWinCombinations();
    break;
    
  case 'bot-counting':
    console.log("🧪 Testing bot card counting...\n");
    simulator.testBotCardCounting();
    break;
    
  case 'random':
    const maxTurns = parseInt(args[1]) || 50;
    console.log(`🎲 Running random game simulation (max ${maxTurns} turns)...\n`);
    const result = simulator.simulateRandomGame(maxTurns);
    console.log(`\n📊 Final Results:`);
    console.log(`   Turns: ${result.turns}`);
    console.log(`   Winner: ${result.winner || 'None'}`);
    console.log(`   Finish Order: ${result.finishOrder.join(', ')}`);
    console.log(`   Phase: ${result.phase}`);
    break;
    
  case 'all':
  default:
    console.log("🚀 Running all tests...\n");
    simulator.runAllTests();
    break;
}

console.log("\n✨ Test runner completed!"); 