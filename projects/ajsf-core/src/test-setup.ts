// Zone has to be loaded here because the unit-test builder takes polyfills
// from the buildTarget, and an ng-packagr target has none to take: its schema
// is project, tsConfig, watch and poll, with additionalProperties false. The
// unit-test builder exposes no polyfills option either, so there is nowhere
// else to declare it. See angular/angular-cli#33477.
//
// It is load bearing rather than precautionary: removing this file fails 266
// of 2156 specs with NG0908, "In this configuration Angular requires Zone.js",
// because Angular's default change detection is Zone based. Setup files run
// after the TestBed is initialised and before any spec, which is early enough.
import 'zone.js';
import 'zone.js/testing';
