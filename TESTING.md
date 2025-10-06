# Testing Guide for Universal Web Chat Extension

This document provides a comprehensive guide for testing the Universal Web Chat browser extension, including unit tests, integration tests, and end-to-end tests.

## Testing Strategy Overview

The testing strategy is designed to ensure reliability and functionality across all components:

- **Unit Tests**: Test individual components and services in isolation
- **Integration Tests**: Test interactions between components and the signaling server
- **End-to-End Tests**: Test the complete user experience with browser automation
- **Build Tests**: Verify that the extension builds correctly for all target browsers

## Prerequisites

Before running tests, ensure you have:

1. Node.js 14+ installed
2. All dependencies installed: `npm install`
3. The signaling server can be started: `npm run server`

## Test Types and Commands

### Unit Tests

Unit tests focus on individual components and services:

```bash
# Run all unit tests
npm run test:unit

# Run unit tests in watch mode
npm run test:unit -- --watch

# Run unit tests with coverage
npm run test:unit -- --coverage
```

**Unit Test Coverage:**
- P2P Service (`src/services/p2p-service.js`)
- Communication Manager (`src/services/communication-manager.js`)
- WebSocket Fallback Service (`src/services/websocket-fallback-service.js`)
- Storage Service (`src/utils/storage-service.js`)
- URL Parser (`src/utils/url-parser.js`)
- Browser Detection (`src/utils/browser-detection.js`)
- Manifest Generator (`src/utils/manifest-generator.js`)

### Integration Tests

Integration tests verify interactions between components and the signaling server:

```bash
# Run integration tests
npm run test:integration

# Run integration tests in watch mode
npm run test:integration -- --watch
```

**Integration Test Coverage:**
- Signaling server WebSocket connections
- Room management functionality
- WebRTC signaling (offer/answer/ICE candidates)
- Error handling and recovery
- Multiple client scenarios

### End-to-End Tests

E2E tests simulate real user interactions using Playwright:

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI mode (interactive)
npm run test:e2e:ui

# Run E2E tests in specific browser
npx playwright test --project=chromium
```

**E2E Test Coverage:**
- Chat window display and interaction
- Message sending and receiving
- Window dragging and resizing
- Minimize/restore functionality
- Connection status display
- Multiple participant scenarios

### Server Tests

Tests specifically for the signaling server:

```bash
# Run server tests
npm run test:server
```

### Build Tests

Verify that the extension builds correctly:

```bash
# Test build for specific browser
npm run test:build chrome
npm run test:build firefox
npm run test:build edge
npm run test:build brave

# Test build for all browsers
npm run test:build
```

### Complete Test Suite

Run all tests in sequence:

```bash
# Run all tests (unit + integration + server)
npm run test:all

# Run everything including E2E tests
npm run test && npm run test:e2e
```

## Development Testing Workflow

For active development, use the combined development and testing workflow:

```bash
# Start development environment with testing
npm run dev:test
```

This command runs:
1. Signaling server (`npm run server`)
2. Chrome extension development build (`npm run dev:chrome`)
3. Playwright E2E tests in UI mode (`npm run test:e2e:ui`)

## Test Environment Setup

### Mock APIs

The testing environment includes comprehensive mocks for:

- **Browser Extension APIs**: `chrome.runtime`, `chrome.storage`, `chrome.tabs`
- **WebRTC APIs**: `RTCPeerConnection`, `RTCDataChannel`
- **Socket.IO**: Client and server connections
- **Local Storage**: Browser storage APIs

### Test Data

Test data is managed through:

- **Fixtures**: Predefined test scenarios and data
- **Factories**: Dynamic test data generation
- **Cleanup**: Automatic cleanup after tests

## Writing New Tests

### Unit Test Structure

```javascript
import { jest } from '@jest/globals';
import YourComponent from '../src/components/your-component.js';

describe('YourComponent', () => {
  let component;

  beforeEach(() => {
    component = new YourComponent();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should perform expected behavior', () => {
    // Arrange
    const input = 'test input';
    
    // Act
    const result = component.process(input);
    
    // Assert
    expect(result).toBe('expected output');
  });
});
```

### Integration Test Structure

```javascript
import { jest } from '@jest/globals';
import request from 'supertest';
import { createServer } from 'http';
import { Server } from 'socket.io';

describe('Integration Test', () => {
  let server;
  let io;

  beforeAll((done) => {
    // Setup test server
    server = createServer();
    io = new Server(server);
    server.listen(0, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  test('should handle integration scenario', async () => {
    // Test implementation
  });
});
```

### E2E Test Structure

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Feature E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/test-page.html');
  });

  test('should perform user action', async ({ page }) => {
    // Navigate and interact
    await page.click('#button');
    
    // Verify results
    await expect(page.locator('#result')).toHaveText('Expected Result');
  });
});
```

## Testing Best Practices

### 1. Test Isolation

- Each test should be independent
- Clean up after each test
- Use fresh instances for each test

### 2. Mock External Dependencies

- Mock browser APIs
- Mock network requests
- Mock time-dependent operations

### 3. Test Error Scenarios

- Test network failures
- Test invalid inputs
- Test edge cases

### 4. Use Descriptive Test Names

```javascript
test('should connect to signaling server when valid URL is provided', () => {
  // Test implementation
});
```

### 5. Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: All critical paths
- **E2E Tests**: All user workflows

## Debugging Tests

### Unit Test Debugging

```bash
# Run specific test with debugging
npm run test:unit -- --testNamePattern="should connect to server"

# Run with verbose output
npm run test:unit -- --verbose
```

### E2E Test Debugging

```bash
# Run E2E tests with debugging
npm run test:e2e:ui

# Run with headed browser
npx playwright test --headed

# Run with slow motion
npx playwright test --headed --slowmo=1000
```

### Server Test Debugging

```bash
# Run server tests with debugging
npm run test:server -- --verbose

# Run specific server test
npm run test:server -- --testNamePattern="should handle connection"
```

## Continuous Integration

The testing setup is designed to work with CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    npm install
    npm run test:all
    npm run test:e2e
```

## Performance Testing

For performance testing, additional tools can be integrated:

- **Lighthouse**: Extension performance metrics
- **WebPageTest**: Real-world performance testing
- **Custom Metrics**: Memory usage, connection time, etc.

## Security Testing

Security testing considerations:

- **Content Security Policy**: Verify CSP compliance
- **Input Validation**: Test for XSS vulnerabilities
- **Data Encryption**: Verify WebRTC encryption
- **Permission Scoping**: Test minimal permission usage

## Troubleshooting

### Common Issues

1. **Tests failing due to timing**: Increase timeouts or add proper waits
2. **Mock not working**: Ensure mocks are set up before imports
3. **E2E tests flaky**: Add retry logic and proper waits
4. **Server tests failing**: Check port conflicts and cleanup

### Getting Help

- Check test logs for detailed error messages
- Use debugging tools for step-by-step analysis
- Review test setup and teardown procedures
- Verify all dependencies are properly installed

## Test Maintenance

Regular maintenance tasks:

- Update test dependencies
- Review and update mocks as APIs change
- Add tests for new features
- Remove obsolete tests
- Update test documentation

This testing strategy ensures the Universal Web Chat extension is reliable, secure, and ready for beta testing and production deployment.
