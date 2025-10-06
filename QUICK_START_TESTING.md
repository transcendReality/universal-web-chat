# Quick Start Testing Guide

This guide will get you up and running with testing the Universal Web Chat extension in under 5 minutes.

## 🚀 Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Signaling Server
```bash
npm run server
```
Keep this running in a terminal window.

### 3. Run Basic Tests
In a new terminal window:

```bash
# Run unit tests
npm run test:unit

# Run integration tests  
npm run test:integration

# Run E2E tests
npm run test:e2e
```

## 🧪 Test Types Explained

| Test Type | Purpose | Command | Speed |
|-----------|---------|---------|-------|
| **Unit Tests** | Test individual components | `npm run test:unit` | ⚡ Fast |
| **Integration Tests** | Test server-client interaction | `npm run test:integration` | 🐌 Medium |
| **E2E Tests** | Test complete user experience | `npm run test:e2e` | 🐌 Slow |

## 🎯 Most Important Tests for Beta

### 1. P2P Connection Test
```bash
npm run test:unit -- --testNamePattern="P2PService"
```
Tests WebRTC peer connections and signaling.

### 2. Server Communication Test
```bash
npm run test:integration -- --testNamePattern="Socket.IO"
```
Tests WebSocket connections and room management.

### 3. Chat UI Test
```bash
npm run test:e2e -- --grep "should display chat window"
```
Tests the chat interface appears and works correctly.

## 🔧 Development Testing Workflow

For active development, use this command to run everything:

```bash
npm run dev:test
```

This starts:
- ✅ Signaling server
- ✅ Chrome extension development build  
- ✅ E2E tests in interactive mode

## 🐛 Debugging Tests

### Unit Test Debugging
```bash
# Run specific test
npm run test:unit -- --testNamePattern="should connect"

# Run with verbose output
npm run test:unit -- --verbose
```

### E2E Test Debugging
```bash
# Run with browser visible
npm run test:e2e:ui

# Run with slow motion
npx playwright test --headed --slowmo=1000
```

## 📊 Test Coverage

Check test coverage:
```bash
npm run test:coverage
```

This generates a coverage report showing which code is tested.

## 🚨 Common Issues & Solutions

### Issue: Tests fail with "Cannot find module"
**Solution:** Run `npm install` to ensure all dependencies are installed.

### Issue: Server tests fail with "Address already in use"
**Solution:** Kill any existing server processes or change the port in `server/index.js`.

### Issue: E2E tests fail with "Target closed"
**Solution:** Run `npx playwright install` to install browser binaries.

### Issue: WebRTC tests fail
**Solution:** Ensure you're running tests in a supported browser environment.

## 📋 Pre-Beta Testing Checklist

Before beta testing, ensure these pass:

- [ ] `npm run test:unit` - All unit tests pass
- [ ] `npm run test:integration` - Server communication works
- [ ] `npm run test:e2e` - User interface functions correctly
- [ ] `npm run test:build` - Extension builds for all browsers
- [ ] `npm run test:coverage` - Coverage is above 80%

## 🎯 Focus Areas for Beta Testing

### Critical Paths to Test:
1. **Connection Establishment**: Users can connect to chat rooms
2. **Message Exchange**: Messages are sent and received correctly
3. **Room Management**: Users join/leave rooms properly
4. **UI Responsiveness**: Chat window is draggable and responsive
5. **Error Handling**: Graceful handling of network failures

### Browser Compatibility:
- [ ] Chrome (Manifest V3)
- [ ] Firefox (Manifest V2)  
- [ ] Edge (Manifest V3)
- [ ] Brave (Manifest V3)

## 📞 Getting Help

If you encounter issues:

1. Check the full `TESTING.md` documentation
2. Look at test logs for specific error messages
3. Use debugging commands above
4. Verify all prerequisites are met

## 🎉 Success!

Once all tests pass, your extension is ready for beta testing! 

The testing framework provides confidence that:
- ✅ Core functionality works
- ✅ Server communication is reliable  
- ✅ User interface is responsive
- ✅ Cross-browser compatibility is maintained
