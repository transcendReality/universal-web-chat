/**
 * WebSocket Fallback Service
 * 
 * This service provides a fallback communication method using WebSockets
 * when WebRTC is not available or fails to establish a connection.
 */
import { io } from 'socket.io-client';

export class WebSocketFallbackService {
  /**
   * Initialize the WebSocket fallback service
   * @param {string} serverUrl - URL of the signaling server
   * @param {Object} options - Configuration options
   */
  constructor(serverUrl = 'http://localhost:2999', options = {}) {
    this.serverUrl = serverUrl;
    this.options = {
      debug: false,
      room: window.location.hostname, // Default room is the current hostname
      ...options
    };
    
    this.socket = null;
    this.connected = false;
    this.userId = this._generateUserId();
    
    // Event callbacks
    this.onMessage = null;
    this.onConnect = null;
    this.onDisconnect = null;
    this.onParticipantCount = null;
  }
  
  /**
   * Connect to the WebSocket server
   * @returns {Promise} - Resolves when connected to the server
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        // Connect to server
        this.socket = io(this.serverUrl);
        
        // Handle connection
        this.socket.on('connect', () => {
          this.connected = true;
          this._log('Connected to WebSocket server');
          
          // Join room based on current URL
          const room = this.options.room;
          this.socket.emit('join-room', room);
          
          // Handle participant count updates
          this.socket.on('participant-count', (count) => {
            this._log(`Participants in room: ${count}`);
            if (this.onParticipantCount) {
              this.onParticipantCount(count);
            }
          });
          
          // Handle incoming messages
          this.socket.on('ws-message', (message) => {
            this._log('Received message:', message);
            if (this.onMessage) {
              this.onMessage(message);
            }
          });
          
          if (this.onConnect) {
            this.onConnect();
          }
          
          resolve();
        });
        
        // Handle disconnection
        this.socket.on('disconnect', () => {
          this.connected = false;
          this._log('Disconnected from WebSocket server');
          if (this.onDisconnect) {
            this.onDisconnect();
          }
        });
        
        // Handle connection errors
        this.socket.on('connect_error', (error) => {
          this._log('Connection error:', error);
          reject(error);
        });
      } catch (error) {
        this._log('Error connecting to server:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.connected = false;
    this._log('Disconnected from WebSocket server');
  }
  
  /**
   * Send a message to all users in the room
   * @param {any} message - Message to send
   */
  broadcast(message) {
    if (!this.connected || !this.socket) {
      this._log('Not connected to server');
      return false;
    }
    
    const messageData = {
      type: 'message',
      sender: this.userId,
      content: message,
      timestamp: Date.now()
    };
    
    this.socket.emit('ws-broadcast', {
      room: this.options.room,
      message: messageData
    });
    
    return true;
  }
  
  /**
   * Send a message to a specific user
   * @param {string} userId - ID of the user to send to
   * @param {any} message - Message to send
   */
  sendTo(userId, message) {
    if (!this.connected || !this.socket) {
      this._log('Not connected to server');
      return false;
    }
    
    const messageData = {
      type: 'message',
      sender: this.userId,
      receiver: userId,
      content: message,
      timestamp: Date.now()
    };
    
    this.socket.emit('ws-direct', {
      to: userId,
      message: messageData
    });
    
    return true;
  }
  
  /**
   * Generate a random user ID
   * @returns {string} - Random user ID
   * @private
   */
  _generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }
  
  /**
   * Log a message if debug is enabled
   * @param {...any} args - Arguments to log
   * @private
   */
  _log(...args) {
    if (this.options.debug) {
      console.log('[WebSocketFallback]', ...args);
    }
  }
}

export default WebSocketFallbackService;
