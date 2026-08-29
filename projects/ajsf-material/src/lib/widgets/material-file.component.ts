import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import { JsonSchemaFormService } from '@ajsf/core';

@Component({
    selector: 'material-file-widget',
    template: `
    <div [class]="options?.htmlClass || ''" [style.width]="'100%'">
      <label *ngIf="!options?.notitle"
        [class]="options?.labelHtmlClass || ''">{{options?.title}}</label>
      <div>
        <button mat-raised-button type="button"
          [disabled]="controlDisabled || options?.readonly"
          (click)="fileInput.click()">
          <mat-icon>upload_file</mat-icon>
          {{options?.buttonLabel || 'Choose File'}}
        </button>
        <span style="margin-left: 8px">{{fileName || 'No file chosen'}}</span>
        <input #fileInput type="file"
          [attr.accept]="options?.accept || null"
          [hidden]="true"
          (change)="onFileSelect($event)">
      </div>
      <mat-hint *ngIf="options?.description && (!options?.showErrors || !options?.errorMessage)"
        [innerHTML]="options?.description"
        style="display:block; font-size:75%; color:rgba(0,0,0,.6); margin-top:4px;"></mat-hint>
    </div>
    <mat-error *ngIf="options?.showErrors && options?.errorMessage"
      [innerHTML]="options?.errorMessage"></mat-error>`,
    styles: [`
    mat-error { font-size: 75%; margin-top: -1rem; margin-bottom: 0.5rem; }
  `],
    standalone: false
})
export class MaterialFileComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  fileName = '';
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

  onFileSelect(event) {
    const file: File = event.target?.files?.[0];
    if (!file) { return; }
    this.fileName = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      this.jsf.updateValue(this, reader.result as string);
    };
    reader.readAsDataURL(file);
  }
}
