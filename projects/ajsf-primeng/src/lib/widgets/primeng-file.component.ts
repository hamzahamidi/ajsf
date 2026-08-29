import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import { JsonSchemaFormService } from '@ajsf/core';

@Component({
    selector: 'primeng-file-widget',
    template: `
    <div [class]="options?.htmlClass || ''" [style.width]="'100%'">
      <label *ngIf="!options?.notitle"
        [attr.for]="'control' + layoutNode?._id">{{options?.title}}</label>

      <p-fileupload
        mode="basic"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [disabled]="controlDisabled || options?.readonly"
        [accept]="options?.accept || ''"
        [chooseLabel]="options?.placeholder || 'Choose'"
        [auto]="true"
        [customUpload]="true"
        (uploadHandler)="onSelect($event)"></p-fileupload>

      <span *ngIf="fileName" class="p-text-secondary" style="margin-left: 0.5rem">
        {{fileName}}</span>

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
export class PrimengFileComponent implements OnInit {
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

  constructor(private jsf: JsonSchemaFormService) {}

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.jsf.initializeControl(this, !this.options.readonly);
  }

  onSelect(event) {
    const file: File = event.files?.[0];
    if (!file) return;
    this.fileName = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      this.options.showErrors = true;
      this.jsf.updateValue(this, reader.result as string);
    };
    reader.readAsDataURL(file);
  }
}
