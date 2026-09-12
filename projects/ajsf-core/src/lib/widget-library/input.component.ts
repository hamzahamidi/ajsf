import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { JsonSchemaFormService } from '../json-schema-form.service';


@Component({
    selector: 'input-widget',
    template: `
    <div [class]="options?.htmlClass || ''">
      @if (options?.title) {
        <label
          [attr.for]="'control' + layoutNode?._id"
          [class]="options?.labelHtmlClass || ''"
          [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="$safeNavigationMigration(options?.title)"></label>
      }
      @if (boundControl) {
        <input
          [formControl]="formControl"
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [attr.list]="'control' + layoutNode?._id + 'Autocomplete'"
          [attr.maxlength]="options?.maxLength"
          [attr.minlength]="options?.minLength"
          [attr.pattern]="options?.pattern"
          [attr.placeholder]="options?.placeholder"
          [attr.required]="options?.required"
          [class]="options?.fieldHtmlClass || ''"
          [id]="'control' + $safeNavigationMigration(layoutNode?._id)"
          [name]="controlName"
          [readonly]="options?.readonly ? 'readonly' : null"
          [type]="$safeNavigationMigration(layoutNode?.type)">
      }
      @if (!boundControl) {
        <input
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [attr.list]="'control' + layoutNode?._id + 'Autocomplete'"
          [attr.maxlength]="options?.maxLength"
          [attr.minlength]="options?.minLength"
          [attr.pattern]="options?.pattern"
          [attr.placeholder]="options?.placeholder"
          [attr.required]="options?.required"
          [class]="options?.fieldHtmlClass || ''"
          [disabled]="controlDisabled"
          [id]="'control' + $safeNavigationMigration(layoutNode?._id)"
          [name]="controlName"
          [readonly]="options?.readonly ? 'readonly' : null"
          [type]="$safeNavigationMigration(layoutNode?.type)"
          [value]="controlValue"
          (input)="updateValue($event)">
      }
      @if (options?.typeahead?.source) {
        <datalist
          [id]="'control' + $safeNavigationMigration(layoutNode?._id) + 'Autocomplete'">
          @for (word of options?.typeahead?.source; track word) {
            <option [value]="word">
            }
          </datalist>
        }
      </div>`,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class InputComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: string;
  controlDisabled = false;
  boundControl = false;
  options: any;
  autoCompleteList: string[] = [];
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.jsf.initializeControl(this);
  }

  updateValue(event) {
    this.jsf.updateValue(this, event.target.value);
  }
}
