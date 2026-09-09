// Same reason as @ajsf/core: the unit-test builder takes polyfills from the
// buildTarget, and an ng-packagr target has none to take, so Zone is loaded
// here. Without it Angular's Zone-based change detection fails with NG0908.
// See angular/angular-cli#33477.
import 'zone.js';
