import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FlexLayoutModule } from '@angular/flex-layout';
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
import { MaterialDesignFrameworkModule } from '@ajsf/material';

@NgModule({
  declarations: [AceEditorDirective, DemoComponent, DemoRootComponent],
  imports: [
    BrowserModule, BrowserAnimationsModule, FlexLayoutModule, FormsModule,
    HttpClientModule, MatButtonModule, MatCardModule, MatCheckboxModule,
    MatIconModule, MatMenuModule, MatSelectModule, MatToolbarModule,
    RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' }),
    Bootstrap4FrameworkModule,
    Bootstrap3FrameworkModule,
    MaterialDesignFrameworkModule,
    JsonSchemaFormModule
  ],
  bootstrap: [DemoRootComponent]
})

export class DemoModule { }
