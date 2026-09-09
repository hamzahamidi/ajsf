// Zone has to be loaded here because the unit-test builder takes polyfills
// from the buildTarget, and an ng-packagr target has none to take: its schema
// is project, tsConfig, watch and poll, with additionalProperties false. The
// unit-test builder exposes no polyfills option either, so there is nowhere
// else to declare it. See angular/angular-cli#33477.
//
// Load bearing rather than precautionary: without it, 266 of 2156 specs fail
// with NG0908, "In this configuration Angular requires Zone.js", because
// Angular's default change detection is Zone based.
//
// `zone.js/testing` is deliberately not imported. It was, until measuring
// showed it is not needed: this project has no fakeAsync, and the four
// beforeEach(waitForAsync(...)) blocks that wanted a ProxyZone now await
// compileComponents directly. Setup files run after the TestBed is
// initialised anyway, which is too late for its framework patches.
import 'zone.js';
