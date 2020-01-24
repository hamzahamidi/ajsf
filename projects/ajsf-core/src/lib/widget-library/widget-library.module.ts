import { BASIC_WIDGETS } from './index';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { OrderableDirective } from './orderable.directive';

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  declarations: [...BASIC_WIDGETS, OrderableDirective],
  exports: [...BASIC_WIDGETS, OrderableDirective],
  entryComponents: [...BASIC_WIDGETS]
})
export class WidgetLibraryModule {
}
