import '@testing-library/jest-dom';

// Mock browser APIs for testing
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    getURL: jest.fn((path) => `chrome-extension://test-id/${path}`),
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
  },
};

// Mock WebRTC APIs
global.RTCPeerConnection = jest.fn().mockImplementation(() => ({
  createOffer: jest.fn().mockResolvedValue({ type: 'offer', sdp: 'test-sdp' }),
  createAnswer: jest.fn().mockResolvedValue({ type: 'answer', sdp: 'test-sdp' }),
  setLocalDescription: jest.fn().mockResolvedValue(),
  setRemoteDescription: jest.fn().mockResolvedValue(),
  addIceCandidate: jest.fn().mockResolvedValue(),
  onicecandidate: null,
  ondatachannel: null,
  close: jest.fn(),
}));

// Mock Socket.IO - this needs to be done before any imports
jest.mock('socket.io-client', () => ({
  io: jest.fn().mockReturnValue({
    on: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  }),
}));

// Mock SimplePeer
jest.mock('simple-peer', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    signal: jest.fn(),
    send: jest.fn(),
    destroy: jest.fn(),
  }));
});

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
global.sessionStorage = { ...localStorageMock };

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
