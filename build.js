#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting build process...');

try {
  // Change to client directory
  const clientPath = path.join(__dirname, 'client');
  process.chdir(clientPath);
  console.log('Changed to client directory:', clientPath);
  
  // Install dependencies
  console.log('Installing client dependencies...');
  execSync('npm install --production=false', { stdio: 'inherit' });
  
  // Run the build using npx to avoid permission issues
  console.log('Building client...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  console.error('Error details:', error);
  process.exit(1);
} 