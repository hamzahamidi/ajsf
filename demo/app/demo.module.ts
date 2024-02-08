import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";
import { RouterModule } from "@angular/router";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { MatLegacyCardModule as MatCardModule } from "@angular/material/legacy-card";
import { MatLegacyCheckboxModule as MatCheckboxModule } from "@angular/material/legacy-checkbox";
import { MatIconModule } from "@angular/material/icon";
import { MatLegacyMenuModule as MatMenuModule } from "@angular/material/legacy-menu";
import { MatLegacySelectModule as MatSelectModule } from "@angular/material/legacy-select";
import { MatToolbarModule } from "@angular/material/toolbar";
import { AceEditorDirective } from "./ace-editor.directive";
import { DemoComponent } from "./demo.component";
import { DemoRootComponent } from "./demo-root.component";
import { routes } from "./demo.routes";
import { JsonSchemaFormModule } from "@ajsf/core";
import { Bootstrap3FrameworkModule } from "@ajsf/bootstrap3";
import { Bootstrap4FrameworkModule } from "@ajsf/bootstrap4";
import { Bootstrap5FrameworkModule } from "@ajsf/bootstrap5";
import { MaterialDesignFrameworkModule } from "@ajsf/material";

@NgModule({
  declarations: [AceEditorDirective, DemoComponent, DemoRootComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    MatMenuModule,
    MatSelectModule,
    MatToolbarModule,
    RouterModule.forRoot(routes),
    Bootstrap3FrameworkModule,
    Bootstrap4FrameworkModule,
    Bootstrap5FrameworkModule,
    MaterialDesignFrameworkModule,
    JsonSchemaFormModule,
  ],
  bootstrap: [DemoRootComponent],
})
export class DemoModule {}
