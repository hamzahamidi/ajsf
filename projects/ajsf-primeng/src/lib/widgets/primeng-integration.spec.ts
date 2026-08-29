import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PrimengFrameworkModule } from '../primeng-framework.module';

@Component({
    template: `
    <json-schema-form
      [schema]="schema"
      [layout]="layout"
      [data]="data"
      framework="primeng"
      (onChanges)="value = $event"
      (isValid)="valid = $event"
    ></json-schema-form>`,
    standalone: false
})
class IntegrationHostComponent {
  schema: any = {};
  layout: any;
  data: any;
  value: any;
  valid: boolean | null = null;
}

describe('PrimeNG integration', () => {
  let fixture: ComponentFixture<IntegrationHostComponent>;
  let host: IntegrationHostComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PrimengFrameworkModule, NoopAnimationsModule],
      declarations: [IntegrationHostComponent],
      schemas: [],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IntegrationHostComponent);
    host = fixture.componentInstance;
  });

  describe('datepicker', () => {
    beforeEach(() => {
      host.schema = {
        type: 'object',
        properties: {
          birthday: {type: 'string', format: 'date'}
        }
      };
      host.data = {birthday: '2025-06-15'};
      fixture.detectChanges();
    });

    it('renders a p-datepicker', () => {
      const dp = fixture.nativeElement.querySelector('p-datepicker');
      expect(dp).toBeTruthy();
    });

    it('emits a string value, not a Date', () => {
      expect(host.value).toBeTruthy();
      expect(typeof host.value.birthday).toBe('string');
    });

    it('keeps the form valid with a date string', () => {
      expect(host.valid).toBe(true);
    });

    it('displays the initial value in the input', () => {
      const input = fixture.nativeElement.querySelector('p-datepicker input');
      expect(input).toBeTruthy();
      expect(input.value).toContain('2025');
    });
  });

  describe('chip-list', () => {
    beforeEach(() => {
      host.schema = {
        type: 'object',
        properties: {
          tags: {
            type: 'array',
            items: {type: 'string'}
          }
        }
      };
      host.layout = [{key: 'tags', type: 'chip-list'}];
      host.data = {tags: ['a', 'b']};
      fixture.detectChanges();
    });

    it('renders a p-autocomplete', () => {
      const ac = fixture.nativeElement.querySelector('p-autocomplete');
      expect(ac).toBeTruthy();
    });

    it('updates form data when tags change', () => {
      const de = fixture.debugElement.query(By.css('primeng-chip-list-widget'));
      const chipList = de.componentInstance;
      chipList.updateValue(['a', 'b', 'c']);
      fixture.detectChanges();
      expect(host.value.tags).toEqual(['a', 'b', 'c']);
    });
  });
});
