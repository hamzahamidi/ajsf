import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CheckboxesComponent } from '@ajsf/core';

/**
 * Sibling input and label per item, for checkboxes, checkboxes-inline and
 * checkboxbuttons alike. The horizontal branch splits on layoutNode.type:
 * checkboxbuttons keeps the one shared wrapper, because btn-group belongs on
 * a single element around the whole set and Bootstrap 5's btn-check idiom is
 * a sibling input there too. checkboxes-inline gives each item its own
 * wrapper, because Bootstrap 5 documents one .form-check.form-check-inline
 * per item, not one around the whole set.
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
      @if (layoutNode?.type === 'checkboxbuttons') {
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
      } @else {
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
      }
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
