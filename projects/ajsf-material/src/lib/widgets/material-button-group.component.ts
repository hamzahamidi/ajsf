import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { JsonSchemaFormService, buildTitleMap } from '@ajsf/core';


@Component({
    selector: 'material-button-group-widget',
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
      <mat-button-toggle-group
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.required]="options?.required"
        [disabled]="controlDisabled || options?.readonly"
        [name]="controlName"
        [value]="controlValue"
        [vertical]="!!options.vertical">
        @for (radioItem of radiosList; track radioItem) {
          <mat-button-toggle
            [id]="'control' + $safeNavigationMigration(layoutNode?._id) + '/' + $safeNavigationMigration(radioItem?.name)"
            [value]="$safeNavigationMigration(radioItem?.value)"
            (click)="updateValue($safeNavigationMigration(radioItem?.value))">
            <span [innerHTML]="$safeNavigationMigration(radioItem?.name)"></span>
          </mat-button-toggle>
        }
      </mat-button-toggle-group>
      @if (options?.showErrors && options?.errorMessage) {
        <mat-error
        [innerHTML]="$safeNavigationMigration(options?.errorMessage)"></mat-error>
      }
    </div>`,
    styles: [` mat-error { font-size: 75%; } `],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class MaterialButtonGroupComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  radiosList: any[] = [];
  vertical = false;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.radiosList = buildTitleMap(
      this.options.titleMap || this.options.enumNames,
      this.options.enum, true
    );
    this.jsf.initializeControl(this);
  }

  updateValue(value) {
    this.options.showErrors = true;
    this.jsf.updateValue(this, value);
  }
}
