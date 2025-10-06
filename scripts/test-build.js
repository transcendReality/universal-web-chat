#!/usr/bin/env node
/**
 * Test Build Script
 * 
 * This script tests the build process for a specific browser to verify it works correctly.
 * Usage: node scripts/test-build.js [browser]
 * Where [browser] is one of: chrome, firefox, edge, brave (defaults to chrome)
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get target browser from command line args
const targetBrowser = process.argv[2] || 'chrome';

// Valid browsers
const validBrowsers = ['chrome', 'firefox', 'edge', 'brave'];

// Validate target browser
if (!validBrowsers.includes(targetBrowser)) {
  console.error(`Invalid browser: ${targetBrowser}`);
  console.error(`Valid browsers are: ${validBrowsers.join(', ')}`);
  process.exit(1);
}

console.log(`Testing build for ${targetBrowser}...`);

try {
  // Create dist directory if it doesn't exist
  const distDir = path.resolve(__dirname, '../dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Create browser-specific directory
  const browserDir = path.resolve(distDir, targetBrowser);
  if (!fs.existsSync(browserDir)) {
    fs.mkdirSync(browserDir, { recursive: true });
  }
  
  // First, generate the manifest
  console.log('Generating manifest...');
  
  // Import the manifest generator
  const { default: generateManifest } = await import('../src/utils/manifest-generator.js');
  
  // Generate manifest
  const manifest = generateManifest(targetBrowser);
  
  // Write manifest to file
  fs.writeFileSync(
    path.resolve(browserDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  console.log(`Generated manifest for ${targetBrowser}`);
  
  // Run webpack with browser-specific config
  console.log(`Building for ${targetBrowser}...`);
  execSync(`npx webpack --config webpack/${targetBrowser}.config.js --mode development`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  
  console.log(`\nBuild test for ${targetBrowser} completed successfully!`);
  
  // Verify output files exist
  const expectedFiles = ['background.js', 'content.js', 'popup.js', 'popup.html', 'manifest.json'];
  const missingFiles = [];
  
  for (const file of expectedFiles) {
    const filePath = path.resolve(browserDir, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  }
  
  if (missingFiles.length > 0) {
    console.warn(`Warning: The following expected files are missing: ${missingFiles.join(', ')}`);
  } else {
    console.log('All expected files were generated correctly.');
  }
  
  console.log(`\nOutput directory: ${browserDir}`);
  
} catch (error) {
  console.error(`Build test failed:`, error);
  process.exit(1);
}
