import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { JsonSchemaFormService } from '@ajsf/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

@Component({
    selector: 'material-chip-list-widget',
    template: `
    <mat-form-field
      [appearance]="options?.appearance || 'fill'"
      [class]="options?.htmlClass || ''"
      [floatLabel]="options?.floatLabel || 'auto'"
      [style.width]="'100%'">
      <mat-label *ngIf="!options?.notitle">{{options?.title}}</mat-label>
      <mat-chip-grid #chipGrid
        [attr.aria-label]="options?.title"
        [disabled]="controlDisabled || options?.readonly">
        <mat-chip-row *ngFor="let tag of tags; let i = index"
          (removed)="remove(i)">
          {{tag}}
          <button matChipRemove aria-label="Remove">
            <mat-icon>cancel</mat-icon>
          </button>
        </mat-chip-row>
      </mat-chip-grid>
      <input [matChipInputFor]="chipGrid"
        [matChipInputSeparatorKeyCodes]="separatorKeyCodes"
        [matChipInputAddOnBlur]="true"
        [placeholder]="options?.placeholder || ''"
        (matChipInputTokenEnd)="add($event)">
      <mat-hint *ngIf="options?.description && (!options?.showErrors || !options?.errorMessage)"
        align="end" [innerHTML]="options?.description"></mat-hint>
    </mat-form-field>
    <mat-error *ngIf="options?.showErrors && options?.errorMessage"
      [innerHTML]="options?.errorMessage"></mat-error>`,
    styles: [`
    mat-error { font-size: 75%; margin-top: -1rem; margin-bottom: 0.5rem; }
  `],
    standalone: false
})
export class MaterialChipListComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  tags: string[] = [];
  separatorKeyCodes = [ENTER, COMMA];
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.jsf.initializeControl(this, false);
    this.tags = Array.isArray(this.controlValue) ? [...this.controlValue] : [];
  }

  add(event) {
    const value = (event.value || '').trim();
    if (value) {
      this.tags.push(value);
      this.syncFormArray();
    }
    event.chipInput.clear();
  }

  remove(index: number) {
    this.tags.splice(index, 1);
    this.syncFormArray();
  }

  private syncFormArray() {
    this.jsf.updateArrayCheckboxList(
      this, this.tags.map(value => ({checked: true, value}))
    );
  }
}
