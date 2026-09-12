import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CheckboxesComponent } from '@ajsf/core';

/**
 * Bootstrap 4 splits these two ways, so this template does too.
 *
 * Vertical checkboxes take the sibling form, which is what Bootstrap 4
 * documents for .form-check. The horizontal branch serves checkboxes-inline
 * and checkboxbuttons, and keeps the input inside the label: Bootstrap 4's
 * toggle buttons are .btn-group-toggle with a nested input, and it has no
 * .btn-check. That is deliberate, not a widget that was missed.
 *
 * Template only. No constructor.
 */
@Component({
  selector: 'bootstrap4-checkboxes-widget',
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
          <label
            [attr.for]="'control' + layoutNode?._id + '/' + checkboxItem.value"
            [class]="(options?.itemLabelHtmlClass || '') + (checkboxItem.checked ?
              (' ' + (options?.activeClass || '') + ' ' + (options?.style?.selected || '')) :
              (' ' + (options?.style?.unselected || '')))">
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
            <span [innerHTML]="checkboxItem.name"></span>
          </label>
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
export class Bootstrap4CheckboxesComponent extends CheckboxesComponent {}
