/**
 * Communication Manager Service
 * 
 * This service manages communication between peers, handling both WebRTC and WebSocket fallback.
 * It provides a unified interface for sending and receiving messages regardless of the underlying technology.
 */
import P2PService from './p2p-service.js';
import WebSocketFallbackService from './websocket-fallback-service.js';
import { parseUrlForRoom } from '../utils/url-parser.js';

export class CommunicationManager {
  /**
   * Initialize the communication manager
   * @param {string} serverUrl - URL of the signaling server
   * @param {Object} options - Configuration options
   */
  constructor(serverUrl = 'http://localhost:2999', options = {}) {
    this.serverUrl = serverUrl;
    this.options = {
      debug: false,
      useWebRTC: true,
      useWebSocketFallback: true,
      roomOptions: {
        useHostOnly: true,
        usePathOnly: false,
        useFullUrl: false
      },
      ...options
    };
    
    // Determine the room based on URL
    this.room = parseUrlForRoom(this.options.roomOptions);
    
    // Initialize services
    this.p2pService = new P2PService(serverUrl, {
      ...this.options,
      room: this.room
    });
    
    this.wsService = new WebSocketFallbackService(serverUrl, {
      ...this.options,
      room: this.room
    });
    
    // State tracking
    this.webRTCAvailable = false;
    this.webRTCConnected = false;
    this.webSocketConnected = false;
    this.activeService = null;
    
    // Event callbacks
    this.onMessage = null;
    this.onPeerConnect = null;
    this.onPeerDisconnect = null;
    this.onParticipantCount = null;
    this.onStatusChange = null;
  }
  
  /**
   * Initialize and connect to the appropriate service
   * @returns {Promise} - Resolves when connected
   */
  async connect() {
    this._log('Initializing communication...');
    
    // Check WebRTC availability
    this.webRTCAvailable = this._checkWebRTCSupport();
    this._log(`WebRTC available: ${this.webRTCAvailable}`);
    
    // Set up event handlers for P2P service
    this._setupP2PEventHandlers();
    
    // Set up event handlers for WebSocket fallback
    this._setupWSEventHandlers();
    
    try {
      // Try WebRTC first if available and enabled
      if (this.webRTCAvailable && this.options.useWebRTC) {
        this._log('Attempting WebRTC connection...');
        try {
          await this.p2pService.connect();
          this.webRTCConnected = true;
          this.activeService = 'webrtc';
          this._notifyStatusChange();
          this._log('WebRTC connection established');
          return;
        } catch (error) {
          this._log('WebRTC connection failed:', error);
          this.webRTCConnected = false;
        }
      }
      
      // Fall back to WebSocket if WebRTC failed or is not available/enabled
      if (this.options.useWebSocketFallback) {
        this._log('Attempting WebSocket fallback connection...');
        try {
          await this.wsService.connect();
          this.webSocketConnected = true;
          this.activeService = 'websocket';
          this._notifyStatusChange();
          this._log('WebSocket fallback connection established');
          return;
        } catch (error) {
          this._log('WebSocket fallback connection failed:', error);
          this.webSocketConnected = false;
        }
      }
      
      // If we get here, all connection attempts failed
      throw new Error('All connection attempts failed');
    } catch (error) {
      this._log('Failed to establish any connection:', error);
      throw error;
    }
  }
  
  /**
   * Disconnect from all services
   */
  disconnect() {
    this._log('Disconnecting from all services...');
    
    // Disconnect from P2P service
    if (this.webRTCConnected) {
      this.p2pService.disconnect();
      this.webRTCConnected = false;
    }
    
    // Disconnect from WebSocket service
    if (this.webSocketConnected) {
      this.wsService.disconnect();
      this.webSocketConnected = false;
    }
    
    this.activeService = null;
    this._notifyStatusChange();
    this._log('Disconnected from all services');
  }
  
  /**
   * Send a message to all connected peers
   * @param {any} message - Message to send
   * @returns {boolean} - Whether the message was sent
   */
  broadcast(message) {
    this._log('Broadcasting message:', message);
    
    // Use the active service to send the message
    if (this.activeService === 'webrtc' && this.webRTCConnected) {
      return this.p2pService.broadcast(message);
    } else if (this.activeService === 'websocket' && this.webSocketConnected) {
      return this.wsService.broadcast(message);
    }
    
    this._log('No active service to broadcast message');
    return false;
  }
  
  /**
   * Send a message to a specific peer
   * @param {string} peerId - ID of the peer to send to
   * @param {any} message - Message to send
   * @returns {boolean} - Whether the message was sent
   */
  sendTo(peerId, message) {
    this._log(`Sending message to ${peerId}:`, message);
    
    // Use the active service to send the message
    if (this.activeService === 'webrtc' && this.webRTCConnected) {
      return this.p2pService.sendTo(peerId, message);
    } else if (this.activeService === 'websocket' && this.webSocketConnected) {
      return this.wsService.sendTo(peerId, message);
    }
    
    this._log(`No active service to send message to ${peerId}`);
    return false;
  }
  
  /**
   * Get the current connection status
   * @returns {Object} - Connection status information
   */
  getStatus() {
    return {
      connected: this.webRTCConnected || this.webSocketConnected,
      activeService: this.activeService,
      webRTCAvailable: this.webRTCAvailable,
      webRTCConnected: this.webRTCConnected,
      webSocketConnected: this.webSocketConnected,
      room: this.room
    };
  }
  
  /**
   * Set up event handlers for the P2P service
   * @private
   */
  _setupP2PEventHandlers() {
    // Handle messages
    this.p2pService.onMessage = (message, peerId) => {
      if (this.onMessage) {
        this.onMessage(message, peerId);
      }
    };
    
    // Handle peer connections
    this.p2pService.onPeerConnect = (peerId) => {
      if (this.onPeerConnect) {
        this.onPeerConnect(peerId);
      }
    };
    
    // Handle peer disconnections
    this.p2pService.onPeerDisconnect = (peerId) => {
      if (this.onPeerDisconnect) {
        this.onPeerDisconnect(peerId);
      }
    };
    
    // Handle participant count updates
    this.p2pService.onParticipantCount = (count) => {
      if (this.onParticipantCount) {
        this.onParticipantCount(count);
      }
    };
  }
  
  /**
   * Set up event handlers for the WebSocket fallback service
   * @private
   */
  _setupWSEventHandlers() {
    // Handle messages
    this.wsService.onMessage = (message) => {
      if (this.onMessage) {
        this.onMessage(message, message.sender);
      }
    };
    
    // Handle connections
    this.wsService.onConnect = () => {
      if (this.onPeerConnect) {
        this.onPeerConnect('server');
      }
    };
    
    // Handle disconnections
    this.wsService.onDisconnect = () => {
      if (this.onPeerDisconnect) {
        this.onPeerDisconnect('server');
      }
    };
    
    // Handle participant count updates
    this.wsService.onParticipantCount = (count) => {
      if (this.onParticipantCount) {
        this.onParticipantCount(count);
      }
    };
  }
  
  /**
   * Check if WebRTC is supported in the current browser
   * @returns {boolean} - Whether WebRTC is supported
   * @private
   */
  _checkWebRTCSupport() {
    return (
      typeof RTCPeerConnection !== 'undefined' &&
      typeof RTCDataChannel !== 'undefined'
    );
  }
  
  /**
   * Notify status change
   * @private
   */
  _notifyStatusChange() {
    if (this.onStatusChange) {
      this.onStatusChange(this.getStatus());
    }
  }
  
  /**
   * Log a message if debug is enabled
   * @param {...any} args - Arguments to log
   * @private
   */
  _log(...args) {
    if (this.options.debug) {
      console.log('[CommunicationManager]', ...args);
    }
  }
}

export default CommunicationManager;
