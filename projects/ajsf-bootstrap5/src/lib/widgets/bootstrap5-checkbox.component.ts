import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CheckboxComponent } from '@ajsf/core';

/**
 * Bootstrap 5 wants the input and label as siblings inside .form-check, and
 * styles the input's state through sibling selectors. The core widget nests
 * the input inside the label, which is the Bootstrap 3 shape.
 *
 * Template only. No constructor: Angular inherits the base's injection
 * through its generated factory, and adding one would break that.
 */
@Component({
  selector: 'bootstrap5-checkbox-widget',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
  template: `
    <div [class]="options?.htmlClass || ''">
      @if (boundControl) {
        <input
          [formControl]="formControl"
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [class]="(options?.fieldHtmlClass || '') + (isChecked ?
            (' ' + (options?.activeClass || '') + ' ' + (options?.style?.selected || '')) :
            (' ' + (options?.style?.unselected || '')))"
          [id]="'control' + layoutNode?._id"
          [name]="controlName"
          [readonly]="options?.readonly ? 'readonly' : null"
          type="checkbox">
      }
      @if (!boundControl) {
        <input
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [checked]="isChecked ? 'checked' : null"
          [class]="(options?.fieldHtmlClass || '') + (isChecked ?
            (' ' + (options?.activeClass || '') + ' ' + (options?.style?.selected || '')) :
            (' ' + (options?.style?.unselected || '')))"
          [disabled]="controlDisabled"
          [id]="'control' + layoutNode?._id"
          [name]="controlName"
          [readonly]="options?.readonly ? 'readonly' : null"
          [value]="controlValue"
          type="checkbox"
          (change)="updateValue($event)">
      }
      <label
        [attr.for]="'control' + layoutNode?._id"
        [class]="options?.itemLabelHtmlClass || ''">
        @if (options?.title) {
          <span
            [style.display]="options?.notitle ? 'none' : ''"
            [innerHTML]="options?.title"></span>
        }
      </label>
    </div>`,
})
export class Bootstrap5CheckboxComponent extends CheckboxComponent {}
