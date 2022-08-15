import { AbstractControl } from "@angular/forms";
import { buildTitleMap } from "../shared";
import { Component, Input, OnInit } from "@angular/core";
import { JsonSchemaFormService } from "../json-schema-form.service";

@Component({
  // tslint:disable-next-line:component-selector
  selector: "radios-widget",
  template: ` <label
      *ngIf="options?.title"
      [attr.for]="'control' + layoutNode?._id"
      [class]="options?.labelHtmlClass || ''"
      [style.display]="options?.notitle ? 'none' : ''"
      [innerHTML]="options?.title"
    ></label>
    <div *ngFor="let radioItem of radiosList" [class]="options?.htmlClass || ''">
      <input
        type="radio"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [readonly]="options?.readonly ? 'readonly' : null"
        [attr.required]="options?.required"
        [checked]="radioItem?.value === controlValue"
        [class]="options?.fieldHtmlClass || ''"
        [disabled]="controlDisabled || options?.readonly"
        [id]="'control' + layoutNode?._id + '/' + radioItem?.value"
        [name]="controlName"
        [value]="radioItem?.value"
        (change)="updateValue($event)"
      />
      <label
        [attr.for]="'control' + layoutNode?._id + '/' + radioItem?.value"
        [class]="options?.itemLabelHtmlClass || ''"
        [innerHTML]="radioItem?.name"
      >
      </label>
    </div>`,
})
export class RadiosComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  layoutOrientation = "vertical";
  radiosList: any[] = [];
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(private jsf: JsonSchemaFormService) {}

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    if (this.layoutNode.type === "radios-inline" || this.layoutNode.type === "radiobuttons") {
      this.layoutOrientation = "horizontal";
    }
    this.radiosList = buildTitleMap(this.options.titleMap || this.options.enumNames, this.options.enum, true);
    this.jsf.initializeControl(this);
  }

  updateValue(event) {
    this.jsf.updateValue(this, event.target.value);
  }
}
