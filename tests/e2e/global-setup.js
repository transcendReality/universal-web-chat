const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

async function globalSetup() {
  // Build the extension for testing
  console.log('Building extension for E2E testing...');
  
  // Ensure dist directory exists
  const distDir = path.join(__dirname, '../../dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Build Chrome extension for testing
  const { execSync } = require('child_process');
  execSync('npm run build:chrome', { stdio: 'inherit' });

  // Launch browser to install extension
  const browser = await chromium.launch();
  const context = await browser.newContext();
  
  // Load the extension
  await context.addInitScript(() => {
    // Mock extension APIs for testing
    window.chrome = {
      runtime: {
        sendMessage: (message) => {
          // Handle test messages
          if (message.type === 'TEST_CONNECTION') {
            return Promise.resolve({ success: true });
          }
        },
        onMessage: {
          addListener: () => {},
          removeListener: () => {},
        },
        getURL: (path) => `chrome-extension://test-id/${path}`,
      },
      storage: {
        local: {
          get: (keys) => Promise.resolve({}),
          set: (data) => Promise.resolve(),
          remove: (keys) => Promise.resolve(),
        },
      },
    };
  });

  await context.close();
  await browser.close();
  
  console.log('E2E setup completed');
}

module.exports = globalSetup;
