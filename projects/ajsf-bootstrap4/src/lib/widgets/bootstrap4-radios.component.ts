import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RadiosComponent } from '@ajsf/core';

/**
 * Siblings, except radiobuttons: Bootstrap 4 has no .btn-check, so its toggle
 * buttons keep the nested input .btn-group-toggle documents.
 *
 * Template only: a constructor would break the inherited injection factory.
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
