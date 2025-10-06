# Universal Web Chat Browser Extension

A browser extension that enables peer-to-peer chat functionality across all websites. The extension injects a draggable chat interface as an overlay on any web page, allowing users to connect with others visiting the same site.

## Features

- **P2P Communication**: Direct peer-to-peer connections using WebRTC
- **Cross-Browser Compatibility**: Works on Chrome, Firefox, Edge, and Brave
- **Draggable UI**: Movable, resizable chat window
- **Room Management**: Automatic room creation based on website URL
- **WebSocket Fallback**: Reliable communication even when WebRTC is unavailable
- **Shadow DOM**: Style isolation to prevent conflicts with host pages
- **Responsive Design**: Works on different screen sizes

## Project Structure

```
universal-web-chat/
├── src/
│   ├── background/        # Background script/service worker
│   ├── content/           # Content script for UI injection
│   ├── popup/             # Extension popup UI
│   ├── components/        # Vue.js components
│   ├── services/          # Communication services
│   └── utils/             # Utility functions
├── public/                # Static assets
├── webpack/               # Webpack configurations
├── server/                # Signaling server
├── scripts/               # Build scripts
└── dist/                  # Build output (generated)
```

## Technical Implementation

### Module System

The project uses ES Modules consistently throughout the codebase:
- `type: "module"` in package.json
- Import/export syntax exclusively (no require())
- Appropriate file extensions (.js for ES modules)
- ESLint rules to enforce module consistency

### Browser Compatibility

The extension supports multiple browsers with different manifest versions:
- **Chrome/Edge/Brave**: Manifest V3 with service workers
- **Firefox**: Manifest V2 with background scripts
- Browser-specific build pipelines generate appropriate manifests

### P2P Communication

Communication between users is handled through:
- WebRTC for direct peer connections
- WebSocket fallback for browsers with limited WebRTC support
- Room management based on URL patterns
- NAT traversal for reliable connections

### UI Implementation

The user interface is built with:
- Shadow DOM for style isolation
- Draggable, resizable chat window
- Vue.js for component-based UI development
- Responsive design for different screen sizes

## Development

### Prerequisites

- Node.js 14+
- npm 6+

### Installation

1. Clone the repository
   ```
   git clone https://github.com/example/universal-web-chat.git
   cd universal-web-chat
   ```

2. Install dependencies
   ```
   npm install
   ```

### Development Workflow

1. Start development server
   ```
   npm run dev
   ```

2. Build for specific browser
   ```
   npm run build:chrome
   npm run build:firefox
   npm run build:edge
   npm run build:brave
   ```

3. Build for all browsers
   ```
   npm run build:all
   ```

4. Generate manifests only
   ```
   npm run generate-manifests
   ```

5. Run the signaling server
   ```
   npm run server
   ```

### Loading the Extension

#### Chrome/Edge/Brave
1. Go to extensions page (chrome://extensions, edge://extensions, or brave://extensions)
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/chrome` (or `dist/edge`, `dist/brave`) directory

#### Firefox
1. Go to about:debugging
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file in the `dist/firefox` directory

## Key Components

### Background Script

The background script (`src/background/index.js`) handles:
- Extension lifecycle events
- P2P coordination
- Communication between content scripts and popup
- Storage management for user settings

### Content Script

The content script (`src/content/index.js`) handles:
- UI injection and management
- Communication with the background script
- P2P communication through the Communication Manager
- Shadow DOM implementation for style isolation

### P2P Service

The P2P service (`src/services/p2p-service.js`) handles:
- WebRTC peer connections
- Signaling through the central server
- Data transfer between peers
- Connection management

### Communication Manager

The Communication Manager (`src/services/communication-manager.js`) provides:
- A unified interface for P2P and WebSocket communication
- Automatic fallback to WebSocket when WebRTC is unavailable
- Room management based on URL patterns
- Connection status monitoring

### Signaling Server

The signaling server (`server/index.js`) facilitates:
- Peer discovery
- WebRTC signaling
- Room management
- Participant counting

## Best Practices

### Module System Consistency
- Maintain strict consistency in module syntax
- Use ES Modules throughout the project
- Avoid mixing CommonJS and ES Modules

### Browser Extension Manifest
- Use appropriate manifest version for each browser
- Implement browser detection for feature compatibility
- Handle service worker differences between browsers

### Build Process
- Use Webpack for reliable browser extension bundling
- Implement separate build processes for different browsers
- Ensure proper path resolution in build configuration

### Error Handling
- Implement comprehensive error logging
- Provide fallbacks for critical features
- Handle network failures gracefully

### Security Considerations
- Implement content security policies
- Sanitize all user input
- Use secure WebRTC configurations

## License

MIT
