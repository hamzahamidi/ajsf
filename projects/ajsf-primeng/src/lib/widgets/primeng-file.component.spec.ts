import { vi } from 'vitest';
import { PrimengFileComponent } from './primeng-file.component';

describe('PrimengFileComponent', () => {
  const jsf = () => ({
    initializeControl: vi.fn(),
    updateValue: vi.fn(),
  });

  const make = (node: any) => {
    const j = jsf();
    const c = new PrimengFileComponent(j as any);
    c.layoutNode = node;
    c.ngOnInit();
    return { component: c, jsf: j };
  };

  it('reads options from layoutNode', () => {
    const { component } = make({
      type: 'file',
      options: { title: 'Upload' },
    });
    expect(component.options.title).toBe('Upload');
  });

  it('calls initializeControl with writable binding', () => {
    const { jsf: j } = make({
      type: 'file',
      options: {},
    });
    expect(j.initializeControl).toHaveBeenCalledWith(expect.anything(), true);
  });

  it('respects readonly option', () => {
    const { jsf: j } = make({
      type: 'file',
      options: { readonly: true },
    });
    expect(j.initializeControl).toHaveBeenCalledWith(expect.anything(), false);
  });

  it('reads a file as data URL and updates value', async () => {
    const { component, jsf: j } = make({
      type: 'file',
      options: {},
    });
    const blob = new Blob(['hello'], { type: 'text/plain' });
    const file = new File([blob], 'test.txt', { type: 'text/plain' });

    const originalFileReader = (window as any).FileReader;
    const mockReader = {
      result: 'data:text/plain;base64,aGVsbG8=',
      readAsDataURL(_file: File) {
        setTimeout(() => this.onload(), 0);
      },
      onload: null as any,
    };
    (window as any).FileReader = function() { return mockReader; };

    component.onSelect({ files: [file] });

    // The stubbed FileReader fires onload on a macrotask, so this waits rather
    // than asserting synchronously.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(component.fileName).toBe('test.txt');
    expect(j.updateValue).toHaveBeenCalledWith(component, 'data:text/plain;base64,aGVsbG8=');
    expect(component.options.showErrors).toBe(true);
    (window as any).FileReader = originalFileReader;
  });

  it('does nothing when no file is selected', () => {
    const { component, jsf: j } = make({
      type: 'file',
      options: {},
    });
    component.onSelect({ files: [] });
    expect(component.fileName).toBe('');
    expect(j.updateValue).not.toHaveBeenCalled();
  });
});
