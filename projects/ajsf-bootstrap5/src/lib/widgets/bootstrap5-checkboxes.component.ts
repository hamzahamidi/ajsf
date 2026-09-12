import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CheckboxesComponent } from '@ajsf/core';

/**
 * Sibling input and label per item, for checkboxes, checkboxes-inline and
 * checkboxbuttons alike. Bootstrap 5 replaced the nested toggle-button idiom
 * with btn-check, so all three variants take the same shape here.
 *
 * activeClass and style.selected stay on the label, where the core widget
 * puts them, so the button idiom keeps working.
 *
 * Template only. No constructor.
 */
@Component({
  selector: 'bootstrap5-checkboxes-widget',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
  template: `
    @if (options?.title) {
      <label
        [class]="options?.labelHtmlClass || ''"
        [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="options?.title"></label>
    }

    @if (layoutOrientation === 'horizontal') {
      <div [class]="options?.htmlClass || ''">
        @for (checkboxItem of checkboxList; track checkboxItem) {
          <input type="checkbox"
            [attr.required]="options?.required"
            [checked]="checkboxItem.checked"
            [class]="options?.fieldHtmlClass || ''"
            [disabled]="controlDisabled"
            [id]="'control' + layoutNode?._id + '/' + checkboxItem.value"
            [name]="checkboxItem?.name"
            [readonly]="options?.readonly ? 'readonly' : null"
            [value]="checkboxItem.value"
            (change)="updateValue($event, checkboxItem)">
          <label
            [attr.for]="'control' + layoutNode?._id + '/' + checkboxItem.value"
            [class]="(options?.itemLabelHtmlClass || '') + (checkboxItem.checked ?
              (' ' + (options?.activeClass || '') + ' ' + (options?.style?.selected || '')) :
              (' ' + (options?.style?.unselected || '')))"
            [innerHTML]="checkboxItem.name"></label>
        }
      </div>
    }

    @if (layoutOrientation === 'vertical') {
      <div>
        @for (checkboxItem of checkboxList; track checkboxItem) {
          <div [class]="options?.htmlClass || ''">
            <input type="checkbox"
              [attr.required]="options?.required"
              [checked]="checkboxItem.checked"
              [class]="options?.fieldHtmlClass || ''"
              [disabled]="controlDisabled"
              [id]="'control' + layoutNode?._id + '/' + checkboxItem.value"
              [name]="checkboxItem?.name"
              [readonly]="options?.readonly ? 'readonly' : null"
              [value]="checkboxItem.value"
              (change)="updateValue($event, checkboxItem)">
            <label
              [attr.for]="'control' + layoutNode?._id + '/' + checkboxItem.value"
              [class]="(options?.itemLabelHtmlClass || '') + (checkboxItem.checked ?
                (' ' + (options?.activeClass || '') + ' ' + (options?.style?.selected || '')) :
                (' ' + (options?.style?.unselected || '')))"
              [innerHTML]="checkboxItem.name"></label>
          </div>
        }
      </div>
    }`,
})
export class Bootstrap5CheckboxesComponent extends CheckboxesComponent {}
