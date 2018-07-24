import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../../json-schema-form.service';
import { hasOwn } from '../../shared/utility.functions';

@Component({
  selector: 'material-button-widget',
  template: `
    <div class="button-row" [class]="options?.htmlClass || ''">
      <button mat-raised-button
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [color]="options?.color || 'primary'"
        [disabled]="controlDisabled || options?.readonly"
        [id]="'control' + layoutNode?._id"
        [name]="controlName"
        [type]="layoutNode?.type"
        [value]="controlValue"
        (click)="updateValue($event)">
        <mat-icon *ngIf="options?.icon" class="mat-24">{{options?.icon}}</mat-icon>
        <span *ngIf="options?.title" [innerHTML]="options?.title"></span>
      </button>
    </div>`,
    styles: [` button { margin-top: 10px; } `],
})
export class MaterialButtonComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.jsf.initializeControl(this);
    if (hasOwn(this.options, 'disabled')) {
      this.controlDisabled = this.options.disabled;
    } else if (this.jsf.formOptions.disableInvalidSubmit) {
      this.controlDisabled = !this.jsf.isValid;
      this.jsf.isValidChanges.subscribe(isValid => this.controlDisabled = !isValid);
    }
  }

  updateValue(event) {
    if (typeof this.options.onClick === 'function') {
      this.options.onClick(event);
    } else {
      this.jsf.updateValue(this, event.target.value);
    }
  }
}
