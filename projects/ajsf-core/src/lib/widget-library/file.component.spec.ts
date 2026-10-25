import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';
import { FileComponent } from './file.component';
import { JsonSchemaFormService } from '../json-schema-form.service';
import { WidgetLibraryModule } from './widget-library.module';

describe('FileComponent', () => {
  const make = (dataType = 'string', options: any = {}) => {
    const jsf = {
      initializeControl: vi.fn(),
      updateArrayValue: vi.fn(),
      updateValue: vi.fn(),
    };
    const component = new FileComponent(jsf as any);
    component.layoutNode = { dataType, options };
    component.ngOnInit();
    return { component, jsf };
  };

  afterEach(() => vi.unstubAllGlobals());

  it('initializes a writable file control', () => {
    const { component, jsf } = make();

    expect(jsf.initializeControl).toHaveBeenCalledWith(component, true);
    expect(component.multiple).toBe(false);
  });

  it('does not bind a readonly control', () => {
    const { component, jsf } = make('string', { readonly: true });

    expect(jsf.initializeControl).toHaveBeenCalledWith(component, false);
  });

  it('writes a selected file as a data URL', async () => {
    const { component, jsf } = make();
    vi.stubGlobal('FileReader', class {
      result = 'data:text/plain;base64,aGVsbG8=';
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onabort: (() => void) | null = null;
      readAsDataURL() { this.onload?.(); }
    });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await component.updateFiles({ target: { files: [file] } } as any);

    expect(jsf.updateValue).toHaveBeenCalledWith(component, 'data:text/plain;base64,aGVsbG8=');
    expect(component.options.showErrors).toBe(true);
    expect(component.readError).toBeNull();
  });

  it('stores multiple selected files in an array control', async () => {
    const { component, jsf } = make('array');
    component.boundControl = true;
    vi.stubGlobal('FileReader', class {
      result: string;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onabort: (() => void) | null = null;
      readAsDataURL(file: File) {
        this.result = `data:${file.type};base64,${file.name}`;
        this.onload?.();
      }
    });
    const files = [
      new File(['one'], 'one.txt', { type: 'text/plain' }),
      new File(['two'], 'two.txt', { type: 'text/plain' }),
    ];

    await component.updateFiles({ target: { files } } as any);

    expect(jsf.updateArrayValue).toHaveBeenCalledWith(component, [
      'data:text/plain;base64,one.txt',
      'data:text/plain;base64,two.txt',
    ]);
  });

  it('clears a single value', () => {
    const { component, jsf } = make();
    const input = { value: 'C:\\fakepath\\hello.txt' } as HTMLInputElement;

    component.clearFiles(input);

    expect(input.value).toBe('');
    expect(jsf.updateValue).toHaveBeenCalledWith(component, null);
  });

  it('clears an array value', () => {
    const { component, jsf } = make('array');
    component.boundControl = true;

    component.clearFiles({ value: 'files' } as HTMLInputElement);

    expect(jsf.updateArrayValue).toHaveBeenCalledWith(component, []);
  });

  it('reports a file read error without changing the current value', async () => {
    const { component, jsf } = make();
    vi.stubGlobal('FileReader', class {
      result = null;
      error = new Error('read failed');
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onabort: (() => void) | null = null;
      readAsDataURL() { this.onerror?.(); }
    });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await component.updateFiles({ target: { files: [file] } } as any);

    expect(component.readError).toBe('Unable to read the selected file.');
    expect(jsf.updateValue).not.toHaveBeenCalled();
  });

  it('does not change the value when no file is selected', async () => {
    const { component, jsf } = make();

    await component.updateFiles({ target: { files: null } } as any);

    expect(jsf.updateValue).not.toHaveBeenCalled();
    expect(jsf.updateArrayValue).not.toHaveBeenCalled();
  });

  it('updates an unbound array field through the standard value handler', async () => {
    const { component, jsf } = make('array');
    vi.stubGlobal('FileReader', class {
      result = 'data:text/plain;base64,YQ==';
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onabort: (() => void) | null = null;
      readAsDataURL() { this.onload?.(); }
    });
    const file = new File(['a'], 'a.txt', { type: 'text/plain' });

    await component.updateFiles({ target: { files: [file] } } as any);

    expect(jsf.updateValue).toHaveBeenCalledWith(component, ['data:text/plain;base64,YQ==']);
    expect(jsf.updateArrayValue).not.toHaveBeenCalled();
  });

  it('reports a non-string FileReader result', async () => {
    const { component, jsf } = make();
    vi.stubGlobal('FileReader', class {
      result = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onabort: (() => void) | null = null;
      readAsDataURL() { this.onload?.(); }
    });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await component.updateFiles({ target: { files: [file] } } as any);

    expect(component.readError).toBe('Unable to read the selected file.');
    expect(jsf.updateValue).not.toHaveBeenCalled();
  });

  it('reports an aborted FileReader', async () => {
    const { component, jsf } = make();
    vi.stubGlobal('FileReader', class {
      result = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onabort: (() => void) | null = null;
      readAsDataURL() { this.onabort?.(); }
    });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await component.updateFiles({ target: { files: [file] } } as any);

    expect(component.readError).toBe('Unable to read the selected file.');
    expect(jsf.updateValue).not.toHaveBeenCalled();
  });

  it('reports a FileReader error when the browser provides no error object', async () => {
    const { component, jsf } = make();
    vi.stubGlobal('FileReader', class {
      result = null;
      error = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onabort: (() => void) | null = null;
      readAsDataURL() { this.onerror?.(); }
    });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await component.updateFiles({ target: { files: [file] } } as any);

    expect(component.readError).toBe('Unable to read the selected file.');
    expect(jsf.updateValue).not.toHaveBeenCalled();
  });

  it('uses empty options when the layout node has none', () => {
    const jsf = { initializeControl: vi.fn() };
    const component = new FileComponent(jsf as any);
    component.layoutNode = { dataType: 'string' };

    component.ngOnInit();

    expect(component.options).toEqual({});
    expect(jsf.initializeControl).toHaveBeenCalledWith(component, true);
  });

  it('does not show stored files when an array value is empty', () => {
    const { component } = make('array');
    component.controlValue = [];

    expect(component.hasSelectedFiles).toBe(false);
  });
});

describe('FileComponent template', () => {
  let fixture: ComponentFixture<FileComponent>;
  let jsf: any;

  beforeEach(async () => {
    jsf = {
      framework: null,
      initializeControl: vi.fn((widget: any) => {
        widget.boundControl = false;
        widget.controlValue = null;
        widget.controlName = 'document';
      }),
      updateArrayValue: vi.fn(),
      updateValue: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [WidgetLibraryModule, FormsModule, ReactiveFormsModule],
      providers: [{ provide: JsonSchemaFormService, useValue: jsf }],
    }).compileComponents();
  });

  afterEach(() => fixture?.destroy());

  const render = (
    options: any = {}, dataType = 'string', controlValue: any = null
  ): ComponentFixture<FileComponent> => {
    fixture = TestBed.createComponent(FileComponent);
    fixture.componentInstance.layoutNode = {
      type: 'file', _id: 'document', dataType, options,
    };
    jsf.initializeControl = vi.fn((widget: any) => {
      widget.boundControl = false;
      widget.controlValue = controlValue;
      widget.controlName = 'document';
    });
    fixture.detectChanges();
    return fixture;
  };

  it('renders the file label, accept filter, required state, and description', () => {
    const view = render({
      title: 'Document',
      accept: '.pdf,application/pdf',
      required: true,
      description: 'Upload a PDF',
    });

    const input: HTMLInputElement = view.nativeElement.querySelector('input[type="file"]');
    expect(view.nativeElement.querySelector('label').textContent).toContain('Document');
    expect(input.accept).toBe('.pdf,application/pdf');
    expect(input.required).toBe(true);
    expect(view.nativeElement.textContent).toContain('Upload a PDF');
    expect(view.nativeElement.querySelector('button')).toBeNull();
  });

  it('renders stored files and disables controls for a read only value', () => {
    const view = render({
      htmlClass: 'file-field',
      title: 'Document',
      notitle: true,
      readonly: true,
      description: 'Current file',
      showErrors: true,
      errorMessage: 'Invalid file',
    }, 'string', 'data:text/plain;base64,YQ==');

    const input: HTMLInputElement = view.nativeElement.querySelector('input[type="file"]');
    const button: HTMLButtonElement = view.nativeElement.querySelector('button');
    expect(view.nativeElement.querySelector('.file-field')).toBeTruthy();
    expect(view.nativeElement.querySelector('label').style.display).toBe('none');
    expect(input.disabled).toBe(true);
    expect(button.disabled).toBe(true);
    expect(view.nativeElement.textContent).toContain('Invalid file');
    expect(view.nativeElement.textContent).not.toContain('Current file');
  });

  it('clears a stored writable single value from the file button', () => {
    const view = render({}, 'string', 'data:text/plain;base64,YQ==');
    const input: HTMLInputElement = view.nativeElement.querySelector('input[type="file"]');
    const button: HTMLButtonElement = view.nativeElement.querySelector('button');

    button.click();
    expect(jsf.updateValue).toHaveBeenCalledWith(fixture.componentInstance, null);
    expect(input.value).toBe('');
  });

  it('renders descriptions when errors have no message and displays file read errors', () => {
    const view = render({ description: 'Choose a file', showErrors: true });
    expect(view.nativeElement.textContent).toContain('Choose a file');

    fixture.componentInstance.readError = 'Unable to read the selected file.';
    fixture.detectChanges();
    expect(view.nativeElement.querySelector('[role="alert"]').textContent)
      .toContain('Unable to read the selected file.');
  });

  it('renders and clears stored multiple files', () => {
    const view = render({ clearLabel: 'Remove files' }, 'array', ['data:file']);

    const input: HTMLInputElement = view.nativeElement.querySelector('input[type="file"]');
    const button: HTMLButtonElement = view.nativeElement.querySelector('button');
    expect(input.multiple).toBe(true);
    expect(button.textContent).toContain('Remove files');

    button.click();
    expect(jsf.updateValue).toHaveBeenCalledWith(fixture.componentInstance, []);
  });
});
