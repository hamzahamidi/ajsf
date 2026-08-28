import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import { JsonSchemaFormService } from '@ajsf/core';

@Component({
    selector: 'primeng-input-widget',
    template: `
    <div [class]="options?.htmlClass || ''" [style.width]="'100%'">
      <label *ngIf="!options?.notitle"
        [attr.for]="'control' + layoutNode?._id">{{options?.title}}</label>
      <span *ngIf="options?.prefix || options?.fieldAddonLeft"
        [innerHTML]="options?.prefix || options?.fieldAddonLeft"></span>
      <input pInputText *ngIf="boundControl"
        [formControl]="formControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.list]="'control' + layoutNode?._id + 'Autocomplete'"
        [attr.maxlength]="options?.maxLength"
        [attr.minlength]="options?.minLength"
        [attr.pattern]="options?.pattern"
        [readonly]="options?.readonly ? 'readonly' : null"
        [id]="'control' + layoutNode?._id"
        [name]="controlName"
        [placeholder]="options?.notitle ? options?.placeholder : options?.title"
        [required]="options?.required"
        [style.width]="'100%'"
        [type]="layoutNode?.type"
        (blur)="options.showErrors = true">
      <input pInputText *ngIf="!boundControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.list]="'control' + layoutNode?._id + 'Autocomplete'"
        [attr.maxlength]="options?.maxLength"
        [attr.minlength]="options?.minLength"
        [attr.pattern]="options?.pattern"
        [disabled]="controlDisabled"
        [id]="'control' + layoutNode?._id"
        [name]="controlName"
        [placeholder]="options?.notitle ? options?.placeholder : options?.title"
        [readonly]="options?.readonly ? 'readonly' : null"
        [required]="options?.required"
        [style.width]="'100%'"
        [type]="layoutNode?.type"
        [value]="controlValue"
        (input)="updateValue($event)"
        (blur)="options.showErrors = true">
      <span *ngIf="options?.suffix || options?.fieldAddonRight"
        [innerHTML]="options?.suffix || options?.fieldAddonRight"></span>
      <small *ngIf="options?.description && (!options?.showErrors || !options?.errorMessage)"
        [innerHTML]="options?.description"></small>
    </div>
    <div class="p-error" *ngIf="options?.showErrors && options?.errorMessage"
      [innerHTML]="options?.errorMessage"></div>`,
    styles: [`
    .p-error { font-size: 75%; margin-top: 0.25rem; }
  `],
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
