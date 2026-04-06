import {enableProdMode, importProvidersFrom, provideZoneChangeDetection} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {environment} from './environments/environment';
import {BrowserModule, bootstrapApplication} from '@angular/platform-browser';
import {provideAnimations} from '@angular/platform-browser/animations';
import {FormsModule} from '@angular/forms';
import {withInterceptorsFromDi, provideHttpClient} from '@angular/common/http';
import {provideRouter} from '@angular/router';
import {routes} from './app/demo.routes';
import {Bootstrap5Framework} from '@ajsf/bootstrap5';

import {Framework, JsonSchemaFormComponent} from '@ajsf/core';
import {DemoRootComponent} from './app/demo-root.component';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(DemoRootComponent, {
  providers: [
    provideZoneChangeDetection(),
    importProvidersFrom(
      BrowserModule,
      FormsModule,

      JsonSchemaFormComponent,
    ),
    {provide: Framework, useClass: Bootstrap5Framework},

    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(routes),
  ],
});
