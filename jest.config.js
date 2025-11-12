const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "node", // Use node environment for API route tests
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  // Enable automatic mocking for __mocks__ directory
  automock: false,
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)",
  ],
  collectCoverageFrom: [
    "app/api/**/*.{js,ts}",
    "lib/**/*.{js,ts}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
  ],
  testTimeout: 30000,
  // Use custom reporter to avoid strip-ansi issues with Node.js v23
  reporters: ["<rootDir>/jest-reporter.js"],
  // Use simpler output
  verbose: false,
  // Disable watch mode features that cause issues
  watchman: false,
  // Disable status updates that cause issues
  notify: false,
  // Force Jest to exit after tests complete (handles open handles)
  forceExit: true,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
