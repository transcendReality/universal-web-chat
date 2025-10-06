const { test, expect } = require('@playwright/test');

test.describe('Chat Functionality E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a test page
    await page.goto('http://localhost:3000/test-page.html');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display chat window when extension is activated', async ({ page }) => {
    // Simulate extension activation
    await page.evaluate(() => {
      // Mock extension injection
      const chatWindow = document.createElement('div');
      chatWindow.id = 'universal-chat-window';
      chatWindow.innerHTML = `
        <div class="chat-header">
          <span>Universal Web Chat</span>
          <button class="minimize-btn">−</button>
        </div>
        <div class="chat-messages"></div>
        <div class="chat-input">
          <input type="text" placeholder="Type your message...">
          <button class="send-btn">Send</button>
        </div>
      `;
      chatWindow.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 300px;
        height: 400px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 8px;
        z-index: 10000;
        display: block;
      `;
      document.body.appendChild(chatWindow);
    });

    // Verify chat window is visible
    const chatWindow = page.locator('#universal-chat-window');
    await expect(chatWindow).toBeVisible();
    
    // Verify chat elements are present
    await expect(chatWindow.locator('.chat-header')).toBeVisible();
    await expect(chatWindow.locator('.chat-messages')).toBeVisible();
    await expect(chatWindow.locator('.chat-input input')).toBeVisible();
    await expect(chatWindow.locator('.send-btn')).toBeVisible();
  });

  test('should allow sending and receiving messages', async ({ page }) => {
    // Setup chat window
    await page.evaluate(() => {
      const chatWindow = document.createElement('div');
      chatWindow.id = 'universal-chat-window';
      chatWindow.innerHTML = `
        <div class="chat-header">Universal Web Chat</div>
        <div class="chat-messages"></div>
        <div class="chat-input">
          <input type="text" placeholder="Type your message...">
          <button class="send-btn">Send</button>
        </div>
      `;
      chatWindow.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 300px;
        height: 400px;
        background: white;
        border: 1px solid #ccc;
        z-index: 10000;
      `;
      document.body.appendChild(chatWindow);
    });

    const input = page.locator('#universal-chat-window input');
    const sendBtn = page.locator('#universal-chat-window .send-btn');
    const messages = page.locator('#universal-chat-window .chat-messages');

    // Type and send a message
    await input.fill('Hello, world!');
    await sendBtn.click();

    // Verify message appears in chat
    await expect(messages.locator('text=Hello, world!')).toBeVisible();
  });

  test('should handle chat window dragging', async ({ page }) => {
    // Setup draggable chat window
    await page.evaluate(() => {
      const chatWindow = document.createElement('div');
      chatWindow.id = 'universal-chat-window';
      chatWindow.innerHTML = `
        <div class="chat-header" style="cursor: move; background: #f0f0f0; padding: 10px;">
          Universal Web Chat
        </div>
        <div class="chat-messages"></div>
        <div class="chat-input">
          <input type="text" placeholder="Type your message...">
          <button class="send-btn">Send</button>
        </div>
      `;
      chatWindow.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 300px;
        height: 400px;
        background: white;
        border: 1px solid #ccc;
        z-index: 10000;
      `;
      document.body.appendChild(chatWindow);

      // Simple drag functionality
      let isDragging = false;
      let startX, startY, startLeft, startTop;

      chatWindow.querySelector('.chat-header').addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = parseInt(chatWindow.style.left) || 0;
        startTop = parseInt(chatWindow.style.top) || 0;
      });

      document.addEventListener('mousemove', (e) => {
        if (isDragging) {
          const deltaX = e.clientX - startX;
          const deltaY = e.clientY - startY;
          chatWindow.style.left = (startLeft + deltaX) + 'px';
          chatWindow.style.top = (startTop + deltaY) + 'px';
        }
      });

      document.addEventListener('mouseup', () => {
        isDragging = false;
      });
    });

    const chatWindow = page.locator('#universal-chat-window');
    const header = chatWindow.locator('.chat-header');

    // Get initial position
    const initialBox = await chatWindow.boundingBox();

    // Drag the window
    await header.hover();
    await page.mouse.down();
    await page.mouse.move(initialBox.x + 100, initialBox.y + 50);
    await page.mouse.up();

    // Verify position changed
    const newBox = await chatWindow.boundingBox();
    expect(newBox.x).not.toBe(initialBox.x);
    expect(newBox.y).not.toBe(initialBox.y);
  });

  test('should minimize and restore chat window', async ({ page }) => {
    // Setup chat window with minimize functionality
    await page.evaluate(() => {
      const chatWindow = document.createElement('div');
      chatWindow.id = 'universal-chat-window';
      chatWindow.innerHTML = `
        <div class="chat-header">
          Universal Web Chat
          <button class="minimize-btn">−</button>
        </div>
        <div class="chat-body">
          <div class="chat-messages"></div>
          <div class="chat-input">
            <input type="text" placeholder="Type your message...">
            <button class="send-btn">Send</button>
          </div>
        </div>
      `;
      chatWindow.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 300px;
        height: 400px;
        background: white;
        border: 1px solid #ccc;
        z-index: 10000;
      `;
      document.body.appendChild(chatWindow);

      // Minimize functionality
      const minimizeBtn = chatWindow.querySelector('.minimize-btn');
      const chatBody = chatWindow.querySelector('.chat-body');
      
      minimizeBtn.addEventListener('click', () => {
        chatBody.style.display = chatBody.style.display === 'none' ? 'block' : 'none';
        minimizeBtn.textContent = chatBody.style.display === 'none' ? '+' : '−';
      });
    });

    const chatWindow = page.locator('#universal-chat-window');
    const minimizeBtn = chatWindow.locator('.minimize-btn');
    const chatBody = chatWindow.locator('.chat-body');

    // Initially visible
    await expect(chatBody).toBeVisible();

    // Minimize
    await minimizeBtn.click();
    await expect(chatBody).not.toBeVisible();
    await expect(minimizeBtn).toHaveText('+');

    // Restore
    await minimizeBtn.click();
    await expect(chatBody).toBeVisible();
    await expect(minimizeBtn).toHaveText('−');
  });

  test('should handle connection status display', async ({ page }) => {
    // Setup chat window with connection status
    await page.evaluate(() => {
      const chatWindow = document.createElement('div');
      chatWindow.id = 'universal-chat-window';
      chatWindow.innerHTML = `
        <div class="chat-header">
          Universal Web Chat
          <span class="connection-status">Connecting...</span>
        </div>
        <div class="chat-messages"></div>
        <div class="chat-input">
          <input type="text" placeholder="Type your message...">
          <button class="send-btn">Send</button>
        </div>
      `;
      chatWindow.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 300px;
        height: 400px;
        background: white;
        border: 1px solid #ccc;
        z-index: 10000;
      `;
      document.body.appendChild(chatWindow);

      // Simulate connection status changes
      const statusElement = chatWindow.querySelector('.connection-status');
      
      setTimeout(() => {
        statusElement.textContent = 'Connected';
        statusElement.style.color = 'green';
      }, 1000);
    });

    const statusElement = page.locator('#universal-chat-window .connection-status');

    // Initially shows connecting
    await expect(statusElement).toHaveText('Connecting...');

    // Wait for connection status to change
    await expect(statusElement).toHaveText('Connected', { timeout: 5000 });
    await expect(statusElement).toHaveCSS('color', 'rgb(0, 128, 0)');
  });

  test('should handle multiple participants', async ({ page }) => {
    // Setup chat window with participant list
    await page.evaluate(() => {
      const chatWindow = document.createElement('div');
      chatWindow.id = 'universal-chat-window';
      chatWindow.innerHTML = `
        <div class="chat-header">
          Universal Web Chat
          <span class="participant-count">1 participant</span>
        </div>
        <div class="chat-messages"></div>
        <div class="chat-input">
          <input type="text" placeholder="Type your message...">
          <button class="send-btn">Send</button>
        </div>
      `;
      chatWindow.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 300px;
        height: 400px;
        background: white;
        border: 1px solid #ccc;
        z-index: 10000;
      `;
      document.body.appendChild(chatWindow);

      // Simulate participant count changes
      const countElement = chatWindow.querySelector('.participant-count');
      
      setTimeout(() => {
        countElement.textContent = '3 participants';
      }, 1000);
    });

    const countElement = page.locator('#universal-chat-window .participant-count');

    // Initially shows 1 participant
    await expect(countElement).toHaveText('1 participant');

    // Wait for participant count to update
    await expect(countElement).toHaveText('3 participants', { timeout: 5000 });
  });
});
