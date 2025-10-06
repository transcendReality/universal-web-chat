/**
 * Chrome-specific Webpack configuration
 * 
 * This configuration generates the Chrome extension bundle with Manifest V3.
 */
import { merge } from 'webpack-merge';
import path from 'path';
import { fileURLToPath } from 'url';
import baseConfig from './base.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default merge(baseConfig, {
  output: {
    path: path.resolve(__dirname, '../dist/chrome')
  }
});
