import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CheckboxesComponent } from '@ajsf/core';

/**
 * Siblings, except checkboxbuttons: Bootstrap 4 has no .btn-check, so its toggle
 * buttons keep the nested input .btn-group-toggle documents.
 *
 * Template only: a constructor would break the inherited injection factory.
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
      @if (layoutNode?.type === 'checkboxbuttons') {
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
export class Bootstrap4CheckboxesComponent extends CheckboxesComponent {}
