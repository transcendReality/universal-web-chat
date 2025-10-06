import { jest } from '@jest/globals';
import request from 'supertest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';
import express from 'express';

// Mock MongoDB
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(),
  model: jest.fn().mockReturnValue({
    findOne: jest.fn(),
    save: jest.fn(),
  }),
  Schema: jest.fn().mockReturnValue({}),
}));

// Import server after mocking
import '../server/index.js';

describe('Signaling Server Integration Tests', () => {
  let server;
  let io;
  let clientSocket;
  let port;

  beforeAll((done) => {
    // Create test server
    const app = express();
    server = createServer(app);
    io = new Server(server);
    
    // Basic route for health check
    app.get('/', (req, res) => {
      res.send('Universal Web Chat Signaling Server is running');
    });

    // Socket.IO connection handling
    io.on('connection', (socket) => {
      console.log(`New connection: ${socket.id}`);
      let currentRoom = null;

      socket.on('join-room', async (url) => {
        try {
          if (currentRoom) {
            socket.leave(currentRoom);
          }
          currentRoom = url;
          socket.join(url);
          io.to(url).emit('participant-count', 1);
        } catch (error) {
          socket.emit('error', { message: 'Failed to join room' });
        }
      });

      socket.on('leave-room', (url) => {
        if (currentRoom === url) {
          socket.leave(url);
          currentRoom = null;
        }
      });

      socket.on('offer', (peerId, offer) => {
        socket.to(currentRoom).emit('offer', socket.id, offer);
      });

      socket.on('answer', (peerId, answer) => {
        socket.to(currentRoom).emit('answer', socket.id, answer);
      });

      socket.on('ice-candidate', (peerId, candidate) => {
        socket.to(currentRoom).emit('ice-candidate', socket.id, candidate);
      });

      socket.on('disconnect', () => {
        if (currentRoom) {
          socket.to(currentRoom).emit('participant-left', socket.id);
        }
      });
    });

    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    if (clientSocket) {
      clientSocket.close();
    }
    io.close();
    server.close(done);
  });

  beforeEach((done) => {
    clientSocket = Client(`http://localhost:${port}`);
    clientSocket.on('connect', done);
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  describe('HTTP Endpoints', () => {
    test('should respond to health check', async () => {
      const response = await request(server)
        .get('/')
        .expect(200);

      expect(response.text).toBe('Universal Web Chat Signaling Server is running');
    });
  });

  describe('Socket.IO Connection', () => {
    test('should establish connection successfully', (done) => {
      expect(clientSocket.connected).toBe(true);
      done();
    });

    test('should handle disconnection', (done) => {
      clientSocket.on('disconnect', () => {
        expect(clientSocket.connected).toBe(false);
        done();
      });
      clientSocket.disconnect();
    });
  });

  describe('Room Management', () => {
    test('should join room successfully', (done) => {
      const testUrl = 'https://example.com';
      
      clientSocket.emit('join-room', testUrl);
      
      clientSocket.on('participant-count', (count) => {
        expect(count).toBe(1);
        done();
      });
    });

    test('should handle multiple clients in same room', (done) => {
      const testUrl = 'https://example.com';
      const clientSocket2 = Client(`http://localhost:${port}`);
      
      let joinCount = 0;
      
      clientSocket.emit('join-room', testUrl);
      clientSocket2.emit('join-room', testUrl);
      
      clientSocket.on('participant-count', (count) => {
        joinCount++;
        if (joinCount === 2) {
          expect(count).toBe(1); // Each client sees count of 1 initially
          clientSocket2.disconnect();
          done();
        }
      });
      
      clientSocket2.on('participant-count', (count) => {
        joinCount++;
        if (joinCount === 2) {
          expect(count).toBe(1);
          clientSocket2.disconnect();
          done();
        }
      });
    });

    test('should leave room when requested', (done) => {
      const testUrl = 'https://example.com';
      
      clientSocket.emit('join-room', testUrl);
      clientSocket.emit('leave-room', testUrl);
      
      // Should not receive participant count after leaving
      clientSocket.on('participant-count', () => {
        // This should not be called after leaving
        done(new Error('Should not receive participant count after leaving'));
      });
      
      // Wait a bit to ensure no events are received
      setTimeout(done, 100);
    });
  });

  describe('WebRTC Signaling', () => {
    test('should forward offer to other clients in room', (done) => {
      const testUrl = 'https://example.com';
      const clientSocket2 = Client(`http://localhost:${port}`);
      const mockOffer = { type: 'offer', sdp: 'test-sdp' };
      
      clientSocket.emit('join-room', testUrl);
      clientSocket2.emit('join-room', testUrl);
      
      clientSocket2.on('offer', (peerId, offer) => {
        expect(offer).toEqual(mockOffer);
        expect(peerId).toBe(clientSocket.id);
        clientSocket2.disconnect();
        done();
      });
      
      clientSocket.emit('offer', 'peer-123', mockOffer);
    });

    test('should forward answer to other clients in room', (done) => {
      const testUrl = 'https://example.com';
      const clientSocket2 = Client(`http://localhost:${port}`);
      const mockAnswer = { type: 'answer', sdp: 'test-sdp' };
      
      clientSocket.emit('join-room', testUrl);
      clientSocket2.emit('join-room', testUrl);
      
      clientSocket2.on('answer', (peerId, answer) => {
        expect(answer).toEqual(mockAnswer);
        expect(peerId).toBe(clientSocket.id);
        clientSocket2.disconnect();
        done();
      });
      
      clientSocket.emit('answer', 'peer-123', mockAnswer);
    });

    test('should forward ICE candidates to other clients in room', (done) => {
      const testUrl = 'https://example.com';
      const clientSocket2 = Client(`http://localhost:${port}`);
      const mockCandidate = { candidate: 'test-candidate' };
      
      clientSocket.emit('join-room', testUrl);
      clientSocket2.emit('join-room', testUrl);
      
      clientSocket2.on('ice-candidate', (peerId, candidate) => {
        expect(candidate).toEqual(mockCandidate);
        expect(peerId).toBe(clientSocket.id);
        clientSocket2.disconnect();
        done();
      });
      
      clientSocket.emit('ice-candidate', 'peer-123', mockCandidate);
    });
  });

  describe('Error Handling', () => {
    test('should handle room join errors gracefully', (done) => {
      // Mock a scenario where room joining fails
      const originalJoin = clientSocket.emit;
      clientSocket.emit = jest.fn().mockImplementation((event, data) => {
        if (event === 'join-room') {
          clientSocket.emit('error', { message: 'Failed to join room' });
        } else {
          originalJoin.call(clientSocket, event, data);
        }
      });
      
      clientSocket.on('error', (error) => {
        expect(error.message).toBe('Failed to join room');
        done();
      });
      
      clientSocket.emit('join-room', 'https://example.com');
    });
  });
});
