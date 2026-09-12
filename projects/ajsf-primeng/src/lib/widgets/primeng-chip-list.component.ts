import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { JsonSchemaFormService } from '@ajsf/core';

@Component({
    selector: 'primeng-chip-list-widget',
    template: `
    <div [class]="options?.htmlClass || ''" [style.width]="'100%'">
      @if (!options?.notitle) {
        <label
        [attr.for]="'control' + layoutNode?._id">{{options?.title}}</label>
      }
    
      <p-autocomplete
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [inputId]="'control' + $safeNavigationMigration(layoutNode?._id)"
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
    
      @if (options?.description && (!options?.showErrors || !options?.errorMessage)) {
        <small
        [innerHTML]="$safeNavigationMigration(options?.description)"></small>
      }
    </div>
    @if (options?.showErrors && options?.errorMessage) {
      <div class="p-error"
      [innerHTML]="$safeNavigationMigration(options?.errorMessage)"></div>
    }`,
    styles: [`
    .p-error { font-size: 75%; margin-top: 0.25rem; }
  `],
    changeDetection: ChangeDetectionStrategy.Eager,
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
    const tags: string[] = Array.isArray(event) ? event : [];
    this.controlValue = tags;
    this.jsf.updateArrayCheckboxList(
      this, tags.map(value => ({checked: true, value}))
    );
  }
}
