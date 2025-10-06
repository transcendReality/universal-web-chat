/**
 * Manifest Generation Script
 * 
 * This script generates browser-specific manifest files for the extension.
 * It uses the manifest-generator utility to create the appropriate manifest
 * for each target browser.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import generateManifest from '../src/utils/manifest-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target browsers
const browsers = ['chrome', 'firefox', 'edge', 'brave'];

// Create dist directory if it doesn't exist
const distDir = path.resolve(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Generate manifest for each browser
browsers.forEach(browser => {
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

console.log('All manifests generated successfully');
