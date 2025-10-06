/**
 * P2P Service
 * 
 * This service handles peer-to-peer communication using WebRTC.
 * It manages connections, signaling, and data transfer between peers.
 */
import SimplePeer from 'simple-peer';
import { io } from 'socket.io-client';

export class P2PService {
  /**
   * Initialize the P2P service
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
    this.peers = new Map(); // Map of peer connections
    this.connected = false;
    this.userId = this._generateUserId();
    
    // Event callbacks
    this.onMessage = null;
    this.onPeerConnect = null;
    this.onPeerDisconnect = null;
    this.onParticipantCount = null;
  }
  
  /**
   * Connect to the signaling server and initialize P2P connections
   * @returns {Promise} - Resolves when connected to the signaling server
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        // Connect to signaling server
        this.socket = io(this.serverUrl);
        
        // Handle connection to signaling server
        this.socket.on('connect', () => {
          this.connected = true;
          this._log('Connected to signaling server');
          
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
          
          // Handle signaling messages
          this.socket.on('signal', (data) => {
            this._handleSignal(data);
          });
          
          resolve();
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
   * Disconnect from the signaling server and all peers
   */
  disconnect() {
    // Close all peer connections
    for (const [peerId, peer] of this.peers.entries()) {
      peer.destroy();
      this.peers.delete(peerId);
    }
    
    // Disconnect from signaling server
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.connected = false;
    this._log('Disconnected from P2P network');
  }
  
  /**
   * Send a message to all connected peers
   * @param {any} message - Message to send
   */
  broadcast(message) {
    const messageData = {
      type: 'message',
      sender: this.userId,
      content: message,
      timestamp: Date.now()
    };
    
    // Send to all peers
    for (const peer of this.peers.values()) {
      peer.send(JSON.stringify(messageData));
    }
  }
  
  /**
   * Send a message to a specific peer
   * @param {string} peerId - ID of the peer to send to
   * @param {any} message - Message to send
   * @returns {boolean} - Whether the message was sent
   */
  sendTo(peerId, message) {
    const peer = this.peers.get(peerId);
    if (!peer) {
      this._log(`Peer ${peerId} not found`);
      return false;
    }
    
    const messageData = {
      type: 'message',
      sender: this.userId,
      receiver: peerId,
      content: message,
      timestamp: Date.now()
    };
    
    peer.send(JSON.stringify(messageData));
    return true;
  }
  
  /**
   * Handle incoming signaling data
   * @param {Object} data - Signaling data
   * @private
   */
  _handleSignal(data) {
    const { from, to, signal } = data;
    
    // Ignore messages not intended for us
    if (to && to !== this.userId) {
      return;
    }
    
    // Create a new peer if it doesn't exist
    if (!this.peers.has(from)) {
      this._createPeer(from, false);
    }
    
    // Process the signal
    try {
      const peer = this.peers.get(from);
      peer.signal(signal);
    } catch (error) {
      this._log('Error processing signal:', error);
    }
  }
  
  /**
   * Create a new peer connection
   * @param {string} peerId - ID of the peer to connect to
   * @param {boolean} initiator - Whether we are initiating the connection
   * @returns {SimplePeer} - The peer connection
   * @private
   */
  _createPeer(peerId, initiator = true) {
    this._log(`Creating ${initiator ? 'initiator' : 'receiver'} peer for ${peerId}`);
    
    // Create the peer
    const peer = new SimplePeer({
      initiator,
      trickle: true
    });
    
    // Handle signaling
    peer.on('signal', (signal) => {
      this.socket.emit('signal', {
        from: this.userId,
        to: peerId,
        signal
      });
    });
    
    // Handle connection
    peer.on('connect', () => {
      this._log(`Connected to peer ${peerId}`);
      if (this.onPeerConnect) {
        this.onPeerConnect(peerId);
      }
    });
    
    // Handle incoming data
    peer.on('data', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this._log(`Received message from ${peerId}:`, message);
        if (this.onMessage) {
          this.onMessage(message, peerId);
        }
      } catch (error) {
        this._log('Error parsing message:', error);
      }
    });
    
    // Handle errors
    peer.on('error', (error) => {
      this._log(`Peer error (${peerId}):`, error);
    });
    
    // Handle close
    peer.on('close', () => {
      this._log(`Peer ${peerId} disconnected`);
      this.peers.delete(peerId);
      if (this.onPeerDisconnect) {
        this.onPeerDisconnect(peerId);
      }
    });
    
    // Store the peer
    this.peers.set(peerId, peer);
    return peer;
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
      console.log('[P2PService]', ...args);
    }
  }
}

export default P2PService;
