import {
  Component, Input, OnDestroy, OnInit, ChangeDetectionStrategy
} from '@angular/core';
import { Subscription } from 'rxjs';
import { JsonSchemaFormService } from '../json-schema-form.service';


@Component({
    selector: 'message-widget',
    template: `
    @if (message) {
      <span
        [class]="options?.labelHtmlClass || ''"
      [innerHTML]="message"></span>
    }`,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class MessageComponent implements OnInit, OnDestroy {
  options: any;
  message: string = null;
  private messageTemplate: string;
  private dataChangesSubscription: Subscription;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private readonly jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.messageTemplate = this.options.help || this.options.helpvalue ||
      this.options.msg || this.options.message;
    this.updateMessage(this.jsf.data);
    this.dataChangesSubscription = this.jsf.dataChanges.subscribe(
      data => this.updateMessage(data)
    );
  }

  ngOnDestroy(): void {
    this.dataChangesSubscription?.unsubscribe();
  }

  private updateMessage(data: any): void {
    const localValue = this.jsf.getFormControlValue(this);
    const localValues = this.jsf.getFormControlGroup(this)?.value;
    const value = localValue ?? data ?? {};
    const values = localValues ?? data ?? {};
    const index = this.dataIndex?.[this.dataIndex.length - 1];
    this.message = this.jsf.parseText(this.messageTemplate, value, values, index ?? null);
  }
}
