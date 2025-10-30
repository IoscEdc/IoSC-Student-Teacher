// Global test setup
const mongoose = require('mongoose');

// Mock console methods to reduce test output noise
global.console = {
  ...console,
  // Uncomment to silence console.log during tests
  // log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Global test timeout
jest.setTimeout(10000);

// Mock mongoose ObjectId for consistent testing
jest.mock('mongoose', () => ({
  ...jest.requireActual('mongoose'),
  Types: {
    ObjectId: jest.fn().mockImplementation((id) => {
      if (typeof id === 'string') {
        return {
          toString: () => id,
          equals: (other) => id === other.toString()
        };
      }
      return {
        toString: () => 'mocked-object-id',
        equals: (other) => 'mocked-object-id' === other.toString()
      };
    }),
    isValid: jest.fn().mockReturnValue(true)
  }
}));

// Global test utilities
global.testUtils = {
  // Generate mock ObjectId
  mockObjectId: (id = 'mock-id') => ({
    toString: () => id,
    equals: (other) => id === other.toString()
  }),

  // Create mock date
  mockDate: (dateString = '2023-10-15T10:00:00.000Z') => new Date(dateString),

  // Wait for async operations
  wait: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Deep clone object
  deepClone: (obj) => JSON.parse(JSON.stringify(obj))
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});