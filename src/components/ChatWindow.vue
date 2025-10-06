<template>
  <div class="chat-window" :class="{ minimized: isMinimized }" ref="chatWindow">
    <div class="chat-header" @mousedown="startDrag">
      <div class="chat-header-left">
        <span class="connection-indicator" :class="connectionStatus"></span>
        <h3 class="chat-title">{{ title }}</h3>
      </div>
      <div class="chat-controls">
        <button class="chat-control-button settings-button" @click="openSettings">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.14 12.94C19.18 12.64 19.2 12.33 19.2 12C19.2 11.68 19.18 11.36 19.14 11.06L21.16 9.48C21.34 9.34 21.39 9.07 21.28 8.87L19.36 5.55C19.24 5.33 18.99 5.26 18.77 5.33L16.38 6.29C15.88 5.91 15.35 5.59 14.76 5.35L14.4 2.81C14.36 2.57 14.16 2.4 13.92 2.4H10.08C9.84 2.4 9.65 2.57 9.61 2.81L9.25 5.35C8.66 5.59 8.12 5.91 7.63 6.29L5.24 5.33C5.02 5.26 4.77 5.33 4.65 5.55L2.74 8.87C2.62 9.07 2.66 9.34 2.86 9.48L4.88 11.06C4.84 11.36 4.8 11.69 4.8 12C4.8 12.31 4.82 12.64 4.86 12.94L2.84 14.52C2.66 14.66 2.61 14.93 2.72 15.13L4.64 18.45C4.76 18.67 5.01 18.74 5.23 18.67L7.62 17.71C8.12 18.09 8.65 18.41 9.24 18.65L9.6 21.19C9.65 21.43 9.84 21.6 10.08 21.6H13.92C14.16 21.6 14.36 21.43 14.39 21.19L14.75 18.65C15.34 18.41 15.88 18.09 16.37 17.71L18.76 18.67C18.98 18.74 19.23 18.67 19.35 18.45L21.27 15.13C21.39 14.91 21.34 14.66 21.14 14.52L19.14 12.94ZM12 15.6C10.02 15.6 8.4 13.98 8.4 12C8.4 10.02 10.02 8.4 12 8.4C13.98 8.4 15.6 10.02 15.6 12C15.6 13.98 13.98 15.6 12 15.6Z" fill="currentColor"/>
          </svg>
        </button>
        <button class="chat-control-button minimize-button" @click="toggleMinimize">
          <svg v-if="isMinimized" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 13H5V11H19V13Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
    
    <div class="chat-messages" ref="messagesContainer">
      <div 
        v-for="(message, index) in messages" 
        :key="index" 
        :class="['chat-message', message.type, { 'sent': message.isSelf, 'received': !message.isSelf }]"
      >
        <div v-if="message.type === 'user' && !message.isSelf" class="chat-message-sender">
          {{ message.sender }}
        </div>
        <div class="chat-message-content">{{ message.content }}</div>
        <div class="chat-message-time">{{ formatTime(message.timestamp) }}</div>
      </div>
    </div>
    
    <div class="chat-status" v-if="statusMessage">{{ statusMessage }}</div>
    
    <div class="chat-input-area">
      <input 
        type="text" 
        class="chat-input" 
        v-model="inputMessage" 
        @keyup.enter="sendMessage" 
        placeholder="Type a message..." 
        :disabled="!isConnected"
        ref="messageInput"
      >
      <button 
        class="chat-send-button" 
        @click="sendMessage" 
        :disabled="!canSend"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChatWindow',
  props: {
    title: {
      type: String,
      default: 'Universal Web Chat'
    },
    initialMessages: {
      type: Array,
      default: () => []
    },
    connectionStatus: {
      type: String,
      default: 'disconnected' // 'connected', 'connecting', 'disconnected'
    },
    participantCount: {
      type: Number,
      default: 0
    },
    isConnected: {
      type: Boolean,
      default: false
    },
    statusMessage: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      messages: this.initialMessages,
      inputMessage: '',
      isMinimized: false,
      isDragging: false,
      dragOffset: { x: 0, y: 0 },
      position: { x: 0, y: 0 }
    };
  },
  computed: {
    canSend() {
      return this.isConnected && this.inputMessage.trim().length > 0;
    }
  },
  watch: {
    messages() {
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    }
  },
  mounted() {
    // Set initial position
    const container = this.$refs.chatWindow;
    if (container) {
      const rect = container.getBoundingClientRect();
      this.position = {
        x: rect.left,
        y: rect.top
      };
    }
    
    // Add event listeners for dragging
    document.addEventListener('mousemove', this.onDrag);
    document.addEventListener('mouseup', this.stopDrag);
    
    // Focus input when chat is opened
    this.$watch('isMinimized', (newVal) => {
      if (!newVal) {
        this.$nextTick(() => {
          if (this.$refs.messageInput) {
            this.$refs.messageInput.focus();
          }
        });
      }
    });
  },
  beforeUnmount() {
    // Remove event listeners
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.stopDrag);
  },
  methods: {
    sendMessage() {
      if (!this.canSend) return;
      
      const message = this.inputMessage.trim();
      this.inputMessage = '';
      
      // Emit event to parent component
      this.$emit('send-message', message);
    },
    
    addMessage(message) {
      this.messages.push(message);
    },
    
    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    },
    
    formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    
    toggleMinimize() {
      this.isMinimized = !this.isMinimized;
      this.$emit('toggle-minimize', this.isMinimized);
    },
    
    openSettings() {
      this.$emit('open-settings');
    },
    
    startDrag(event) {
      // Only start dragging if clicking on the header (not on buttons)
      if (event.target.closest('.chat-control-button')) {
        return;
      }
      
      this.isDragging = true;
      
      const container = this.$refs.chatWindow;
      const rect = container.getBoundingClientRect();
      
      this.dragOffset = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      
      event.preventDefault();
    },
    
    onDrag(event) {
      if (!this.isDragging) return;
      
      const container = this.$refs.chatWindow;
      if (!container) return;
      
      // Calculate new position
      this.position = {
        x: event.clientX - this.dragOffset.x,
        y: event.clientY - this.dragOffset.y
      };
      
      // Apply new position
      container.style.left = `${this.position.x}px`;
      container.style.top = `${this.position.y}px`;
      
      // Reset right/bottom if left/top are set
      container.style.right = 'auto';
      container.style.bottom = 'auto';
    },
    
    stopDrag() {
      this.isDragging = false;
    },
    
    // Method to be called from parent to clear messages
    clearMessages() {
      this.messages = [];
    }
  }
};
</script>

<style scoped>
.chat-window {
  width: 320px;
  height: 400px;
  display: flex;
  flex-direction: column;
  background-color: var(--background-color, #ffffff);
  border-radius: 12px;
  box-shadow: 0 4px 12px var(--shadow-color, rgba(0, 0, 0, 0.1));
  overflow: hidden;
  transition: all 0.3s ease;
  transform-origin: bottom right;
  position: absolute;
  bottom: 20px;
  right: 20px;
}

.chat-window.minimized {
  transform: scale(0.2);
  opacity: 0.8;
  pointer-events: none;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: var(--primary-color, #4a6ee0);
  color: white;
  cursor: move;
}

.chat-header-left {
  display: flex;
  align-items: center;
}

.chat-title {
  font-weight: 600;
  font-size: 14px;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-controls {
  display: flex;
  gap: 8px;
}

.chat-control-button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.chat-control-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: var(--background-color, #ffffff);
}

.chat-message {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
  animation: fadeIn 0.2s ease-out;
}

.chat-message.sent {
  align-self: flex-end;
  background-color: var(--primary-color, #4a6ee0);
  color: white;
  border-bottom-right-radius: 4px;
}

.chat-message.received {
  align-self: flex-start;
  background-color: var(--secondary-color, #e6eaf7);
  color: var(--text-color, #333333);
  border-bottom-left-radius: 4px;
}

.chat-message.system {
  align-self: center;
  background-color: var(--background-color, #ffffff);
  color: var(--text-color, #333333);
  opacity: 0.7;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  max-width: 90%;
}

.chat-message-sender {
  font-size: 12px;
  margin-bottom: 4px;
  font-weight: 600;
}

.chat-message-time {
  font-size: 10px;
  opacity: 0.7;
  margin-top: 4px;
  text-align: right;
}

.chat-status {
  font-size: 12px;
  padding: 4px 8px;
  text-align: center;
  color: var(--text-color, #333333);
  opacity: 0.7;
  background-color: var(--background-color, #ffffff);
}

.chat-input-area {
  display: flex;
  padding: 12px;
  border-top: 1px solid var(--border-color, #dddddd);
  background-color: var(--background-color, #ffffff);
}

.chat-input {
  flex: 1;
  border: 1px solid var(--border-color, #dddddd);
  border-radius: 20px;
  padding: 8px 12px;
  font-size: 14px;
  outline: none;
  background-color: var(--background-color, #ffffff);
  color: var(--text-color, #333333);
}

.chat-input:focus {
  border-color: var(--primary-color, #4a6ee0);
}

.chat-input:disabled {
  background-color: var(--secondary-color, #e6eaf7);
  cursor: not-allowed;
}

.chat-send-button {
  background-color: var(--primary-color, #4a6ee0);
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  margin-left: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.chat-send-button:hover:not(:disabled) {
  background-color: #3a5dcc;
}

.chat-send-button:disabled {
  background-color: var(--border-color, #dddddd);
  cursor: not-allowed;
}

.connection-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}

.connection-indicator.connected {
  background-color: #4caf50;
}

.connection-indicator.connecting {
  background-color: #ff9800;
}

.connection-indicator.disconnected {
  background-color: #f44336;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Dark theme variables are applied from parent component */
</style>
