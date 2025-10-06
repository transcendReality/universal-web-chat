/**
 * Babel Configuration
 * 
 * This file configures Babel for transpiling JavaScript code.
 */
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          chrome: '80',
          firefox: '72',
          edge: '80',
        },
        useBuiltIns: 'usage',
        corejs: 3,
      },
    ],
  ],
};
