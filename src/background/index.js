/**
 * Background Script / Service Worker
 * 
 * This script runs in the background of the extension and handles:
 * - Extension lifecycle events
 * - P2P coordination
 * - Communication between content scripts and popup
 * - Storage management
 */
import { parseUrlForRoom } from '../utils/url-parser.js';
import { getBrowserInfo } from '../utils/browser-detection.js';

// Store active connections by tab ID
const activeConnections = new Map();

// Store user settings
let userSettings = {
  username: '',
  enableNotifications: true,
  theme: 'light',
  showOnAllPages: true,
  autoConnect: false
};

// Initialize extension
async function initialize() {
  console.log('Universal Web Chat: Background script initialized');
  
  // Load user settings
  await loadSettings();
  
  // Set up message listeners
  setupMessageListeners();
  
  // Set up browser-specific event listeners
  setupBrowserEvents();
}

/**
 * Set up message listeners for communication with content scripts and popup
 */
function setupMessageListeners() {
  // Listen for messages from content scripts and popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);
    
    // Handle different message types
    switch (message.type) {
      case 'CONTENT_SCRIPT_LOADED':
        handleContentScriptLoaded(sender.tab.id, message.data, sendResponse);
        return true; // Keep the message channel open for async response
        
      case 'JOIN_ROOM':
        handleJoinRoom(sender.tab.id, message.data, sendResponse);
        return true;
        
      case 'LEAVE_ROOM':
        handleLeaveRoom(sender.tab.id, sendResponse);
        return true;
        
      case 'SEND_MESSAGE':
        handleSendMessage(sender.tab.id, message.data, sendResponse);
        return true;
        
      case 'GET_SETTINGS':
        sendResponse({ success: true, settings: userSettings });
        return false;
        
      case 'UPDATE_SETTINGS':
        handleUpdateSettings(message.data, sendResponse);
        return true;
        
      case 'GET_ACTIVE_CONNECTIONS':
        handleGetActiveConnections(sendResponse);
        return true;
        
      case 'GET_CONNECTION_STATUS':
        handleGetConnectionStatus(sender.tab.id, sendResponse);
        return true;
    }
    
    return false;
  });
}

/**
 * Set up browser-specific event listeners
 */
function setupBrowserEvents() {
  // Get browser info
  const browserInfo = getBrowserInfo();
  
  // Handle tab updates
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Only react to complete page loads
    if (changeInfo.status === 'complete' && tab.url) {
      // Notify content script that page has been updated
      chrome.tabs.sendMessage(tabId, { 
        type: 'PAGE_UPDATED',
        data: { url: tab.url }
      }).catch(err => {
        // Content script might not be loaded yet, which is fine
        console.log('Could not send PAGE_UPDATED message:', err);
      });
    }
  });
  
  // Handle tab closures
  chrome.tabs.onRemoved.addListener((tabId) => {
    // Clean up any active connections for this tab
    if (activeConnections.has(tabId)) {
      // No need to actually disconnect as the tab is gone
      activeConnections.delete(tabId);
      console.log(`Removed connection for closed tab ${tabId}`);
    }
  });
}

/**
 * Handle content script loaded message
 * @param {number} tabId - ID of the tab
 * @param {Object} data - Message data
 * @param {Function} sendResponse - Function to send response
 */
async function handleContentScriptLoaded(tabId, data, sendResponse) {
  console.log(`Content script loaded in tab ${tabId}`);
  
  // Send settings to content script
  sendResponse({ 
    success: true, 
    settings: userSettings,
    browserInfo: getBrowserInfo()
  });
  
  // Auto-connect if enabled in settings
  if (userSettings.autoConnect && data.url) {
    // Get the tab info to access the URL
    try {
      const tab = await chrome.tabs.get(tabId);
      
      // Determine room based on URL
      const room = parseUrlForRoom({
        useHostOnly: true,
        url: tab.url
      });
      
      // Notify content script to join room
      chrome.tabs.sendMessage(tabId, {
        type: 'JOIN_ROOM_REQUEST',
        data: { room }
      }).catch(err => {
        console.error('Error sending join room request:', err);
      });
    } catch (error) {
      console.error('Error auto-connecting:', error);
    }
  }
}

/**
 * Handle join room message
 * @param {number} tabId - ID of the tab
 * @param {Object} data - Message data
 * @param {Function} sendResponse - Function to send response
 */
async function handleJoinRoom(tabId, data, sendResponse) {
  try {
    const tab = await chrome.tabs.get(tabId);
    const room = (data && data.room) ? data.room : parseUrlForRoom({ useHostOnly: true, url: tab.url });

    // Store connection info (basic metadata; participant count is client-side only)
    activeConnections.set(tabId, {
      room,
      url: tab.url,
      participants: 1,
      joinedAt: Date.now()
    });

    // Ask the content script in that tab to actually connect
    chrome.tabs.sendMessage(tabId, {
      type: 'JOIN_ROOM_REQUEST',
      data: { room }
    }).catch(err => console.error('Error forwarding JOIN_ROOM_REQUEST:', err));

    if (sendResponse) sendResponse({ success: true });
  } catch (err) {
    console.error('handleJoinRoom error:', err);
    if (sendResponse) sendResponse({ success: false, error: err.message });
  }
}

/**
 * Handle leave room message
 * @param {number} tabId - ID of the tab
 * @param {Function} sendResponse - Function to send response
 */
function handleLeaveRoom(tabId, sendResponse) {
  console.log(`Tab ${tabId} leaving room`);

  // Notify content script so it can disconnect gracefully
  chrome.tabs.sendMessage(tabId, { type: 'LEAVE_ROOM' }).catch(() => {});

  activeConnections.delete(tabId);

  if (sendResponse) sendResponse({ success: true });
}

/**
 * Handle send message
 * @param {number} tabId - ID of the tab
 * @param {Object} data - Message data
 * @param {Function} sendResponse - Function to send response
 */
function handleSendMessage(tabId, data, sendResponse) {
  console.log(`Tab ${tabId} sending message:`, data.message);
  
  // The actual message sending is handled by the content script
  // This is just for logging and potential future features
  
  sendResponse({ success: true });
}

/**
 * Handle update settings message
 * @param {Object} data - New settings
 * @param {Function} sendResponse - Function to send response
 */
async function handleUpdateSettings(data, sendResponse) {
  console.log('Updating settings:', data);
  
  // Update settings
  userSettings = {
    ...userSettings,
    ...data
  };
  
  // Save settings
  try {
    await saveSettings();
    sendResponse({ success: true });
    
    // Notify all active tabs about settings update
    notifyAllTabs({
      type: 'SETTINGS_UPDATED',
      data: { settings: userSettings }
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle get connection status message
 * @param {number} tabId - ID of the tab
 * @param {Function} sendResponse - Function to send response
 */
function handleGetConnectionStatus(tabId, sendResponse) {
  const connection = activeConnections.get(tabId);
  
  if (connection) {
    sendResponse({
      success: true,
      connected: true,
      room: connection.room,
      joinedAt: connection.joinedAt
    });
  } else {
    sendResponse({
      success: true,
      connected: false
    });
  }
}

/**
 * Provide list of active connections to popup
 * @param {Function} sendResponse - Function to send response
 */
function handleGetActiveConnections(sendResponse) {
  const connections = [];
  activeConnections.forEach((info, tabId) => {
    connections.push({
      tabId,
      url: info.url || '',
      room: info.room,
      participants: info.participants || 1
    });
  });
  sendResponse({ success: true, connections });
}

/**
 * Load user settings from storage
 * @returns {Promise} - Resolves when settings are loaded
 */
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get('userSettings', (result) => {
      if (result.userSettings) {
        userSettings = result.userSettings;
        console.log('Loaded settings:', userSettings);
      } else {
        console.log('No saved settings found, using defaults');
      }
      resolve();
    });
  });
}

/**
 * Save user settings to storage
 * @returns {Promise} - Resolves when settings are saved
 */
async function saveSettings() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ userSettings }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        console.log('Settings saved');
        resolve();
      }
    });
  });
}

/**
 * Notify all active tabs with a message
 * @param {Object} message - Message to send
 */
function notifyAllTabs(message) {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, message).catch(() => {
        // Ignore errors - content script might not be loaded in all tabs
      });
    }
  });
}

// Initialize the background script
initialize();
