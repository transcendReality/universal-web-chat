import { jest } from '@jest/globals';
import { P2PService } from '../../../src/services/p2p-service.js';

describe('P2PService', () => {
  let p2pService;

  beforeEach(() => {
    p2pService = new P2PService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    test('should initialize with default settings', () => {
      expect(p2pService.connected).toBe(false);
      expect(p2pService.peers).toEqual(new Map());
      expect(p2pService.socket).toBeNull();
      expect(p2pService.serverUrl).toBe('http://localhost:2999');
    });

    test('should initialize with custom settings', () => {
      const customService = new P2PService('http://custom-server.com', {
        debug: true,
        room: 'custom-room'
      });

      expect(customService.serverUrl).toBe('http://custom-server.com');
      expect(customService.options.debug).toBe(true);
      expect(customService.options.room).toBe('custom-room');
    });
  });

  describe('message sending', () => {
    test('should send message to specific peer', async () => {
      const mockPeerId = 'peer-123';
      const mockMessage = { text: 'Hello, world!' };
      const mockPeer = {
        send: jest.fn(),
        readyState: 'open'
      };

      p2pService.peers.set(mockPeerId, mockPeer);

      await p2pService.sendTo(mockPeerId, mockMessage);

      // Check that send was called with a message containing our content
      expect(mockPeer.send).toHaveBeenCalled();
      const sentMessage = JSON.parse(mockPeer.send.mock.calls[0][0]);
      expect(sentMessage.content).toEqual(mockMessage);
      expect(sentMessage.receiver).toBe(mockPeerId);
    });

    test('should broadcast message to all peers', async () => {
      const mockMessage = { text: 'Broadcast message' };
      const mockPeer1 = { send: jest.fn(), readyState: 'open' };
      const mockPeer2 = { send: jest.fn(), readyState: 'open' };

      p2pService.peers.set('peer-1', mockPeer1);
      p2pService.peers.set('peer-2', mockPeer2);

      await p2pService.broadcast(mockMessage);

      // Check that both peers received the message
      expect(mockPeer1.send).toHaveBeenCalled();
      expect(mockPeer2.send).toHaveBeenCalled();
      
      const sentMessage1 = JSON.parse(mockPeer1.send.mock.calls[0][0]);
      const sentMessage2 = JSON.parse(mockPeer2.send.mock.calls[0][0]);
      expect(sentMessage1.content).toEqual(mockMessage);
      expect(sentMessage2.content).toEqual(mockMessage);
    });

    test('should not send to non-existent peers', async () => {
      const mockMessage = { text: 'Test message' };

      const result = await p2pService.sendTo('non-existent-peer', mockMessage);

      expect(result).toBe(false);
    });
  });

  describe('peer management', () => {
    test('should disconnect from all peers', () => {
      const mockPeer1 = { destroy: jest.fn() };
      const mockPeer2 = { destroy: jest.fn() };

      p2pService.peers.set('peer-1', mockPeer1);
      p2pService.peers.set('peer-2', mockPeer2);

      p2pService.disconnect();

      expect(mockPeer1.destroy).toHaveBeenCalled();
      expect(mockPeer2.destroy).toHaveBeenCalled();
      expect(p2pService.peers.size).toBe(0);
      expect(p2pService.connected).toBe(false);
    });

    test('should handle disconnect when no peers exist', () => {
      expect(() => p2pService.disconnect()).not.toThrow();
      expect(p2pService.connected).toBe(false);
    });
  });

  describe('utility methods', () => {
    test('should generate unique user ID', () => {
      const userId1 = p2pService.userId;
      const userId2 = p2pService.userId;

      expect(userId1).toBeDefined();
      expect(userId1).toBe(userId2); // Should be consistent for same instance
      expect(userId1).toMatch(/^user_[a-zA-Z0-9]+$/); // Should match expected format
    });

    test('should log messages when debug is enabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      p2pService.options.debug = true;
      p2pService._log('Test message');

      expect(consoleSpy).toHaveBeenCalledWith('[P2PService]', 'Test message');
      
      consoleSpy.mockRestore();
    });

    test('should not log messages when debug is disabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      p2pService.options.debug = false;
      p2pService._log('Test message');

      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('event callbacks', () => {
    test('should set message callback', () => {
      const mockCallback = jest.fn();
      p2pService.onMessage = mockCallback;

      expect(p2pService.onMessage).toBe(mockCallback);
    });

    test('should set peer connect callback', () => {
      const mockCallback = jest.fn();
      p2pService.onPeerConnect = mockCallback;

      expect(p2pService.onPeerConnect).toBe(mockCallback);
    });

    test('should set peer disconnect callback', () => {
      const mockCallback = jest.fn();
      p2pService.onPeerDisconnect = mockCallback;

      expect(p2pService.onPeerDisconnect).toBe(mockCallback);
    });

    test('should set participant count callback', () => {
      const mockCallback = jest.fn();
      p2pService.onParticipantCount = mockCallback;

      expect(p2pService.onParticipantCount).toBe(mockCallback);
    });
  });
});
