import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { JsonSchemaFormService } from '@ajsf/core';

@Component({
    selector: 'material-checkbox-widget',
    template: `
    @if (boundControl && !showSlideToggle) {
      <mat-checkbox
        [formControl]="formControl"
        align="left"
        [color]="options?.color || 'primary'"
        [id]="'control' + $safeNavigationMigration(layoutNode?._id)"
        labelPosition="after"
        [name]="controlName"
        (blur)="options.showErrors = true">
        @if (options?.title) {
          <span
            class="checkbox-name"
            [style.display]="options?.notitle ? 'none' : ''"
          [innerHTML]="$safeNavigationMigration(options?.title)"></span>
        }
      </mat-checkbox>
    }
    @if (!boundControl && !showSlideToggle) {
      <mat-checkbox
        align="left"
        [color]="options?.color || 'primary'"
        [disabled]="controlDisabled || options?.readonly"
        [id]="'control' + $safeNavigationMigration(layoutNode?._id)"
        labelPosition="after"
        [name]="controlName"
        [checked]="isChecked"
        (blur)="options.showErrors = true"
        (change)="updateValue($event)">
        @if (options?.title) {
          <span
            class="checkbox-name"
            [style.display]="options?.notitle ? 'none' : ''"
          [innerHTML]="$safeNavigationMigration(options?.title)"></span>
        }
      </mat-checkbox>
    }
    @if (boundControl && showSlideToggle) {
      <mat-slide-toggle
        [formControl]="formControl"
        align="left"
        [color]="options?.color || 'primary'"
        [id]="'control' + $safeNavigationMigration(layoutNode?._id)"
        labelPosition="after"
        [name]="controlName"
        (blur)="options.showErrors = true">
        @if (options?.title) {
          <span
            class="checkbox-name"
            [style.display]="options?.notitle ? 'none' : ''"
          [innerHTML]="$safeNavigationMigration(options?.title)"></span>
        }
      </mat-slide-toggle>
    }
    @if (!boundControl && showSlideToggle) {
      <mat-slide-toggle
        align="left"
        [color]="options?.color || 'primary'"
        [disabled]="controlDisabled || options?.readonly"
        [id]="'control' + $safeNavigationMigration(layoutNode?._id)"
        labelPosition="after"
        [name]="controlName"
        [checked]="isChecked"
        (blur)="options.showErrors = true"
        (change)="updateValue($event)">
        @if (options?.title) {
          <span
            class="checkbox-name"
            [style.display]="options?.notitle ? 'none' : ''"
          [innerHTML]="$safeNavigationMigration(options?.title)"></span>
        }
      </mat-slide-toggle>
    }
    @if (options?.showErrors && options?.errorMessage) {
      <mat-error
      [innerHTML]="$safeNavigationMigration(options?.errorMessage)"></mat-error>
    }`,
    styles: [`
    .checkbox-name { white-space: nowrap; }
    mat-error { font-size: 75%; }
  `],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class MaterialCheckboxComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  trueValue: any = true;
  falseValue: any = false;
  showSlideToggle = false;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.jsf.initializeControl(this, !this.options.readonly);
    if (this.controlValue === null || this.controlValue === undefined) {
      this.controlValue = false;
      this.jsf.updateValue(this, this.falseValue);
    }
    if (this.layoutNode.type === 'slide-toggle' ||
      this.layoutNode.format === 'slide-toggle'
    ) {
      this.showSlideToggle = true;
    }
  }

  updateValue(event) {
    this.options.showErrors = true;
    this.jsf.updateValue(this, event.checked ? this.trueValue : this.falseValue);
  }

  get isChecked() {
    return this.jsf.getFormControlValue(this) === this.trueValue;
  }
}
