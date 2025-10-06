module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],
  testTimeout: 10000,
};
