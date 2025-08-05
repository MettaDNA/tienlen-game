#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('Starting build process...');

try {
  // Change to client directory
  process.chdir(path.join(__dirname, 'client'));
  console.log('Changed to client directory');
  
  // Install dependencies
  console.log('Installing client dependencies...');
  execSync('npm install --production=false', { stdio: 'inherit' });
  
  // Run the build
  console.log('Building client...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
} 