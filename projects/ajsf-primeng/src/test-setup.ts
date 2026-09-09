// Same reason as @ajsf/core: the unit-test builder takes polyfills from the
// buildTarget, and an ng-packagr target has none to take, so Zone is loaded
// here. Without it Angular's Zone-based change detection fails with NG0908.
// See angular/angular-cli#33477.
import 'zone.js';

// jsdom 29 does not implement ResizeObserver, and PrimeNG's tab components
// construct one, so seven corpus schemas that render fine in a browser threw
// "ResizeObserver is not defined" instead. The baseline records a real control
// count and no error for all seven, so this closes an environment gap rather
// than papering over a regression: re-recording would have pinned the throw as
// expected and hidden any later real breakage in those schemas.
//
// A no-op is enough. Nothing under test reads a measurement back; the
// components only need the constructor and its methods to exist.
if (!('ResizeObserver' in globalThis)) {
  (globalThis as any).ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}
