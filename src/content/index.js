/**
 * Content Script
 * 
 * This script is injected into web pages and handles:
 * - UI injection and management
 * - Communication with the background script
 * - P2P communication through the Communication Manager
 */
import CommunicationManager from '../services/communication-manager.js';
import { parseUrlForRoom } from '../utils/url-parser.js';

// Global state
let chatUI = null;
let communicationManager = null;
let settings = {
  username: '',
  enableNotifications: true,
  theme: 'light',
  showOnAllPages: true,
  autoConnect: true
};
let browserInfo = null;
let isConnected = false;
let messages = [];
let participants = 0;

// Initialize content script
function initialize() {
  console.log('Universal Web Chat: Content script initialized');
  
  // Notify background script that content script is loaded
  chrome.runtime.sendMessage({
    type: 'CONTENT_SCRIPT_LOADED',
    data: { url: window.location.href }
  }, response => {
    if (response && response.success) {
      // Store settings and browser info
      settings = response.settings;
      browserInfo = response.browserInfo;
      
      // Set up message listeners
      setupMessageListeners();
      
      // Only show floating button, no auto-connect.
      if (settings.showOnAllPages) {
        initializeChatUI();
      }
    }
  });
}

/**
 * Set up message listeners for communication with background script
 */
function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received message:', message);
    
    // Handle different message types
    switch (message.type) {
      case 'JOIN_ROOM_REQUEST':
        handleJoinRoomRequest(message.data, sendResponse);
        return true;
        
      case 'LEAVE_ROOM':
        disconnectFromRoom();
        if (sendResponse) sendResponse({ success: true });
        return true;
        
      case 'SETTINGS_UPDATED':
        handleSettingsUpdated(message.data, sendResponse);
        return true;
        
      case 'PAGE_UPDATED':
        handlePageUpdated(message.data, sendResponse);
        return true;
    }
    
    return false;
  });
}

/**
 * Initialize the chat UI
 */
function initializeChatUI() {
  // Create chat UI container with Shadow DOM for style isolation
  const container = document.createElement('div');
  container.id = 'universal-web-chat-container';
  
  // Apply initial styles to container
  Object.assign(container.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: '9999',
    width: '320px',
    height: '400px',
    background: 'transparent',
    border: 'none',
    overflow: 'visible'
  });
  
  // Attach to document
  document.body.appendChild(container);
  
  // Create shadow root for style isolation
  const shadowRoot = container.attachShadow({ mode: 'open' });
  
  // Create chat UI HTML
  shadowRoot.innerHTML = `
    <style>
      :host {
        --primary-color: #4a6ee0;
        --secondary-color: #e6eaf7;
        --text-color: #333333;
        --background-color: #ffffff;
        --border-color: #dddddd;
        --shadow-color: rgba(0, 0, 0, 0.1);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      
      /* Dark theme */
      :host([data-theme="dark"]) {
        --primary-color: #5d7ce6;
        --secondary-color: #2a2d3e;
        --text-color: #e0e0e0;
        --background-color: #1a1c27;
        --border-color: #3a3d4e;
        --shadow-color: rgba(0, 0, 0, 0.3);
      }
      
      .chat-window {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background-color: var(--background-color);
        border-radius: 12px;
        box-shadow: 0 4px 12px var(--shadow-color);
        overflow: hidden;
        transition: all 0.3s ease;
        transform-origin: bottom right;
      }
      
      .chat-window.minimized {
        transform: scale(0.2);
        opacity: 0.8;
        pointer-events: none;
      }
      
      .chat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background-color: var(--primary-color);
        color: white;
        cursor: move;
      }
      
      .chat-title {
        font-weight: 600;
        font-size: 14px;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .chat-controls {
        display: flex;
        gap: 8px;
      }
      
      .chat-control-button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
      }
      
      .chat-control-button:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
      
      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .chat-message {
        max-width: 80%;
        padding: 8px 12px;
        border-radius: 16px;
        font-size: 14px;
        line-height: 1.4;
        word-break: break-word;
      }
      
      .chat-message.sent {
        align-self: flex-end;
        background-color: var(--primary-color);
        color: white;
        border-bottom-right-radius: 4px;
      }
      
      .chat-message.received {
        align-self: flex-start;
        background-color: var(--secondary-color);
        color: var(--text-color);
        border-bottom-left-radius: 4px;
      }
      
      .chat-message-sender {
        font-size: 12px;
        margin-bottom: 4px;
        font-weight: 600;
      }
      
      .chat-message-time {
        font-size: 10px;
        opacity: 0.7;
        margin-top: 4px;
        text-align: right;
      }
      
      .chat-input-area {
        display: flex;
        padding: 12px;
        border-top: 1px solid var(--border-color);
        background-color: var(--background-color);
      }
      
      .chat-input {
        flex: 1;
        border: 1px solid var(--border-color);
        border-radius: 20px;
        padding: 8px 12px;
        font-size: 14px;
        outline: none;
        background-color: var(--background-color);
        color: var(--text-color);
      }
      
      .chat-input:focus {
        border-color: var(--primary-color);
      }
      
      .chat-send-button {
        background-color: var(--primary-color);
        color: white;
        border: none;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        margin-left: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
      }
      
      .chat-send-button:hover {
        background-color: #3a5dcc;
      }
      
      .chat-send-button:disabled {
        background-color: var(--border-color);
        cursor: not-allowed;
      }
      
      .chat-status {
        font-size: 12px;
        padding: 4px 8px;
        text-align: center;
        color: var(--text-color);
        opacity: 0.7;
      }
      
      .chat-toggle-button {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 48px;
        height: 48px;
        background-color: var(--primary-color);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 8px var(--shadow-color);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.3s ease;
        z-index: 1;
      }
      
      .chat-toggle-button.open {
        transform: rotate(45deg);
      }
      
      /* Participant count badge */
      .participant-count {
        position: absolute;
        top: -5px;
        right: -5px;
        background-color: #ff5722;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      /* Connection status indicator */
      .connection-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 8px;
      }
      
      .connection-indicator.connected {
        background-color: #4caf50;
      }
      
      .connection-indicator.connecting {
        background-color: #ff9800;
      }
      
      .connection-indicator.disconnected {
        background-color: #f44336;
      }
      
      /* Animations */
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .chat-message {
        animation: fadeIn 0.2s ease-out;
      }
    </style>
    
    <button class="chat-toggle-button">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor"/>
      </svg>
      <span class="participant-count" style="display: none;">0</span>
    </button>
    
    <div class="chat-window minimized">
      <div class="chat-header">
        <div style="display: flex; align-items: center;">
          <span class="connection-indicator disconnected"></span>
          <h3 class="chat-title">Universal Web Chat</h3>
        </div>
        <div class="chat-controls">
          <button class="chat-control-button settings-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.14 12.94C19.18 12.64 19.2 12.33 19.2 12C19.2 11.68 19.18 11.36 19.14 11.06L21.16 9.48C21.34 9.34 21.39 9.07 21.28 8.87L19.36 5.55C19.24 5.33 18.99 5.26 18.77 5.33L16.38 6.29C15.88 5.91 15.35 5.59 14.76 5.35L14.4 2.81C14.36 2.57 14.16 2.4 13.92 2.4H10.08C9.84 2.4 9.65 2.57 9.61 2.81L9.25 5.35C8.66 5.59 8.12 5.91 7.63 6.29L5.24 5.33C5.02 5.26 4.77 5.33 4.65 5.55L2.74 8.87C2.62 9.07 2.66 9.34 2.86 9.48L4.88 11.06C4.84 11.36 4.8 11.69 4.8 12C4.8 12.31 4.82 12.64 4.86 12.94L2.84 14.52C2.66 14.66 2.61 14.93 2.72 15.13L4.64 18.45C4.76 18.67 5.01 18.74 5.23 18.67L7.62 17.71C8.12 18.09 8.65 18.41 9.24 18.65L9.6 21.19C9.65 21.43 9.84 21.6 10.08 21.6H13.92C14.16 21.6 14.36 21.43 14.39 21.19L14.75 18.65C15.34 18.41 15.88 18.09 16.37 17.71L18.76 18.67C18.98 18.74 19.23 18.67 19.35 18.45L21.27 15.13C21.39 14.91 21.34 14.66 21.14 14.52L19.14 12.94ZM12 15.6C10.02 15.6 8.4 13.98 8.4 12C8.4 10.02 10.02 8.4 12 8.4C13.98 8.4 15.6 10.02 15.6 12C15.6 13.98 13.98 15.6 12 15.6Z" fill="currentColor"/>
            </svg>
          </button>
          <button class="chat-control-button minimize-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 13H5V11H19V13Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="chat-messages"></div>
      
      <div class="chat-status">Not connected</div>
      
      <div class="chat-input-area">
        <input type="text" class="chat-input" placeholder="Type a message..." disabled>
        <button class="chat-send-button" disabled>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  `;
  
  // Store references to UI elements
  chatUI = {
    container,
    shadowRoot,
    elements: {
      window: shadowRoot.querySelector('.chat-window'),
      header: shadowRoot.querySelector('.chat-header'),
      messages: shadowRoot.querySelector('.chat-messages'),
      input: shadowRoot.querySelector('.chat-input'),
      sendButton: shadowRoot.querySelector('.chat-send-button'),
      toggleButton: shadowRoot.querySelector('.chat-toggle-button'),
      minimizeButton: shadowRoot.querySelector('.chat-control-button.minimize-button'),
      settingsButton: shadowRoot.querySelector('.chat-control-button.settings-button'),
      status: shadowRoot.querySelector('.chat-status'),
      connectionIndicator: shadowRoot.querySelector('.connection-indicator'),
      participantCount: shadowRoot.querySelector('.participant-count'),
      title: shadowRoot.querySelector('.chat-title')
    }
  };
  
  // Apply theme
  applyTheme(settings.theme);
  
  // Set up event listeners
  setupUIEventListeners();
  
  // Make chat window draggable
  makeDraggable(chatUI.elements.window, chatUI.elements.header);
  
  console.log('Chat UI initialized');
}

/**
 * Set up event listeners for the chat UI
 */
function setupUIEventListeners() {
  const { elements } = chatUI;
  
  // Toggle chat window
  elements.toggleButton.addEventListener('click', () => {
    elements.window.classList.toggle('minimized');
    elements.toggleButton.classList.toggle('open');
    
    // If opening and not connected, try to connect
    if (!elements.window.classList.contains('minimized') && !isConnected) {
      connectToRoom();
    }
  });
  
  // Minimize chat window
  elements.minimizeButton.addEventListener('click', () => {
    elements.window.classList.add('minimized');
    elements.toggleButton.classList.remove('open');
  });
  
  // Settings button
  elements.settingsButton.addEventListener('click', () => {
    // Open extension popup
    chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
  });
  
  // Send message
  elements.sendButton.addEventListener('click', sendMessage);
  
  // Send message on Enter key
  elements.input.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  });
  
  // Enable/disable send button based on input
  elements.input.addEventListener('input', () => {
    elements.sendButton.disabled = !elements.input.value.trim() || !isConnected;
  });
}

/**
 * Make an element draggable
 * @param {Element} element - Element to make draggable
 * @param {Element} handle - Element to use as drag handle
 */
function makeDraggable(element, handle) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  handle.addEventListener('mousedown', dragMouseDown);
  
  function dragMouseDown(e) {
    e.preventDefault();
    // Get the mouse cursor position at startup
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.addEventListener('mouseup', closeDragElement);
    document.addEventListener('mousemove', elementDrag);
  }
  
  function elementDrag(e) {
    e.preventDefault();
    // Calculate the new cursor position
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    // Get current position
    const rect = chatUI.container.getBoundingClientRect();
    
    // Set the element's new position
    chatUI.container.style.top = (rect.top - pos2) + 'px';
    chatUI.container.style.left = (rect.left - pos1) + 'px';
    
    // Reset bottom/right if top/left are set
    chatUI.container.style.bottom = 'auto';
    chatUI.container.style.right = 'auto';
  }
  
  function closeDragElement() {
    // Stop moving when mouse button is released
    document.removeEventListener('mouseup', closeDragElement);
    document.removeEventListener('mousemove', elementDrag);
  }
}

/**
 * Apply theme to the chat UI
 * @param {string} theme - Theme name ('light' or 'dark')
 */
function applyTheme(theme) {
  if (!chatUI) return;
  
  const { shadowRoot } = chatUI;
  const host = shadowRoot.host;
  
  host.dataset.theme = theme;
}

/**
 * Connect to a chat room
 */
async function connectToRoom() {
  if (isConnected) return;
  
  try {
    updateConnectionStatus('connecting');
    
    // Create communication manager if it doesn't exist
    if (!communicationManager) {
      communicationManager = new CommunicationManager('http://localhost:2999', {
        debug: true,
        roomOptions: {
          useHostOnly: true
        }
      });
      
      // Set up event handlers
      communicationManager.onMessage = handleIncomingMessage;
      communicationManager.onPeerConnect = handlePeerConnect;
      communicationManager.onPeerDisconnect = handlePeerDisconnect;
      communicationManager.onParticipantCount = handleParticipantCount;
      communicationManager.onStatusChange = handleConnectionStatusChange;
    }
    
    // Connect to the room
    await communicationManager.connect();
    
    // Update UI
    updateConnectionStatus('connected');
    
    // Enable input
    chatUI.elements.input.disabled = false;
    chatUI.elements.sendButton.disabled = !chatUI.elements.input.value.trim();
    
    // Notify background script
    chrome.runtime.sendMessage({
      type: 'JOIN_ROOM',
      data: { room: communicationManager.room }
    });
    
    isConnected = true;
    
    // Add system message
    addSystemMessage(`Connected to room: ${communicationManager.room}`);
  } catch (error) {
    console.error('Error connecting to room:', error);
    updateConnectionStatus('disconnected');
    addSystemMessage(`Failed to connect: ${error.message}`);
  }
}

/**
 * Disconnect from the current room
 */
function disconnectFromRoom() {
  if (!isConnected) return;
  
  // Disconnect
  communicationManager.disconnect();
  
  // Update UI
  updateConnectionStatus('disconnected');
  
  // Disable input
  chatUI.elements.input.disabled = true;
  chatUI.elements.sendButton.disabled = true;
  
  // Notify background script
  chrome.runtime.sendMessage({
    type: 'LEAVE_ROOM'
  });
  
  isConnected = false;
  
  // Add system message
  addSystemMessage('Disconnected from room');
}

/**
 * Send a message
 */
function sendMessage() {
  if (!communicationManager || !isConnected) return;
  
  const message = chatUI.elements.input.value.trim();
  if (!message) return;
  
  // Clear input
  chatUI.elements.input.value = '';
  chatUI.elements.sendButton.disabled = true;
  
  // Send message
  communicationManager.broadcast(message);
  
  // Add message to UI
  addMessage({
    sender: settings.username || 'You',
    content: message,
    timestamp: Date.now(),
    isSelf: true
  });
  
  // Notify background script
  chrome.runtime.sendMessage({
    type: 'SEND_MESSAGE',
    data: { message }
  });
}

/**
 * Handle incoming message
 * @param {Object} message - Message data
 * @param {string} peerId - ID of the sender
 */
function handleIncomingMessage(message, peerId) {
  // Add message to UI
  addMessage({
    sender: message.sender || peerId,
    content: message.content,
    timestamp: message.timestamp || Date.now(),
    isSelf: false
  });
  
  // Show notification if enabled and window is not focused
  if (settings.enableNotifications && document.visibilityState !== 'visible') {
    showNotification(message.sender || 'Someone', message.content);
  }
}

/**
 * Handle peer connect event
 * @param {string} peerId - ID of the connected peer
 */
function handlePeerConnect(peerId) {
  console.log(`Peer connected: ${peerId}`);
  addSystemMessage(`${peerId} joined the chat`);
}

/**
 * Handle peer disconnect event
 * @param {string} peerId - ID of the disconnected peer
 */
function handlePeerDisconnect(peerId) {
  console.log(`Peer disconnected: ${peerId}`);
  addSystemMessage(`${peerId} left the chat`);
}

/**
 * Handle participant count update
 * @param {number} count - Number of participants
 */
function handleParticipantCount(count) {
  participants = count;
  
  // Update UI
  if (chatUI) {
    const { participantCount } = chatUI.elements;
    participantCount.textContent = count;
    participantCount.style.display = count > 1 ? 'flex' : 'none';
  }
}

/**
 * Handle connection status change
 * @param {Object} status - Connection status
 */
function handleConnectionStatusChange(status) {
  console.log('Connection status changed:', status);
  
  if (status.connected) {
    updateConnectionStatus('connected');
    isConnected = true;
  } else {
    updateConnectionStatus('disconnected');
    isConnected = false;
  }
}

/**
 * Add a message to the chat UI
 * @param {Object} message - Message data
 */
function addMessage(message) {
  if (!chatUI) return;
  
  // Store message
  messages.push(message);
  
  // Create message element
  const messageEl = document.createElement('div');
  messageEl.className = `chat-message ${message.isSelf ? 'sent' : 'received'}`;
  
  // Format timestamp
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Set content
  messageEl.innerHTML = `
    ${!message.isSelf ? `<div class="chat-message-sender">${message.sender}</div>` : ''}
    <div class="chat-message-content">${escapeHtml(message.content)}</div>
    <div class="chat-message-time">${time}</div>
  `;
  
  // Add to chat
  chatUI.elements.messages.appendChild(messageEl);
  
  // Scroll to bottom
  chatUI.elements.messages.scrollTop = chatUI.elements.messages.scrollHeight;
}

/**
 * Add a system message to the chat UI
 * @param {string} text - Message text
 */
function addSystemMessage(text) {
  if (!chatUI) return;
  
  // Create message element
  const messageEl = document.createElement('div');
  messageEl.className = 'chat-status';
  messageEl.textContent = text;
  
  // Add to chat
  chatUI.elements.messages.appendChild(messageEl);
  
  // Scroll to bottom
  chatUI.elements.messages.scrollTop = chatUI.elements.messages.scrollHeight;
}

/**
 * Update connection status in the UI
 * @param {string} status - Connection status ('connected', 'connecting', or 'disconnected')
 */
function updateConnectionStatus(status) {
  if (!chatUI) return;
  
  const { connectionIndicator, status: statusEl } = chatUI.elements;
  
  // Update connection indicator
  connectionIndicator.className = `connection-indicator ${status}`;
  
  // Update status text
  switch (status) {
    case 'connected':
      statusEl.textContent = `Connected to ${participants} ${participants === 1 ? 'person' : 'people'}`;
      break;
    case 'connecting':
      statusEl.textContent = 'Connecting...';
      break;
    case 'disconnected':
      statusEl.textContent = 'Not connected';
      break;
  }
}

/**
 * Show a notification
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 */
function showNotification(title, body) {
  // Check if notifications are supported and permission is granted
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, { body });
      }
    });
  }
}

/**
 * Handle join room request
 * @param {Object} data - Request data
 * @param {Function} sendResponse - Function to send response
 */
async function handleJoinRoomRequest(data, sendResponse) {
  if (isConnected) {
    addSystemMessage('Already connected to a room.');
    if (sendResponse) sendResponse({ success: false, error: 'Already connected' });
    return;
  }

  // Connect to room
  try {
    const room = data.room || parseUrlForRoom({ useHostOnly: true, url: window.location.href });
    await connectToRoom(room);
    if (sendResponse) sendResponse({ success: true });
  } catch (error) {
    console.error('Failed to join room:', error);
    addSystemMessage(`Error joining room: ${error.message}`);
    if (sendResponse) sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle settings updated
 * @param {Object} data - Updated settings
 * @param {Function} sendResponse - Function to send response
 */
function handleSettingsUpdated(data, sendResponse) {
  // Update settings
  settings = data.settings;
  
  // Apply theme
  applyTheme(settings.theme);
  
  // Update UI visibility
  if (settings.showOnAllPages) {
    if (!chatUI) {
      initializeChatUI();
    }
  } else {
    // TODO: Consider hiding UI if not on a supported page
  }
  
  if (sendResponse) {
    sendResponse({ success: true });
  }
}

/**
 * Handle page updated
 * @param {Object} data - Page data
 * @param {Function} sendResponse - Function to send response
 */
function handlePageUpdated(data, sendResponse) {
  // Disconnect from current room
  if (isConnected) {
    disconnectFromRoom();
  }
  
  // Reconnect if auto-connect is enabled
  if (settings.autoConnect && chatUI && !chatUI.elements.window.classList.contains('minimized')) {
    connectToRoom();
  }
  
  if (sendResponse) {
    sendResponse({ success: true });
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} html - HTML string to escape
 * @returns {string} - Escaped HTML
 */
function escapeHtml(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

// Initialize the content script
initialize();
