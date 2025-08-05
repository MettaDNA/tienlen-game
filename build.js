#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

console.log('Starting build process...');

try {
  // Change to client directory
  const clientPath = path.join(__dirname, 'client');
  process.chdir(clientPath);
  console.log('Changed to client directory:', clientPath);
  
  // Install dependencies
  console.log('Installing client dependencies...');
  execSync('npm install --production=false', { stdio: 'inherit' });
  
  // Run vite directly using node instead of shell commands
  console.log('Building client using node...');
  const vitePath = path.join(clientPath, 'node_modules', 'vite', 'bin', 'vite.js');
  execSync(`node "${vitePath}" build`, { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  console.error('Error details:', error);
  process.exit(1);
} 