import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { JsonSchemaFormService, buildTitleMap } from '@ajsf/core';

@Component({
    selector: 'primeng-radios-widget',
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
      <div [style.flex-direction]="flexDirection" style="display: inline-flex">
        @for (radioItem of radiosList; track radioItem) {
          <div style="margin: 2px">
            @if (boundControl) {
              <p-radiobutton
                [formControl]="formControl"
                [value]="$safeNavigationMigration(radioItem?.value)"
                [name]="controlName"
                [inputId]="'control' + $safeNavigationMigration(layoutNode?._id) + '/' + $safeNavigationMigration(radioItem?.name)"
                (onBlur)="options.showErrors = true">
              </p-radiobutton>
            }
            @if (!boundControl) {
              <p-radiobutton
                [name]="controlName"
                [value]="$safeNavigationMigration(radioItem?.value)"
                [disabled]="controlDisabled || options?.readonly"
                [ngModel]="controlValue"
                [inputId]="'control' + $safeNavigationMigration(layoutNode?._id) + '/' + $safeNavigationMigration(radioItem?.name)"
                (onClick)="updateValue($safeNavigationMigration(radioItem?.value))">
              </p-radiobutton>
            }
            <label [for]="'control' + $safeNavigationMigration(layoutNode?._id) + '/' + $safeNavigationMigration(radioItem?.name)">
              <span [innerHTML]="$safeNavigationMigration(radioItem?.name)"></span>
            </label>
          </div>
        }
      </div>
      @if (options?.showErrors && options?.errorMessage) {
        <div class="p-error"
        [innerHTML]="$safeNavigationMigration(options?.errorMessage)"></div>
      }
    </div>`,
    styles: [`
    .p-error { font-size: 75%; margin-top: 0.25rem; }
  `],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PrimengRadiosComponent implements OnInit {
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

  constructor(private jsf: JsonSchemaFormService) {}

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
