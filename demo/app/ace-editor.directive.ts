import { Directive, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import ace from 'brace';
import 'brace/mode/json';
import 'brace/theme/sqlserver';



@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[ace-editor]'
})
export class AceEditorDirective {
  _options: any = {};
  _highlightActiveLine = false;
  _showGutter = false;
  _readOnly = false;
  _theme = 'sqlserver';
  _mode = 'json';
  _autoUpdateContent = true;
  editor: any;
  oldText: any;
  @Output('textChanged') textChanged = new EventEmitter();

  constructor(elementRef: ElementRef) {
    const el = elementRef.nativeElement;
    this.editor = ace.edit(el);
    this.init();
    this.initEvents();
  }

  init() {
    this.editor.getSession().setUseWorker(false);
    this.editor.setOptions(this._options);
    this.editor.setTheme(`ace/theme/${this._theme}`);
    this.editor.getSession().setMode(`ace/mode/${this._mode}`);
    this.editor.setHighlightActiveLine(this._highlightActiveLine);
    this.editor.renderer.setShowGutter(this._showGutter);
    this.editor.setReadOnly(this._readOnly);
    this.editor.$blockScrolling = Infinity;
  }

  initEvents() {
    this.editor.on('change', () => {
      const newVal = this.editor.getValue();
      if (this.oldText) {
        this.textChanged.emit(newVal);
      }
      this.oldText = newVal;
    });
  }

  @Input() set options(options: any) {
    this._options = options;
    this.editor.setOptions(options || {});
  }

  @Input() set readOnly(readOnly: any) {
    this._readOnly = readOnly;
    this.editor.setReadOnly(readOnly);
  }

  @Input() set theme(theme: any) {
    this._theme = theme;
    this.editor.setTheme(`ace/theme/${theme}`);
  }

  @Input() set mode(mode: any) {
    this._mode = mode;
    this.editor.getSession().setMode(`ace/mode/${mode}`);
  }

  @Input() set text(text: any) {
    if (!text) { text = ''; }

    if (this._autoUpdateContent === true) {
      this.editor.setValue(text);
      this.editor.clearSelection();
      this.editor.focus();
      this.editor.moveCursorTo(0, 0);
    }
  }

  @Input() set autoUpdateContent(status: any) {
    this._autoUpdateContent = status;
  }
}
