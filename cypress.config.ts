// cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // The baseUrl will be set by the test environment (e.g., in package.json scripts)
    // For local running, you might set this to "http://localhost:5173"
    // We will leave it unset to allow for flexibility in CI/CD.
    //
    // The following options have been removed to restore Cypress defaults,
    // which are considered best practice:
    // - `supportFile`: Now defaults to `cypress/support/e2e.ts`, enabling custom commands.
    // - `video`: Now defaults to `true`, enabling video recording for debugging.
    // - `screenshotOnRunFailure`: Now defaults to `true`, enabling screenshots on failure.
  },
});