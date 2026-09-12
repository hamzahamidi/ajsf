import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import { JsonSchemaFormService } from '@ajsf/core';

@Component({
    selector: 'primeng-textarea-widget',
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
        <textarea pTextarea
          [formControl]="formControl"
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [attr.maxlength]="options?.maxLength"
          [attr.minlength]="options?.minLength"
          [attr.pattern]="options?.pattern"
          [required]="options?.required"
          [id]="'control' + layoutNode?._id"
          [name]="controlName"
          [placeholder]="options?.notitle ? options?.placeholder : options?.title"
          [readonly]="options?.readonly ? 'readonly' : null"
          [style.width]="'100%'"
          [autoResize]="options?.autosize"
        (blur)="options.showErrors = true"></textarea>
      }
      @if (!boundControl) {
        <textarea pTextarea
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [attr.maxlength]="options?.maxLength"
          [attr.minlength]="options?.minLength"
          [attr.pattern]="options?.pattern"
          [required]="options?.required"
          [disabled]="controlDisabled"
          [id]="'control' + layoutNode?._id"
          [name]="controlName"
          [placeholder]="options?.notitle ? options?.placeholder : options?.title"
          [readonly]="options?.readonly ? 'readonly' : null"
          [style.width]="'100%'"
          [value]="controlValue"
          [autoResize]="options?.autosize"
          (input)="updateValue($event)"
        (blur)="options.showErrors = true"></textarea>
      }
      @if (options?.suffix || options?.fieldAddonRight) {
        <span
        [innerHTML]="options?.suffix || options?.fieldAddonRight"></span>
      }
      @if (options?.description && (!options?.showErrors || !options?.errorMessage)) {
        <small
        [innerHTML]="options?.description"></small>
      }
    </div>
    @if (options?.showErrors && options?.errorMessage) {
      <div class="p-error"
      [innerHTML]="options?.errorMessage"></div>
    }`,
    styles: [`
    .p-error { font-size: 75%; margin-top: 0.25rem; }
  `],
    standalone: false
})
export class PrimengTextareaComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
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
