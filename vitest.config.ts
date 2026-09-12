import { defineConfig } from 'vitest/config';

// Read by the unit-test builder through `runnerConfig` in angular.json.
//
// restoreMocks is the whole reason this file exists. Vitest leaves a
// vi.spyOn in place between tests, and spying on an already spied method
// returns the same spy, so its call counts accumulate: four console.error
// assertions in utility.functions.spec.ts saw 6, 8, 12 and 14 calls where
// they expected 2, 2, 4 and 2. Restoring from a setup file's afterEach did
// not hold once coverage was enabled.
export default defineConfig({
  test: {
    restoreMocks: true,
  },
});
