// jest.setup.ts
// FIX: Import `expect` from `@jest/globals` to resolve the TypeScript error.
import { expect } from '@jest/globals';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);