import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { JsonSchemaFormService } from '../json-schema-form.service';


@Component({
    selector: 'file-widget',
    template: `
    <div [class]="options?.htmlClass || ''">
      @if (options?.title) {
        <label
          [attr.for]="'control' + layoutNode?._id"
          [class]="options?.labelHtmlClass || ''"
          [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="$safeNavigationMigration(options?.title)"></label>
      }
      <input
        #fileInput
        type="file"
        [attr.accept]="options?.accept || null"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [required]="options?.required"
        [class]="options?.fieldHtmlClass || ''"
        [disabled]="controlDisabled || options?.readonly"
        [id]="'control' + $safeNavigationMigration(layoutNode?._id)"
        [multiple]="multiple"
        [name]="controlName"
      (change)="updateFiles($event)">
      @if (hasSelectedFiles) {
        <button
          type="button"
          [disabled]="controlDisabled || options?.readonly"
        (click)="clearFiles(fileInput)">{{options?.clearLabel || 'Clear files'}}</button>
      }
      @if (options?.description && (!options?.showErrors || !options?.errorMessage)) {
        <p
          class="help-block"
          [innerHTML]="$safeNavigationMigration(options?.description)"></p>
      }
      @if (readError) {
        <p class="help-block" role="alert">{{readError}}</p>
      }
      @if (options?.showErrors && options?.errorMessage) {
        <div
          [id]="'control' + layoutNode?._id + 'Status'"
          [innerHTML]="$safeNavigationMigration(options?.errorMessage)"></div>
      }
    </div>`,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class FileComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  multiple = false;
  readError: string | null = null;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private readonly jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.multiple = this.layoutNode.dataType === 'array';
    this.jsf.initializeControl(this, !this.options.readonly);
  }

  get hasSelectedFiles(): boolean {
    return this.multiple
      ? Array.isArray(this.controlValue) && this.controlValue.length > 0
      : typeof this.controlValue === 'string' && this.controlValue.length > 0;
  }

  async updateFiles(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const selectedFiles = Array.from(input?.files || []);
    const files = this.multiple ? selectedFiles : selectedFiles.slice(0, 1);
    if (!files.length) { return; }

    this.readError = null;
    try {
      const values = await Promise.all(files.map(file => this.readFile(file)));
      this.options.showErrors = true;
      this.updateValue(this.multiple ? values : values[0]);
    } catch {
      this.readError = 'Unable to read the selected file.';
    }
  }

  clearFiles(input: HTMLInputElement): void {
    input.value = '';
    this.readError = null;
    this.updateValue(this.multiple ? [] : null);
  }

  private updateValue(value: string | string[] | null): void {
    if (this.multiple && this.boundControl) {
      this.jsf.updateArrayValue(this, value as string[]);
      return;
    }
    this.jsf.updateValue(this, value);
  }

  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('FileReader returned a non-string result'));
      reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
      reader.onabort = () => reject(new Error('FileReader was aborted'));
      reader.readAsDataURL(file);
    });
  }
}
