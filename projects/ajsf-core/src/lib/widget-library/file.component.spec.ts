import { vi } from 'vitest';
import { FileComponent } from './file.component';

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
});
