import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PrimengInputComponent } from './primeng-input.component';
import { JsonSchemaFormService } from '@ajsf/core';

describe('PrimengInputComponent', () => {
  const make = (opts: any, layoutType = 'text') => {
    const jsf = { initializeControl: jasmine.createSpy('initializeControl'), updateValue: jasmine.createSpy('updateValue') };
    const c = new PrimengInputComponent(jsf as any);
    c.layoutNode = { type: layoutType, options: opts };
    c.ngOnInit();
    return { component: c, jsf };
  };

  it('copies placeholder to description when title is shown and no description exists', () => {
    const { component } = make({ placeholder: 'Search here' });
    expect(component.options.description).toBe('Search here');
  });

  it('does not overwrite an existing description', () => {
    const { component } = make({ placeholder: 'Search here', description: 'Existing' });
    expect(component.options.description).toBe('Existing');
  });

  it('skips description copy when notitle is set', () => {
    const { component } = make({ notitle: true, placeholder: 'Search here' });
    expect(component.options.description).toBeUndefined();
  });

  it('forwards value updates through jsf', () => {
    const { component, jsf } = make({});
    component.updateValue({ target: { value: 'hello' } });
    expect(jsf.updateValue).toHaveBeenCalledWith(component, 'hello');
  });

  describe('typeahead datalist', () => {
    let fixture: ComponentFixture<PrimengInputComponent>;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [CommonModule, ReactiveFormsModule, InputTextModule],
        declarations: [PrimengInputComponent],
        providers: [
          { provide: JsonSchemaFormService, useValue: { initializeControl: () => {} } },
        ],
      }).compileComponents();
    }));

    it('renders a datalist with the configured suggestions', () => {
      fixture = TestBed.createComponent(PrimengInputComponent);
      const comp = fixture.componentInstance;
      comp.layoutNode = {
        _id: '42',
        type: 'text',
        options: { typeahead: { source: ['alpha', 'bravo', 'charlie'] } },
      };
      comp.ngOnInit();
      fixture.detectChanges();

      const datalist = fixture.nativeElement.querySelector('datalist');
      expect(datalist).toBeTruthy();
      expect(datalist.id).toBe('control42Autocomplete');
      const options = datalist.querySelectorAll('option');
      expect(options.length).toBe(3);
      expect(options[0].value).toBe('alpha');
      expect(options[2].value).toBe('charlie');
    });
  });
});
