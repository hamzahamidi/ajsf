import { BASIC_WIDGETS } from "./index";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgModule } from "@angular/core";
import { OrderableDirective } from "./orderable.directive";
import { TextareaAutoresizeDirective } from "./textarea-autoresize.directive";

import { WindowRef } from "./window-ref.service";

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  declarations: [
    ...BASIC_WIDGETS,
    OrderableDirective,
    TextareaAutoresizeDirective,
  ],
  providers: [WindowRef],
  exports: [...BASIC_WIDGETS, OrderableDirective, TextareaAutoresizeDirective],
})
export class WidgetLibraryModule {}
