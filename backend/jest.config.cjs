module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src/tests"],
  testMatch: ["**/*.test.ts"],
  setupFiles: ["<rootDir>/src/tests/setup-env.ts"],
  maxWorkers: 2,
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest"],
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.test.ts", "!src/index.ts"],
};
