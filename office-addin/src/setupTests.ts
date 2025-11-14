import '@testing-library/jest-dom';

// Mock Office.js
global.Office = {
  onReady: jest.fn(() => Promise.resolve({ host: 'Word', platform: 'PC' })),
  context: {
    document: {},
    host: 1, // Word
  },
  HostType: {
    Word: 1,
    Excel: 2,
    PowerPoint: 4,
    Outlook: 8,
    Project: 16,
    Access: 32,
  },
} as any;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
