import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RadiosComponent } from '@ajsf/core';

/**
 * Bootstrap 4 splits these two ways, so this template does too.
 *
 * Vertical radios take the sibling form, which is what Bootstrap 4
 * documents for .form-check. The horizontal branch splits again on
 * layoutNode.type: radios-inline is .form-check.form-check-inline, the
 * same sibling shape as vertical, while radiobuttons keeps the input
 * inside the label, because Bootstrap 4's toggle buttons are
 * .btn-group-toggle with a nested input and it has no .btn-check. That is
 * deliberate, not a widget that was missed.
 *
 * Template only. No constructor.
 */
@Component({
  selector: 'bootstrap4-radios-widget',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
  template: `
    @if (options?.title) {
      <label
        [attr.for]="'control' + layoutNode?._id"
        [class]="options?.labelHtmlClass || ''"
        [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="options?.title"></label>
    }

    @if (layoutOrientation === 'horizontal') {
      @if (layoutNode?.type === 'radiobuttons') {
        <div [class]="options?.htmlClass || ''">
          @for (radioItem of radiosList; track radioItem) {
            <label
              [attr.for]="'control' + layoutNode?._id + '/' + radioItem?.value"
              [class]="(options?.itemLabelHtmlClass || '') +
                ((controlValue + '' === radioItem?.value + '') ?
                (' ' + (options?.activeClass || '') + ' ' + (options?.style?.selected || '')) :
                (' ' + (options?.style?.unselected || '')))">
              <input type="radio"
                [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
                [attr.readonly]="options?.readonly ? 'readonly' : null"
                [attr.required]="options?.required"
                [checked]="radioItem?.value === controlValue"
                [class]="options?.fieldHtmlClass || ''"
                [disabled]="controlDisabled"
                [id]="'control' + layoutNode?._id + '/' + radioItem?.value"
                [name]="controlName"
                [value]="radioItem?.value"
                (change)="updateValue($event)">
              <span [innerHTML]="radioItem?.name"></span>
            </label>
          }
        </div>
      } @else {
        <div>
          @for (radioItem of radiosList; track radioItem) {
            <div [class]="options?.htmlClass || ''">
              <input type="radio"
                [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
                [attr.readonly]="options?.readonly ? 'readonly' : null"
                [attr.required]="options?.required"
                [checked]="radioItem?.value === controlValue"
                [class]="options?.fieldHtmlClass || ''"
                [disabled]="controlDisabled"
                [id]="'control' + layoutNode?._id + '/' + radioItem?.value"
                [name]="controlName"
                [value]="radioItem?.value"
                (change)="updateValue($event)">
              <label
                [attr.for]="'control' + layoutNode?._id + '/' + radioItem?.value"
                [class]="(options?.itemLabelHtmlClass || '') +
                  ((controlValue + '' === radioItem?.value + '') ?
                  (' ' + (options?.activeClass || '') + ' ' + (options?.style?.selected || '')) :
                  (' ' + (options?.style?.unselected || '')))"
                [innerHTML]="radioItem?.name"></label>
            </div>
          }
        </div>
      }
    }

    @if (layoutOrientation !== 'horizontal') {
      <div>
        @for (radioItem of radiosList; track radioItem) {
          <div [class]="options?.htmlClass || ''">
            <input type="radio"
              [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
              [attr.readonly]="options?.readonly ? 'readonly' : null"
              [attr.required]="options?.required"
              [checked]="radioItem?.value === controlValue"
              [class]="options?.fieldHtmlClass || ''"
              [disabled]="controlDisabled"
              [id]="'control' + layoutNode?._id + '/' + radioItem?.value"
              [name]="controlName"
              [value]="radioItem?.value"
              (change)="updateValue($event)">
            <label
              [attr.for]="'control' + layoutNode?._id + '/' + radioItem?.value"
              [class]="(options?.itemLabelHtmlClass || '') +
                ((controlValue + '' === radioItem?.value + '') ?
                (' ' + (options?.activeClass || '') + ' ' + (options?.style?.selected || '')) :
                (' ' + (options?.style?.unselected || '')))"
              [innerHTML]="radioItem?.name"></label>
          </div>
        }
      </div>
    }`,
})
export class Bootstrap4RadiosComponent extends RadiosComponent {}
