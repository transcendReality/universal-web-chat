/**
 * Webpack Production Configuration
 * 
 * This configuration extends the base config with production-specific settings.
 */
import { merge } from 'webpack-merge';
import baseConfig from './base.config.js';
import TerserPlugin from 'terser-webpack-plugin';

export default merge(baseConfig, {
  mode: 'production',
  devtool: 'source-map',
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
          compress: {
            drop_console: true,
          },
        },
        extractComments: false,
      }),
    ],
  },
});
