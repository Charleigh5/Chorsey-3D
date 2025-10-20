// cypress.config.ts

export default {
  e2e: {
    // The baseUrl will be set by the test environment (e.g., in package.json scripts)
    // For local running, you might set this to "http://localhost:5173"
    // We will leave it unset to allow for flexibility in CI/CD.
    supportFile: false,
    video: false,
    screenshotOnRunFailure: false,
  },
};
