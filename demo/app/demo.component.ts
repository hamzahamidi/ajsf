import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { Examples } from './example-schemas.model';
import { JsonPointer } from '@ajsf/core';

type ThemePreference = 'system' | 'light' | 'dark';

const THEME_KEY = 'ajsf-demo-theme';

// Superseded by THEME_KEY, which also carries 'system'. Still read once so a
// visitor who picked a theme before this existed keeps it.
const LEGACY_DARK_MODE_KEY = 'ajsf-demo-dark-mode';

const THEME_CYCLE: ThemePreference[] = ['system', 'light', 'dark'];

@Component({
    selector: 'demo',
    templateUrl: 'demo.component.html',
    animations: [
        trigger('expandSection', [
            state('in', style({ height: '*' })),
            transition(':enter', [
                style({ height: 0 }), animate(100),
            ]),
            transition(':leave', [
                style({ height: '*' }),
                animate(100, style({ height: 0 })),
            ]),
        ]),
    ],
    standalone: false
})
export class DemoComponent implements OnInit, OnDestroy {
  examples: any = Examples;
  languageList: any = ['de', 'en', 'es', 'fr', 'it', 'pt', 'zh'];
  languages: any = {
    'de': 'German',
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'it': 'Italian',
    'pt': 'Portuguese',
    'zh': 'Chinese'
  };
  frameworkList: any = ['material-design', 'bootstrap-3', 'bootstrap-4', 'bootstrap-5', 'primeng', 'no-framework'];
  frameworks: any = {
    'material-design': 'Material Design',
    'bootstrap-3': 'Bootstrap 3',
    'bootstrap-4': 'Bootstrap 4',
    'bootstrap-5': 'Bootstrap 5',
    'primeng': 'PrimeNG',
    'no-framework': 'None (plain HTML)',
  };
  selectedSet = 'ng-jsf';
  selectedSetName = '';
  selectedExample = 'ng-jsf-flex-layout';
  selectedExampleName = 'Flexbox layout';
  selectedFramework = 'material-design';
  selectedLanguage = 'en';
  visible = {
    options: true,
    schema: true,
    form: true,
    output: true
  };

  formActive = false;
  jsonFormSchema: string;
  jsonFormValid = false;
  jsonFormStatusMessage = 'Loading form...';
  jsonFormObject: any;
  jsonFormOptions: any = {
    addSubmit: true, // Add a submit button if layout does not have one
    debug: false, // Don't show inline debugging information
    loadExternalAssets: true, // Load external css and JavaScript for frameworks
    returnEmptyFields: false, // Don't return values for empty input fields
    setSchemaDefaults: true, // Always use schema defaults for empty fields
    defautWidgetOptions: { feedback: true }, // Show inline feedback icons
  };
  liveFormData: any = {};
  formValidationErrors: any;
  formIsValid = null;
  submittedFormData: any = null;
  aceEditorOptions: any = {
    highlightActiveLine: true,
    maxLines: 1000,
    printMargin: false,
    autoScrollEditorIntoView: true,
  };
  themePreference: ThemePreference = 'system';
  darkMode = false;
  private readonly prefersDark = matchMedia('(prefers-color-scheme: dark)');
  private readonly onSystemThemeChange = () => {
    if (this.themePreference === 'system') { this.applyTheme(); }
  };
  @ViewChild(MatMenuTrigger, { static: true }) menuTrigger: MatMenuTrigger;

  // Bootstrap 5 opts a subtree into its dark palette with this attribute.
  // Bootstrap 3 and 4 have no dark theme, so their pane stays light.
  get formPaneTheme(): string | null {
    return this.darkMode && this.selectedFramework === 'bootstrap-5' ? 'dark' : null;
  }

  // Bootstrap 3 and 4 ship no dark theme, so their pane keeps a light surface
  // rather than putting dark page text on light form controls.
  get lightFormPane(): boolean {
    return this.darkMode &&
      (this.selectedFramework === 'bootstrap-3' || this.selectedFramework === 'bootstrap-4');
  }

  get aceTheme(): string {
    return this.darkMode ? 'tomorrow_night' : 'sqlserver';
  }

  get themeIcon(): string {
    return ({ system: 'brightness_auto', light: 'light_mode', dark: 'dark_mode' })[this.themePreference];
  }

  // Names the state it is in as well as the one it moves to, because a single
  // button cycling three states cannot show the third any other way.
  get themeLabel(): string {
    return `Theme: ${this.themePreference}. Switch to ${this.nextThemePreference()}.`;
  }

  cycleTheme() {
    this.themePreference = this.nextThemePreference();
    localStorage.setItem(THEME_KEY, this.themePreference);
    this.applyTheme();
  }

  private nextThemePreference(): ThemePreference {
    return THEME_CYCLE[(THEME_CYCLE.indexOf(this.themePreference) + 1) % THEME_CYCLE.length];
  }

  private applyTheme() {
    this.darkMode = this.themePreference === 'system' ?
      this.prefersDark.matches : this.themePreference === 'dark';
    document.documentElement.classList.toggle('dark-theme', this.darkMode);
  }

  private storedThemePreference(): ThemePreference {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'system' || stored === 'light' || stored === 'dark') { return stored; }
    const legacy = localStorage.getItem(LEGACY_DARK_MODE_KEY);
    if (legacy === 'true') { return 'dark'; }
    if (legacy === 'false') { return 'light'; }
    return 'system';
  }

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnDestroy() {
    this.prefersDark.removeEventListener('change', this.onSystemThemeChange);
  }

  ngOnInit() {
    this.themePreference = this.storedThemePreference();
    this.applyTheme();
    this.prefersDark.addEventListener('change', this.onSystemThemeChange);

    // Subscribe to query string to detect schema to load
    this.route.queryParams.subscribe(
      params => {
        if (params['set']) {
          this.selectedSet = params['set'];
          this.selectedSetName = ({
            'ng-jsf': '',
            'asf': 'Angular Schema Form:',
            'rsf': 'React Schema Form:',
            'jsf': 'JSONForm:'
          })[this.selectedSet];
        }
        if (params['example']) {
          this.selectedExample = params['example'];
          this.selectedExampleName = this.examples[this.selectedSet].schemas
            .find(schema => schema.file === this.selectedExample).name;
        }
        if (params['framework']) {
          this.selectedFramework = params['framework'];
        }
        if (params['language']) {
          this.selectedLanguage = params['language'];
        }
        this.loadSelectedExample();
      }
    );
  }

  onSubmit(data: any) {
    this.submittedFormData = data;
  }

  get prettySubmittedFormData() {
    return JSON.stringify(this.submittedFormData, null, 2);
  }

  onChanges(data: any) {
    this.liveFormData = data;
  }

  get prettyLiveFormData() {
    return JSON.stringify(this.liveFormData, null, 2);
  }

  isValid(isValid: boolean): void {
    this.formIsValid = isValid;
  }

  validationErrors(data: any): void {
    this.formValidationErrors = data;
  }

  get prettyValidationErrors() {
    if (!this.formValidationErrors) { return null; }
    const errorArray = [];
    for (const error of this.formValidationErrors) {
      const message = error.message;
      const dataPathArray = JsonPointer.parse(error.dataPath);
      if (dataPathArray.length) {
        let field = dataPathArray[0];
        for (let i = 1; i < dataPathArray.length; i++) {
          const key = dataPathArray[i];
          field += /^\d+$/.test(key) ? `[${key}]` : `.${key}`;
        }
        errorArray.push(`${field}: ${message}`);
      } else {
        errorArray.push(message);
      }
    }
    return errorArray.join('<br>');
  }

  loadSelectedExample(
    selectedSet: string = this.selectedSet,
    selectedSetName: string = this.selectedSetName,
    selectedExample: string = this.selectedExample,
    selectedExampleName: string = this.selectedExampleName
  ) {
    if (this.menuTrigger.menuOpen) { this.menuTrigger.closeMenu(); }
    if (selectedExample !== this.selectedExample) {
      this.formActive = false;
      this.selectedSet = selectedSet;
      this.selectedSetName = selectedSetName;
      this.selectedExample = selectedExample;
      this.selectedExampleName = selectedExampleName;
      this.router.navigateByUrl(
        '/?set=' + selectedSet +
        '&example=' + selectedExample +
        '&framework=' + this.selectedFramework +
        '&language=' + this.selectedLanguage
      );
      this.liveFormData = {};
      this.submittedFormData = null;
      this.formIsValid = null;
      this.formValidationErrors = null;
    }
    const exampleURL = `assets/example-schemas/${this.selectedExample}.json`;
    this.http
      .get(exampleURL, { responseType: 'text' })
      .subscribe(schema => {
        this.jsonFormSchema = schema;
        this.generateForm(this.jsonFormSchema);
      });
  }

  loadSelectedLanguage() {
    window.location.href = `${window.location.pathname}?set=${this.selectedSet}&example=${this.selectedExample}&framework=${this.selectedFramework}&language=${this.selectedLanguage}`;
  }

  // Display the form entered by the user
  // (runs whenever the user changes the jsonform object in the ACE input field)
  generateForm(newFormString: string) {
    if (!newFormString) { return; }
    this.jsonFormStatusMessage = 'Loading form...';
    this.formActive = false;
    this.liveFormData = {};
    this.submittedFormData = null;

    // Most examples should be written in pure JSON,
    // but if an example schema includes a function,
    // it will be compiled it as Javascript instead
    try {

      // Parse entered content as JSON
      this.jsonFormObject = JSON.parse(newFormString);
      this.jsonFormValid = true;
    } catch (jsonError) {
      try {

        // If entered content is not valid JSON,
        // parse as JavaScript instead to include functions
        const newFormObject: any = null;
        // Four bundled examples embed JavaScript functions, so they are not JSON
        // and cannot be parsed. This is the demo only; the library never evals.
        // eslint-disable-next-line no-eval
        eval('newFormObject = ' + newFormString);
        this.jsonFormObject = newFormObject;
        this.jsonFormValid = true;
      } catch (javascriptError) {

        // If entered content is not valid JSON or JavaScript, show error
        this.jsonFormValid = false;
        this.jsonFormStatusMessage =
          'Entered content is not currently a valid JSON Form object.\n' +
          'As soon as it is, you will see your form here. So keep typing. :-)\n\n' +
          'JavaScript parser returned:\n\n' + jsonError;
        return;
      }
    }
    this.formActive = true;
  }

  toggleVisible(item: string) {
    this.visible[item] = !this.visible[item];
  }

  toggleFormOption(option: string) {
    if (option === 'feedback') {
      this.jsonFormOptions.defautWidgetOptions.feedback =
        !this.jsonFormOptions.defautWidgetOptions.feedback;
    } else {
      this.jsonFormOptions[option] = !this.jsonFormOptions[option];
    }
    this.generateForm(this.jsonFormSchema);
  }
}
