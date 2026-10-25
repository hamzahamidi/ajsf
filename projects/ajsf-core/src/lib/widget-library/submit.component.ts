import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { hasOwn } from '../shared/utility.functions';
import { cloneDeep } from '../shared/clone-deep.function';
import { JsonSchemaFormService } from '../json-schema-form.service';


@Component({
    selector: 'submit-widget',
    template: `
    <div
      [class]="options?.htmlClass || ''">
      <input
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
      [attr.alt]="layoutNode?.type === 'image' ? options?.alt : null"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.required]="options?.required"
      [attr.src]="layoutNode?.type === 'image' ? options?.src : null"
        [class]="options?.fieldHtmlClass || ''"
        [disabled]="controlDisabled"
        [id]="'control' + $safeNavigationMigration(layoutNode?._id)"
        [name]="controlName"
        [type]="$safeNavigationMigration(layoutNode?.type)"
        [value]="controlValue"
        (click)="updateValue($event)">
    </div>`,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SubmitComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  private initialFormValues: any;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private readonly jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.jsf.initializeControl(this);
    this.initialFormValues = cloneDeep(this.jsf.formGroup?.getRawValue());
    if (hasOwn(this.options, 'disabled')) {
      this.controlDisabled = this.options.disabled;
    } else if (this.layoutNode.type !== 'reset' && this.jsf.formOptions.disableInvalidSubmit) {
      this.controlDisabled = !this.jsf.isValid;
      this.jsf.isValidChanges.subscribe(isValid => this.controlDisabled = !isValid);
    }
    this.controlValue ??= this.options.title;
  }

  updateValue(event) {
    if (this.layoutNode.type === 'reset') {
      event.preventDefault();
      this.jsf.formGroup?.reset(cloneDeep(this.initialFormValues));
      if (typeof this.options.onClick === 'function') { this.options.onClick(event); }
      return;
    }
    if (typeof this.options.onClick === 'function') {
      this.options.onClick(event);
      return;
    }
    if (this.layoutNode.type !== 'submit' && this.layoutNode.type !== 'image') {
      this.jsf.updateValue(this, event.target.value);
    }
  }
}
