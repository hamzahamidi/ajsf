import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RadiosComponent } from '@ajsf/core';

/**
 * Sibling input and label per item, for radios, radios-inline and
 * radiobuttons alike. Bootstrap 5's btn-check idiom is a sibling input too,
 * so all three variants take the same shape.
 *
 * Template only. No constructor.
 */
@Component({
  selector: 'bootstrap5-radios-widget',
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
      <div [class]="options?.htmlClass || ''">
        @for (radioItem of radiosList; track radioItem) {
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
        }
      </div>
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
export class Bootstrap5RadiosComponent extends RadiosComponent {}
