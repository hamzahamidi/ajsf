import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { JsonSchemaFormService, buildTitleMap } from '@ajsf/core';


@Component({
    selector: 'material-radios-widget',
    template: `
    <div>
      @if (options?.title) {
        <div>
          <label
            [attr.for]="'control' + layoutNode?._id"
            [class]="options?.labelHtmlClass || ''"
            [style.display]="options?.notitle ? 'none' : ''"
          [innerHTML]="$safeNavigationMigration(options?.title)"></label>
        </div>
      }
      @if (boundControl) {
        <mat-radio-group
          [formControl]="formControl"
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [attr.readonly]="options?.readonly ? 'readonly' : null"
          [attr.required]="options?.required"
          [style.flex-direction]="flexDirection"
          [name]="controlName"
          (blur)="options.showErrors = true">
          @for (radioItem of radiosList; track radioItem) {
            <mat-radio-button
              [id]="'control' + $safeNavigationMigration(layoutNode?._id) + '/' + $safeNavigationMigration(radioItem?.name)"
              [value]="$safeNavigationMigration(radioItem?.value)">
              <span [innerHTML]="$safeNavigationMigration(radioItem?.name)"></span>
            </mat-radio-button>
          }
        </mat-radio-group>
      }
      @if (!boundControl) {
        <mat-radio-group
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [attr.readonly]="options?.readonly ? 'readonly' : null"
          [attr.required]="options?.required"
          [style.flex-direction]="flexDirection"
          [disabled]="controlDisabled || options?.readonly"
          [name]="controlName"
          [value]="controlValue">
          @for (radioItem of radiosList; track radioItem) {
            <mat-radio-button
              [id]="'control' + $safeNavigationMigration(layoutNode?._id) + '/' + $safeNavigationMigration(radioItem?.name)"
              [value]="$safeNavigationMigration(radioItem?.value)"
              (click)="updateValue($safeNavigationMigration(radioItem?.value))">
              <span [innerHTML]="$safeNavigationMigration(radioItem?.name)"></span>
            </mat-radio-button>
          }
        </mat-radio-group>
      }
      @if (options?.showErrors && options?.errorMessage) {
        <mat-error
        [innerHTML]="$safeNavigationMigration(options?.errorMessage)"></mat-error>
      }
    </div>`,
    styles: [`
    /* Element selectors, not internal classes: both still exist under MDC. */
    mat-radio-group { display: inline-flex; }
    mat-radio-button { margin: 2px; }
    mat-error { font-size: 75%; }
  `],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
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
