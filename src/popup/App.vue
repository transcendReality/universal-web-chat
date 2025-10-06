<template>
  <div class="popup-container">
    <header class="popup-header">
      <h1>Universal Web Chat</h1>
      <div class="version">v1.0.0</div>
    </header>
    
    <main class="popup-content">
      <div class="tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id" 
          :class="['tab-button', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
      
      <div class="tab-content">
        <!-- Settings Tab -->
        <div v-if="activeTab === 'settings'" class="settings-tab">
          <div class="form-group">
            <label for="username">Display Name</label>
            <input 
              type="text" 
              id="username" 
              v-model="settings.username" 
              placeholder="Enter your display name"
            >
          </div>
          
          <div class="form-group">
            <label for="theme">Theme</label>
            <select id="theme" v-model="settings.theme">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System Default</option>
            </select>
          </div>
          
          <div class="form-group checkbox">
            <input 
              type="checkbox" 
              id="notifications" 
              v-model="settings.enableNotifications"
            >
            <label for="notifications">Enable Notifications</label>
          </div>
          
          <div class="form-group checkbox">
            <input 
              type="checkbox" 
              id="autoConnect" 
              v-model="settings.autoConnect"
            >
            <label for="autoConnect">Auto-connect to rooms</label>
          </div>
          
          <div class="form-group checkbox">
            <input 
              type="checkbox" 
              id="showOnAllPages" 
              v-model="settings.showOnAllPages"
            >
            <label for="showOnAllPages">Show chat on all websites</label>
          </div>
          
          <button class="save-button" @click="saveSettings">Save Settings</button>
        </div>
        
        <!-- Status Tab -->
        <div v-if="activeTab === 'status'" class="status-tab">
          <div class="status-item">
            <div class="status-label">Browser</div>
            <div class="status-value">{{ browserInfo.name }} {{ browserInfo.version }}</div>
          </div>
          
          <div class="status-item">
            <div class="status-label">WebRTC Support</div>
            <div class="status-value" :class="{ 'status-positive': browserInfo.features.webRTC, 'status-negative': !browserInfo.features.webRTC }">
              {{ browserInfo.features.webRTC ? 'Supported' : 'Not Supported' }}
            </div>
          </div>
          
          <div class="status-item">
            <div class="status-label">Active Connections</div>
            <div class="status-value">{{ activeConnections.length }}</div>
          </div>
          
          <div v-if="activeConnections.length > 0" class="connections-list">
            <div v-for="(connection, index) in activeConnections" :key="index" class="connection-item">
              <div class="connection-url">{{ connection.url }}</div>
              <div class="connection-details">
                Room: {{ connection.room }} | Participants: {{ connection.participants }}
              </div>
            </div>
          </div>
          
          <div class="status-actions">
            <button class="connect-button" v-if="connectionStatus === 'disconnected'" @click="connect()">Connect</button>
            <button class="disconnect-button" v-if="connectionStatus === 'connected'" @click="disconnect()">Disconnect</button>
            <button class="refresh-button" @click="refreshStatus">Refresh</button>
          </div>
        </div>
        
        <!-- About Tab -->
        <div v-if="activeTab === 'about'" class="about-tab">
          <div class="about-logo">
            <!-- Logo image removed to fix build error -->
          </div>
          
          <h2>Universal Web Chat</h2>
          <p class="about-description">
            A browser extension that enables peer-to-peer chat functionality across all websites.
            Chat with others visiting the same site in real-time.
          </p>
          
          <div class="about-features">
            <h3>Features</h3>
            <ul>
              <li>P2P communication using WebRTC</li>
              <li>Works across all major browsers</li>
              <li>No account required</li>
              <li>Privacy-focused design</li>
              <li>Lightweight and fast</li>
            </ul>
          </div>
          
          <div class="about-footer">
            <p>&copy; 2025 Universal Web Chat</p>
            <div class="about-links">
              <a href="#" @click.prevent="openLink('https://github.com/example/universal-web-chat')">GitHub</a>
              <a href="#" @click.prevent="openLink('https://example.com/privacy')">Privacy Policy</a>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <footer class="popup-footer">
      <div class="status-indicator" :class="connectionStatus">
        {{ connectionStatusText }}
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      activeTab: 'settings',
      tabs: [
        { id: 'settings', label: 'Settings' },
        { id: 'status', label: 'Status' },
        { id: 'about', label: 'About' }
      ],
      settings: {
        username: '',
        theme: 'light',
        enableNotifications: true,
        autoConnect: true,
        showOnAllPages: true
      },
      browserInfo: {
        name: 'Unknown',
        version: '',
        features: {
          webRTC: false,
          webSockets: false
        }
      },
      activeConnections: [],
      connectionStatus: 'disconnected'
    };
  },
  computed: {
    connectionStatusText() {
      switch (this.connectionStatus) {
        case 'connected':
          return 'Connected';
        case 'connecting':
          return 'Connecting...';
        case 'disconnected':
        default:
          return 'Not Connected';
      }
    }
  },
  mounted() {
    this.loadSettings();
    this.detectBrowser();
    this.getConnectionStatus();
  },
  methods: {
    loadSettings() {
      chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, response => {
        if (response && response.success) {
          this.settings = response.settings;
        }
      });
    },
    
    saveSettings() {
      chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        data: this.settings
      }, response => {
        if (response && response.success) {
          this.showToast('Settings saved successfully');
        } else {
          this.showToast('Failed to save settings', 'error');
        }
      });
    },
    
    detectBrowser() {
      // This is a simplified version - in reality we would use the browser-detection.js utility
      const userAgent = navigator.userAgent;
      
      if (userAgent.indexOf('Firefox') !== -1) {
        this.browserInfo.name = 'Firefox';
      } else if (userAgent.indexOf('Edg') !== -1) {
        this.browserInfo.name = 'Edge';
      } else if (userAgent.indexOf('Chrome') !== -1) {
        this.browserInfo.name = 'Chrome';
      } else if (userAgent.indexOf('Safari') !== -1) {
        this.browserInfo.name = 'Safari';
      }
      
      // Check for WebRTC support
      this.browserInfo.features.webRTC = typeof RTCPeerConnection !== 'undefined';
      this.browserInfo.features.webSockets = typeof WebSocket !== 'undefined';
    },
    
    getConnectionStatus() {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (tabs.length === 0) return;
        
        const activeTab = tabs[0];
        
        chrome.runtime.sendMessage({
          type: 'GET_CONNECTION_STATUS',
          data: { tabId: activeTab.id }
        }, response => {
          if (response && response.success) {
            this.connectionStatus = response.connected ? 'connected' : 'disconnected';
            
            // Update active connections
            this.getActiveConnections();
          }
        });
      });
    },
    
    getActiveConnections() {
      chrome.runtime.sendMessage({
        type: 'GET_ACTIVE_CONNECTIONS'
      }, response => {
        if (response && response.success) {
          this.activeConnections = response.connections;
        }
      });
    },
    
    refreshStatus() {
      this.detectBrowser();
      this.getConnectionStatus();
      this.showToast('Status refreshed');
    },
    
    openLink(url) {
      chrome.tabs.create({ url });
    },
    
    showToast(message, type = 'success') {
      // Simple toast implementation
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.textContent = message;
      
      document.body.appendChild(toast);
      
      // Animate in
      setTimeout(() => {
        toast.classList.add('show');
      }, 10);
      
      // Remove after delay
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 3000);
    },
    
    connect() {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (tabs.length === 0) return;
        const activeTab = tabs[0];
        chrome.runtime.sendMessage({
          type: 'JOIN_ROOM',
          data: {}
        }, response => {
          if (response && response.success) {
            this.connectionStatus = 'connecting';
            this.showToast('Connecting...');
            setTimeout(this.refreshStatus, 1000);
          }
        });
      });
    },
    
    disconnect() {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (tabs.length === 0) return;
        const activeTab = tabs[0];
        chrome.runtime.sendMessage({
          type: 'LEAVE_ROOM'
        }, response => {
          if (response && response.success) {
            this.connectionStatus = 'disconnected';
            this.showToast('Disconnected', 'info');
            setTimeout(this.refreshStatus, 500);
          }
        });
      });
    }
  }
};
</script>

<style>
/* Reset and base styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
}

/* Popup container */
.popup-container {
  width: 350px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

/* Header */
.popup-header {
  padding: 16px;
  background-color: #4a6ee0;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.popup-header h1 {
  font-size: 18px;
  font-weight: 600;
}

.version {
  font-size: 12px;
  opacity: 0.8;
}

/* Main content */
.popup-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

/* Tabs */
.tabs {
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 16px;
}

.tab-button {
  padding: 8px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-button:hover {
  color: #4a6ee0;
}

.tab-button.active {
  color: #4a6ee0;
  border-bottom-color: #4a6ee0;
}

/* Form elements */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group.checkbox {
  display: flex;
  align-items: center;
}

.form-group.checkbox label {
  margin-bottom: 0;
  margin-left: 8px;
}

input[type="text"],
select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

input[type="text"]:focus,
select:focus {
  border-color: #4a6ee0;
  outline: none;
}

/* Buttons */
.save-button,
.refresh-button {
  background-color: #4a6ee0;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-button:hover,
.refresh-button:hover {
  background-color: #3a5dcc;
}

.connect-button {
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.connect-button:hover {
  background-color: #3e8e41;
}

.disconnect-button {
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.disconnect-button:hover {
  background-color: #e91e63;
}

/* Status tab */
.status-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.status-label {
  font-weight: 500;
}

.status-positive {
  color: #4caf50;
}

.status-negative {
  color: #f44336;
}

.connections-list {
  margin-top: 16px;
  margin-bottom: 16px;
}

.connection-item {
  padding: 12px;
  background-color: #f0f4ff;
  border-radius: 4px;
  margin-bottom: 8px;
}

.connection-url {
  font-weight: 500;
  margin-bottom: 4px;
}

.connection-details {
  font-size: 12px;
  color: #666;
}

/* About tab */
.about-tab {
  text-align: center;
}

.about-logo {
  margin-bottom: 16px;
}

.about-logo img {
  width: 80px;
  height: 80px;
}

.about-description {
  margin-bottom: 24px;
  color: #666;
}

.about-features {
  text-align: left;
  margin-bottom: 24px;
}

.about-features h3 {
  margin-bottom: 8px;
}

.about-features ul {
  padding-left: 24px;
}

.about-features li {
  margin-bottom: 4px;
}

.about-footer {
  font-size: 12px;
  color: #999;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.about-links {
  margin-top: 8px;
}

.about-links a {
  color: #4a6ee0;
  text-decoration: none;
  margin: 0 8px;
}

.about-links a:hover {
  text-decoration: underline;
}

/* Footer */
.popup-footer {
  padding: 12px 16px;
  border-top: 1px solid #ddd;
  display: flex;
  justify-content: flex-end;
}

.status-indicator {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  background-color: #eee;
}

.status-indicator.connected {
  background-color: #e6f4ea;
  color: #4caf50;
}

.status-indicator.connecting {
  background-color: #fff8e1;
  color: #ff9800;
}

.status-indicator.disconnected {
  background-color: #feeae6;
  color: #f44336;
}

/* Toast notifications */
.toast {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%) translateY(100%);
  padding: 8px 16px;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  opacity: 0;
  transition: transform 0.3s, opacity 0.3s;
  z-index: 9999;
}

.toast.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

.toast-success {
  background-color: #4caf50;
}

.toast-error {
  background-color: #f44336;
}

/* Dark theme */
body[data-theme="dark"] {
  background-color: #1a1c27;
  color: #e0e0e0;
}

body[data-theme="dark"] .popup-container {
  background-color: #1a1c27;
}

body[data-theme="dark"] .popup-header {
  background-color: #5d7ce6;
}

body[data-theme="dark"] .tabs {
  border-bottom-color: #3a3d4e;
}

body[data-theme="dark"] .tab-button {
  color: #a0a0a0;
}

body[data-theme="dark"] .tab-button:hover,
body[data-theme="dark"] .tab-button.active {
  color: #5d7ce6;
}

body[data-theme="dark"] .tab-button.active {
  border-bottom-color: #5d7ce6;
}

body[data-theme="dark"] input[type="text"],
body[data-theme="dark"] select {
  background-color: #2a2d3e;
  border-color: #3a3d4e;
  color: #e0e0e0;
}

body[data-theme="dark"] .status-item {
  border-bottom-color: #3a3d4e;
}

body[data-theme="dark"] .connection-item {
  background-color: #2a2d3e;
}

body[data-theme="dark"] .connection-details {
  color: #a0a0a0;
}

body[data-theme="dark"] .about-description {
  color: #a0a0a0;
}

body[data-theme="dark"] .about-footer {
  color: #777;
  border-top-color: #3a3d4e;
}

body[data-theme="dark"] .popup-footer {
  border-top-color: #3a3d4e;
}
</style>
