import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Bootstrap4FrameworkModule } from './bootstrap4-framework.module';

@Component({
  standalone: true,
  imports: [Bootstrap4FrameworkModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<json-schema-form
    [form]="form"
    framework="bootstrap-4"></json-schema-form>`,
})
class TitleHost {
  form: any;
}

describe('Bootstrap 4 array title', () => {
  let fixture: ComponentFixture<TitleHost>;

  const render = (form: any): HTMLElement => {
    fixture = TestBed.createComponent(TitleHost);
    fixture.componentInstance.form = form;
    fixture.detectChanges();
    return fixture.nativeElement;
  };

  const titled = (el: HTMLElement, text: string) =>
    [...el.querySelectorAll('label, legend')].filter((n) => n.textContent.trim() === text);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TitleHost] }).compileComponents();
  });

  const underscored = {
    schema: { phone_numbers: { type: 'array', items: { type: 'string' } } },
    data: { phone_numbers: ['702-123-4567'] },
  };

  // fixTitle turns phone_numbers into Phone Numbers; toTitleCase, which the
  // widget fell back to when the framework blanked the title, splits on
  // whitespace and hyphens only and left the underscore in place.
  it('renders the title once, normalised', () => {
    const el = render(underscored);
    expect(titled(el, 'Phone_numbers').length,
      'the raw property name should not reach the page').toEqual(0);
    expect(titled(el, 'Phone Numbers').length,
      'the array title should render exactly once').toEqual(1);
  });

  it('puts it on the legend, so it names the fieldset', () => {
    const el = render(underscored);
    const title = titled(el, 'Phone Numbers')[0];
    expect(title.tagName, 'a fieldset is named by its legend').toEqual('LEGEND');
    expect(title.closest('fieldset'), 'and the legend must be inside it').toBeTruthy();
  });

  it('leaves a plain fieldset title alone', () => {
    const el = render({
      schema: { home_address: { type: 'object', properties: { city: { type: 'string' } } } },
      form: [{ key: 'home_address', type: 'fieldset' }],
    });
    expect(titled(el, 'Home Address').length,
      'a fieldset already owned its title and should be unchanged').toEqual(1);
  });
});
