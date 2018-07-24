import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../../json-schema-form.service';
import { buildTitleMap } from '../../shared';

@Component({
  selector: 'material-radios-widget',
  template: `
    <div>
      <div *ngIf="options?.title">
        <label
          [attr.for]="'control' + layoutNode?._id"
          [class]="options?.labelHtmlClass || ''"
          [style.display]="options?.notitle ? 'none' : ''"
          [innerHTML]="options?.title"></label>
      </div>
      <mat-radio-group *ngIf="boundControl"
        [formControl]="formControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.required]="options?.required"
        [style.flex-direction]="flexDirection"
        [name]="controlName"
        (blur)="options.showErrors = true">
        <mat-radio-button *ngFor="let radioItem of radiosList"
          [id]="'control' + layoutNode?._id + '/' + radioItem?.name"
          [value]="radioItem?.value">
          <span [innerHTML]="radioItem?.name"></span>
        </mat-radio-button>
      </mat-radio-group>
      <mat-radio-group *ngIf="!boundControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.required]="options?.required"
        [style.flex-direction]="flexDirection"
        [disabled]="controlDisabled || options?.readonly"
        [name]="controlName"
        [value]="controlValue">
        <mat-radio-button *ngFor="let radioItem of radiosList"
          [id]="'control' + layoutNode?._id + '/' + radioItem?.name"
          [value]="radioItem?.value"
          (click)="updateValue(radioItem?.value)">
          <span [innerHTML]="radioItem?.name"></span>
        </mat-radio-button>
      </mat-radio-group>
      <mat-error *ngIf="options?.showErrors && options?.errorMessage"
        [innerHTML]="options?.errorMessage"></mat-error>
    </div>`,
  styles: [`
    mat-radio-group { display: inline-flex; }
    mat-radio-button { margin: 2px; }
    mat-error { font-size: 75%; }
  `]
})
export class MaterialRadiosComponent implements OnInit {
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

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

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
