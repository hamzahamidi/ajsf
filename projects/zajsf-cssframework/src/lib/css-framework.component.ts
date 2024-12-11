import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FrameworkLibraryService, JsonSchemaFormService, addClasses, inArray } from '@zajsf/core';
import _, { cloneDeep, map } from 'lodash';
import { Subscription } from 'rxjs';
import { css_fw } from './css-framework.defs';
import { CssframeworkService } from './css-framework.service';

@Component({
  selector: 'css-framework',
  templateUrl: './css-framework.component.html',
  styleUrls: ['./css-framework.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CssFrameworkComponent implements OnInit, OnChanges,OnDestroy {
  frameworkInitialized = false;
  widgetOptions: any; // Options passed to child widget
  widgetLayoutNode: any; // layoutNode passed to child widget
  options: any; // Options used in this framework
  formControl: any = null;
  debugOutput: any = '';
  debug: any = '';
  parentArray: any = null;
  isOrderable = false;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  @Input() widgetStyles: css_fw.widgetstyles;





  //TODO-move to zajsf/core utility.functions.ts
  applyCssClasses(type, widgetOptions, styleOptions) {
    //console.log("applyCssClasses for type:"+type);
    let cssClasses = this.widgetStyles[type];
    if (!cssClasses || _.isEmpty(cssClasses) ) {
      cssClasses = this.widgetStyles.default;
    }
    Object.keys(cssClasses).forEach(catName => {
      let classList = cssClasses[catName];

      if (classList.length) {
        widgetOptions[catName] = addClasses(widgetOptions[catName], classList);
      }
      if (styleOptions) {
        widgetOptions[catName] = addClasses(widgetOptions[catName], styleOptions);
      }

    })
  }

  flattenWidgetStyles(wstyles:css_fw.widgetstyles){
    var flattened:any={};
    let ignore=['__themes__'];
    Object.keys(wstyles).forEach(wkey=>{
      let wstyle=wstyles[wkey];
      if(ignore.indexOf(wkey)>=0){
        flattened[wkey]=wstyle;
        return;
      }
      if(_.isArray(wstyle)){
        
        flattened[wkey]=wstyle.join(" ");
      }
      if(_.isObject(wstyle)){//is csscategories
          flattened[wkey]=flattened[wkey]||{};
        Object.keys(wstyle).forEach(catName=>{
          let cssCat=wstyle[catName];
          
          if(_.isArray(cssCat)){
            flattened[wkey][catName]=cssCat.join(" ");
          }else{
            flattened[wkey][catName]=cssCat;
          }
        })
      }
      if(_.isString(wstyle)){
        flattened[wkey]=wstyle;
      }
    })
    return flattened
}

defaultStyling:css_fw.widgetstyles={
  array:{},
  default:{fieldHtmlClass: "cssfw-form-control"},
  __themes__:[{name:'notheme',text:'None'}],
  __remove_item__:"cssfw-remove-item",
    __array_item_nonref__:{
      "htmlClass":   "cssfw-array-item-nonref"
  },
  __active__:{activeClass:"cssfw-active"},
  __array__:{htmlClass:"cssfw-array"},
  __control_label__:{labelHtmlClass:"cssfw-control-label"},
  __form_group__:{htmlClass: "cssfw-form-group"},
  __field_addon_left__:"cssfw-addon-left",
  __field_addon_right__:"cssfw-addon-right",
  __help_block__:"cssfw-help-block",
  __required_asterisk__:"cssfw-required-astersisk",
  __screen_reader__: "cssfw-screen-reader"

}




theme:string
frameworkThemeSubs:Subscription;
  constructor(
    public changeDetector: ChangeDetectorRef,
    public jsf: JsonSchemaFormService,
    public jsfFLService:FrameworkLibraryService,
    public cssFWService:CssframeworkService
    /*@Inject(CSS_FRAMEWORK_CFG ) fwcfg: css_fw.frameworkcfg*/

  ) {
    
    let activeFramework:any=this.jsfFLService.activeFramework;
    let fwcfg=activeFramework.config||{};
    this.widgetStyles = Object.assign(this.defaultStyling,fwcfg.widgetstyles);
    let defaultTheme=this.widgetStyles.__themes__[0];
    let defaultThemeName=cssFWService.activeRequestedTheme||defaultTheme.name;
    this.theme=this.options?.theme|| defaultThemeName;
    this.frameworkThemeSubs=cssFWService.frameworkTheme$.subscribe(newTheme=>{
        this.theme=newTheme;
    })
 
  }

  ngOnDestroy(): void {
    this.frameworkThemeSubs.unsubscribe();
    this.frameworkThemeSubs=null;
  }


  get showRemoveButton(): boolean {
    if (!this.options.removable || this.options.readonly ||
      this.layoutNode.type === '$ref'
    ) {
      return false;
    }
    if (this.layoutNode.recursiveReference) {
      return true;
    }
    if (!this.layoutNode.arrayItem || !this.parentArray) {
      return false;
    }
    // If array length <= minItems, don't allow removing any items
    return this.parentArray.items.length - 1 <= this.parentArray.options.minItems ? false :
      // For removable list items, allow removing any item
      this.layoutNode.arrayItemType === 'list' ? true :
        // For removable tuple items, only allow removing last item in list
        this.layoutIndex[this.layoutIndex.length - 1] === this.parentArray.items.length - 2;
  }

  ngOnInit() {
    this.initializeFramework();
    if (this.layoutNode.arrayItem && this.layoutNode.type !== '$ref') {
      this.parentArray = this.jsf.getParentNode(this);
      if (this.parentArray) {
        this.isOrderable = this.layoutNode.arrayItemType === 'list' &&
          !this.options.readonly && this.parentArray.options.orderable;
      }
    }
  }

  ngOnChanges() {
    if (!this.frameworkInitialized) {
      this.initializeFramework();
    }
  }

  initializeFramework() {
    if (this.layoutNode) {
      this.options = cloneDeep(this.layoutNode.options);
      this.widgetLayoutNode = {
        ...this.layoutNode,
        options: cloneDeep(this.layoutNode.options)
      };
      this.widgetOptions = this.widgetLayoutNode.options;
      this.formControl = this.jsf.getFormControl(this);

      this.options.isInputWidget = inArray(this.layoutNode.type, [
        'button', 'checkbox', 'checkboxes-inline', 'checkboxes', 'color',
        'date', 'datetime-local', 'datetime', 'email', 'file', 'hidden',
        'image', 'integer', 'month', 'number', 'password', 'radio',
        'radiobuttons', 'radios-inline', 'radios', 'range', 'reset', 'search',
        'select', 'submit', 'tel', 'text', 'textarea', 'time', 'url', 'week'
      ]);

      this.options.title = this.setTitle();

      this.options.htmlClass =
        addClasses(this.options.htmlClass, 'schema-form-' + this.layoutNode.type);

      
      if (this.layoutNode.type === 'array') {
        this.options.htmlClass = addClasses(this.options.htmlClass, this.widgetStyles.__array__.htmlClass);
      } else if (this.layoutNode.arrayItem && this.layoutNode.type !== '$ref') {
        this.options.htmlClass = addClasses(this.options.htmlClass, this.widgetStyles.__array_item_nonref__.htmlClass);
      } else {
        this.options.htmlClass = addClasses(this.options.htmlClass, this.widgetStyles.__form_group__.htmlClass);
      }
      

      /*
      this.options.htmlClass =
      this.layoutNode.type === 'array' ?
        addClasses(this.options.htmlClass, ['border','shadow-md','p-1']) :
        this.layoutNode.arrayItem && this.layoutNode.type !== '$ref' ?
          addClasses(this.options.htmlClass, ['border','shadow-md','p-1']) :
          addClasses(this.options.htmlClass, 'mb-1');
*/

/*
this.options.htmlClass =
this.layoutNode.type === 'array' ?
addClasses(this.options.htmlClass, this.widgetStyles.array.htmlClass):
  this.layoutNode.arrayItem && this.layoutNode.type !== '$ref' ?
  addClasses(this.options.htmlClass, this.widgetStyles.__array_item_nonref__.htmlClass):
  addClasses(this.options.htmlClass, this.widgetStyles.__form_group__.htmlClass);
*/
          
      this.widgetOptions.htmlClass = '';
      this.options.labelHtmlClass =
        addClasses(this.options.labelHtmlClass, this.widgetStyles.__control_label__.labelHtmlClass);
      this.widgetOptions.activeClass =
        addClasses(this.widgetOptions.activeClass, this.widgetStyles.__active__.activeClass);
      this.options.fieldAddonLeft =
        this.options.fieldAddonLeft || this.options.prepend;
      this.options.fieldAddonRight =
        this.options.fieldAddonRight || this.options.append;

      // Add asterisk to titles if required
      if (this.options.title && this.layoutNode.type !== 'tab' &&
        !this.options.notitle && this.options.required &&
        !this.options.title.includes('*')
      ) {
        let required_asterisk_class=this.widgetStyles.__required_asterisk__||'text-danger'
        this.options.title += ` <strong class="${required_asterisk_class}">*</strong>`;
      }
      if (this.layoutNode.type == 'optionfieldset') {
        this.options.messageLocation = 'top';
      }
      // Set miscelaneous styles and settings for each control type
      this.applyCssClasses(this.layoutNode.type, this.widgetOptions, this.options.style);
      if (this.formControl) {
        this.updateHelpBlock(this.formControl.status);
        this.formControl.statusChanges.subscribe(status => this.updateHelpBlock(status));

        if (this.options.debug) {
          const vars: any[] = [];
          this.debugOutput = map(vars, thisVar => JSON.stringify(thisVar, null, 2)).join('\n');
        }
      }
      this.frameworkInitialized = true;
    }

  }

  updateHelpBlock(status) {
    this.options.helpBlock = status === 'INVALID' &&
      this.options.enableErrorState && this.formControl.errors &&
      (this.formControl.dirty || this.options.feedbackOnRender) ?
      this.jsf.formatErrors(this.formControl.errors, this.options.validationMessages) :
      this.options.description || this.options.help || null;
  }

  setTitle(): string {
    switch (this.layoutNode.type) {
      case 'button':
      case 'checkbox':
      case 'section':
      case 'help':
      case 'msg':
      case 'submit':
      case 'message':
      case 'tabarray':
      case 'tabs':
      case '$ref':
        return null;
      case 'advancedfieldset':
        this.widgetOptions.expandable = true;
        this.widgetOptions.title = 'Advanced options';
        return null;
      case 'authfieldset':
        this.widgetOptions.expandable = true;
        this.widgetOptions.title = 'Authentication settings';
        return null;
      case 'fieldset':
        this.widgetOptions.title = this.options.title;
        return null;
      default:
        this.widgetOptions.title = null;
        return this.jsf.setItemTitle(this);
    }
  }

  removeItem() {
    this.jsf.removeItem(this);
  }
}
