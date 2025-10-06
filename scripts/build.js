#!/usr/bin/env node
/**
 * Build Script
 * 
 * This script builds the extension for all target browsers or a specific browser.
 * Usage: node scripts/build.js [browser]
 * Where [browser] is optional and can be one of: chrome, firefox, edge, brave
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target browsers
const browsers = ['chrome', 'firefox', 'edge', 'brave'];

// Get target browser from command line args
const targetBrowser = process.argv[2];

// Validate target browser if specified
if (targetBrowser && !browsers.includes(targetBrowser)) {
  console.error(`Invalid browser: ${targetBrowser}`);
  console.error(`Valid browsers are: ${browsers.join(', ')}`);
  process.exit(1);
}

// Determine which browsers to build for
const browsersToBuild = targetBrowser ? [targetBrowser] : browsers;

// Create dist directory if it doesn't exist
const distDir = path.resolve(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// First, generate the manifests
console.log('Generating manifests...');
try {
  // Import the manifest generator
  const { default: generateManifest } = await import('../src/utils/manifest-generator.js');
  
  // Generate manifest for each browser
  browsersToBuild.forEach(browser => {
    // Create browser-specific directory
    const browserDir = path.resolve(distDir, browser);
    if (!fs.existsSync(browserDir)) {
      fs.mkdirSync(browserDir, { recursive: true });
    }
    
    // Generate manifest
    const manifest = generateManifest(browser);
    
    // Write manifest to file
    fs.writeFileSync(
      path.resolve(browserDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    
    console.log(`Generated manifest for ${browser}`);
  });
} catch (error) {
  console.error('Error generating manifests:', error);
  process.exit(1);
}

// Build for each browser
browsersToBuild.forEach(browser => {
  console.log(`Building for ${browser}...`);
  
  try {
    // Run webpack with browser-specific config
    execSync(`npx webpack --config webpack/${browser}.config.js --mode production`, {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });
    
    console.log(`Build for ${browser} completed successfully`);
  } catch (error) {
    console.error(`Build for ${browser} failed:`, error.message);
    process.exit(1);
  }
});

console.log('All builds completed successfully');
