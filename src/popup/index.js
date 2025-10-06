/**
 * Popup Entry Point
 * 
 * This is the main entry point for the popup UI.
 * It initializes Vue and mounts the App component.
 */
import { createApp } from 'vue';
import App from './App.vue';

// Create and mount Vue app
const app = createApp(App);
app.mount('#app');
