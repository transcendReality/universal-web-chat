/**
 * Signaling Server for Universal Web Chat
 * 
 * This server handles peer discovery and WebRTC signaling.
 * It uses Socket.IO for real-time communication and MongoDB for room management.
 */
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/webchat')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Room schema
const roomSchema = new mongoose.Schema({
  url: { type: String, required: true, index: true },
  participants: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now }
});

// Create Room model
const Room = mongoose.model('Room', roomSchema);

// Basic route for health check
app.get('/', (req, res) => {
  res.send('Universal Web Chat Signaling Server is running');
});

// Socket.IO connection handling
// Utility to handle async errors in socket event handlers
const asyncHandler = (handler) => {
  return async (...args) => {
    try {
      await handler(...args);
    } catch (error) {
      console.error('Socket event error:', error);
      // The last argument is usually the callback
      const callback = args[args.length - 1];
      if (typeof callback === 'function') {
        callback({ success: false, error: 'An internal server error occurred.' });
      }
    }
  };
};

io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);
  let currentRoom = null;

  // Handle room joining
    socket.on('join-room', asyncHandler(async (url) => {
    try {
      // Leave current room if any
      if (currentRoom) {
        await leaveRoom(currentRoom);
      }

      // Join new room
      currentRoom = url;
      socket.join(url);
      
      // Find or create room in database
      let room = await Room.findOne({ url });
      if (!room) {
        room = new Room({ url });
      }
      
      // Update room data
      room.participants += 1;
      room.lastActive = new Date();
      await room.save();
      
      // Notify room participants
      io.to(url).emit('participant-count', room.participants);
      console.log(`User ${socket.id} joined room: ${url} (${room.participants} participants)`);
    } catch (error) {
      console.error(`Error joining room ${url} for socket ${socket.id}:`, error);
      socket.emit('error', { message: 'Failed to join room', details: error.message });
    }
  }));

  // Handle WebRTC signaling
  socket.on('signal', (data) => {
    console.log(`Signal from ${data.from} to ${data.to || 'all'}`);
    
    // Forward the signal to the target peer or room
    if (data.to) {
      socket.to(data.to).emit('signal', data);
    } else if (currentRoom) {
      socket.to(currentRoom).emit('signal', data);
    }
  });

  // Handle disconnection
    socket.on('disconnect', asyncHandler(async () => {
    console.log(`Disconnected: ${socket.id}`);
    if (currentRoom) {
      await leaveRoom(currentRoom);
    }
  }));

  // Helper function to leave a room
  async function leaveRoom(roomUrl) {
    try {
      // Find the room
      const room = await Room.findOne({ url: roomUrl });
      if (!room) return;
      
      // Update room data
      room.participants -= 1;
      
      // Delete room if empty, otherwise save updated count
      if (room.participants <= 0) {
        await Room.deleteOne({ url: roomUrl });
        console.log(`Room deleted: ${roomUrl}`);
      } else {
        await room.save();
        // Notify remaining participants
        io.to(roomUrl).emit('participant-count', room.participants);
      }
      
      // Leave the Socket.IO room
      socket.leave(roomUrl);
      console.log(`User ${socket.id} left room: ${roomUrl}`);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  }
});

// Start the server
const PORT = process.env.PORT || 2999;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});

// Handle server shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await mongoose.connection.close();
  process.exit(0);
});
