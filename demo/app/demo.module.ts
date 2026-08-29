import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AceEditorDirective } from './ace-editor.directive';
import { DemoComponent } from './demo.component';
import { DemoRootComponent } from './demo-root.component';
import { routes } from './demo.routes';
import { JsonSchemaFormModule } from '@ajsf/core';
import { Bootstrap4FrameworkModule } from '@ajsf/bootstrap4';
import { Bootstrap3FrameworkModule } from '@ajsf/bootstrap3';
import { Bootstrap5FrameworkModule } from '@ajsf/bootstrap5';
import { MaterialDesignFrameworkModule } from '@ajsf/material';
import { PrimengFrameworkModule } from '@ajsf/primeng';

@NgModule({ declarations: [AceEditorDirective, DemoComponent, DemoRootComponent],
    bootstrap: [DemoRootComponent], imports: [BrowserModule, BrowserAnimationsModule, FormsModule,
        MatButtonModule, MatCardModule, MatCheckboxModule,
        MatIconModule, MatMenuModule, MatSelectModule, MatToolbarModule,
        RouterModule.forRoot(routes, {}),
        Bootstrap4FrameworkModule,
        Bootstrap3FrameworkModule,
        Bootstrap5FrameworkModule,
        MaterialDesignFrameworkModule,
        PrimengFrameworkModule,
        JsonSchemaFormModule], providers: [
        provideHttpClient(withInterceptorsFromDi()),
        providePrimeNG({
            theme: {
                preset: Aura,
                options: { darkModeSelector: '.dark-theme' },
            },
        }),
    ] })

export class DemoModule { }
