import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import { JsonSchemaFormService } from '@ajsf/core';

@Component({
    selector: 'primeng-chip-list-widget',
    template: `
    <div [class]="options?.htmlClass || ''" [style.width]="'100%'">
      <label *ngIf="!options?.notitle"
        [attr.for]="'control' + layoutNode?._id">{{options?.title}}</label>

      <p-autocomplete
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [inputId]="'control' + layoutNode?._id"
        [disabled]="controlDisabled || options?.readonly"
        [multiple]="true"
        [typeahead]="false"
        [suggestions]="suggestions"
        [placeholder]="options?.placeholder || ''"
        [fluid]="true"
        [ngModel]="controlValue"
        (ngModelChange)="updateValue($event)"
        (completeMethod)="search($event)"
        (onBlur)="options.showErrors = true"></p-autocomplete>

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
export class PrimengChipListComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  suggestions: string[] = [];
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(private jsf: JsonSchemaFormService) {}

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.jsf.initializeControl(this, false);
  }

  search(event) {
    const source: string[] = this.options?.typeahead?.source || [];
    const query = (event.query || '').toLowerCase();
    this.suggestions = query
      ? source.filter(s => s.toLowerCase().includes(query))
      : source.slice();
  }

  updateValue(event) {
    this.options.showErrors = true;
    this.jsf.updateValue(this, event);
  }
}
