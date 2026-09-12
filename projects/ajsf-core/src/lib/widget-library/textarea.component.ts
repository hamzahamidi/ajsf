import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import { JsonSchemaFormService } from '../json-schema-form.service';


@Component({
    selector: 'textarea-widget',
    template: `
    <div
      [class]="options?.htmlClass || ''">
      @if (options?.title) {
        <label
          [attr.for]="'control' + layoutNode?._id"
          [class]="options?.labelHtmlClass || ''"
          [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="options?.title"></label>
      }
      @if (boundControl) {
        <textarea
          [formControl]="formControl"
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [attr.maxlength]="options?.maxLength"
          [attr.minlength]="options?.minLength"
          [attr.pattern]="options?.pattern"
          [attr.placeholder]="options?.placeholder"
          [attr.readonly]="options?.readonly ? 'readonly' : null"
          [attr.required]="options?.required"
          [class]="options?.fieldHtmlClass || ''"
          [id]="'control' + layoutNode?._id"
        [name]="controlName"></textarea>
      }
      @if (!boundControl) {
        <textarea
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [attr.maxlength]="options?.maxLength"
          [attr.minlength]="options?.minLength"
          [attr.pattern]="options?.pattern"
          [attr.placeholder]="options?.placeholder"
          [attr.readonly]="options?.readonly ? 'readonly' : null"
          [attr.required]="options?.required"
          [class]="options?.fieldHtmlClass || ''"
          [disabled]="controlDisabled"
          [id]="'control' + layoutNode?._id"
          [name]="controlName"
          [value]="controlValue"
        (input)="updateValue($event)">{{controlValue}}</textarea>
      }
    </div>`,
    standalone: false
})
export class TextareaComponent implements OnInit {
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
  }

  updateValue(event) {
    this.jsf.updateValue(this, event.target.value);
  }
}
