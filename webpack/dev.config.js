/**
 * Webpack Development Configuration
 * 
 * This configuration extends the base config with development-specific settings.
 */
import { merge } from 'webpack-merge';
import baseConfig from './base.config.js';

export default merge(baseConfig, {
  mode: 'development',
  devtool: 'inline-source-map',
  watch: true,
  watchOptions: {
    ignored: /node_modules/
  }
});
