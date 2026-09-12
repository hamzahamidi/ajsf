import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { JsonSchemaFormService } from '@ajsf/core';

@Component({
    selector: 'primeng-input-widget',
    template: `
    <div [class]="options?.htmlClass || ''" [style.width]="'100%'">
      @if (!options?.notitle) {
        <label
        [attr.for]="'control' + layoutNode?._id">{{options?.title}}</label>
      }
      @if (options?.prefix || options?.fieldAddonLeft) {
        <span
        [innerHTML]="options?.prefix || options?.fieldAddonLeft"></span>
      }
      @if (boundControl) {
        <input pInputText
          [formControl]="formControl"
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [attr.list]="'control' + layoutNode?._id + 'Autocomplete'"
          [attr.maxlength]="options?.maxLength"
          [attr.minlength]="options?.minLength"
          [attr.pattern]="options?.pattern"
          [readonly]="options?.readonly ? 'readonly' : null"
          [id]="'control' + $safeNavigationMigration(layoutNode?._id)"
          [name]="controlName"
          [placeholder]="options?.notitle ? $safeNavigationMigration(options?.placeholder) : $safeNavigationMigration(options?.title)"
          [required]="$safeNavigationMigration(options?.required)"
          [style.width]="'100%'"
          [type]="$safeNavigationMigration(layoutNode?.type)"
          (blur)="options.showErrors = true">
      }
      @if (!boundControl) {
        <input pInputText
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [attr.list]="'control' + layoutNode?._id + 'Autocomplete'"
          [attr.maxlength]="options?.maxLength"
          [attr.minlength]="options?.minLength"
          [attr.pattern]="options?.pattern"
          [disabled]="controlDisabled"
          [id]="'control' + $safeNavigationMigration(layoutNode?._id)"
          [name]="controlName"
          [placeholder]="options?.notitle ? $safeNavigationMigration(options?.placeholder) : $safeNavigationMigration(options?.title)"
          [readonly]="options?.readonly ? 'readonly' : null"
          [required]="$safeNavigationMigration(options?.required)"
          [style.width]="'100%'"
          [type]="$safeNavigationMigration(layoutNode?.type)"
          [value]="controlValue"
          (input)="updateValue($event)"
          (blur)="options.showErrors = true">
      }
      @if (options?.suffix || options?.fieldAddonRight) {
        <span
        [innerHTML]="options?.suffix || options?.fieldAddonRight"></span>
      }
      @if (options?.description && (!options?.showErrors || !options?.errorMessage)) {
        <small
        [innerHTML]="$safeNavigationMigration(options?.description)"></small>
      }
      @if (options?.typeahead?.source) {
        <datalist
          [id]="'control' + $safeNavigationMigration(layoutNode?._id) + 'Autocomplete'">
          @for (word of options?.typeahead?.source; track word) {
            <option
              [value]="word">
            </option>
          }
        </datalist>
      }
    </div>
    @if (options?.showErrors && options?.errorMessage) {
      <div class="p-error"
      [innerHTML]="$safeNavigationMigration(options?.errorMessage)"></div>
    }`,
    styles: [`
    .p-error { font-size: 75%; margin-top: 0.25rem; }
  `],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PrimengInputComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: string;
  controlDisabled = false;
  boundControl = false;
  options: any;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(private jsf: JsonSchemaFormService) {}

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.jsf.initializeControl(this);
    if (!this.options.notitle && !this.options.description && this.options.placeholder) {
      this.options.description = this.options.placeholder;
    }
  }

  updateValue(event) {
    this.jsf.updateValue(this, event.target.value);
  }
}
