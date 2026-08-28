import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import { JsonSchemaFormService, buildTitleMap } from '@ajsf/core';

@Component({
    selector: 'primeng-radios-widget',
    template: `
    <div>
      <div *ngIf="options?.title">
        <label
          [attr.for]="'control' + layoutNode?._id"
          [class]="options?.labelHtmlClass || ''"
          [style.display]="options?.notitle ? 'none' : ''"
          [innerHTML]="options?.title"></label>
      </div>
      <div [style.flex-direction]="flexDirection" style="display: inline-flex">
        <div *ngFor="let radioItem of radiosList" style="margin: 2px">
          <p-radiobutton *ngIf="boundControl"
            [formControl]="formControl"
            [value]="radioItem?.value"
            [name]="controlName"
            [inputId]="'control' + layoutNode?._id + '/' + radioItem?.name"
            (onBlur)="options.showErrors = true">
          </p-radiobutton>
          <p-radiobutton *ngIf="!boundControl"
            [name]="controlName"
            [value]="radioItem?.value"
            [disabled]="controlDisabled || options?.readonly"
            [ngModel]="controlValue"
            [inputId]="'control' + layoutNode?._id + '/' + radioItem?.name"
            (onClick)="updateValue(radioItem?.value)">
          </p-radiobutton>
          <label [for]="'control' + layoutNode?._id + '/' + radioItem?.name">
            <span [innerHTML]="radioItem?.name"></span>
          </label>
        </div>
      </div>
      <div class="p-error" *ngIf="options?.showErrors && options?.errorMessage"
        [innerHTML]="options?.errorMessage"></div>
    </div>`,
    styles: [`
    .p-error { font-size: 75%; margin-top: 0.25rem; }
  `],
    standalone: false
})
export class PrimengRadiosComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  flexDirection = 'column';
  radiosList: any[] = [];
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(private jsf: JsonSchemaFormService) {}

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    if (this.layoutNode.type === 'radios-inline') {
      this.flexDirection = 'row';
    }
    this.radiosList = buildTitleMap(
      this.options.titleMap || this.options.enumNames,
      this.options.enum, true
    );
    this.jsf.initializeControl(this, !this.options.readonly);
  }

  updateValue(value) {
    this.options.showErrors = true;
    this.jsf.updateValue(this, value);
  }
}
