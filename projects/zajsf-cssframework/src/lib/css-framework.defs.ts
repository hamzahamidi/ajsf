import { InjectionToken } from "@angular/core";

export const CSS_FRAMEWORK_CFG = new InjectionToken<css_fw.frameworkcfg>('CSS_FRAMEWORK_CFG');

export namespace css_fw{

    export type themeKV=
    { 
        name:string,
        text:string
     }

    export class csscategories{
        fieldHtmlClass?:string|string[]
        labelHtmlClass?:string|string[]
        htmlClass?:string|string[]
        itemLabelHtmlClass?:string|string[]
        activeClass?:string|string[]
    }

    export type widgetstyles={
        '$ref'?:csscategories,
        'alt-date'?:csscategories,
        'alt-datetime'?:csscategories,
        __themes__?:themeKV[],
        __array_item_nonref__:csscategories,
        __form_group__:csscategories,
        __control_label__:csscategories,
        __active__:csscategories,
        __required_asterisk__:string,
        __array__:csscategories,
        '__remove_item__':string,
        __help_block__:string,
        __field_addon_left__:string
        __field_addon_right__:string,
        __screen_reader__:string,
        array:csscategories,
        authfieldset?:csscategories,
        advancedfieldset?:csscategories,
        button?:csscategories,
        checkbox?:csscategories,
        checkboxes?:csscategories,
        checkboxbuttons?:csscategories,
        'checkboxes-inline'?:csscategories,
        date?:csscategories,
        'datetime-local'?:csscategories,
        fieldset?:csscategories,
        integer?:csscategories,
        number?:csscategories,
        optionfieldset?:csscategories,
        password?:csscategories,
        radiobuttons?:csscategories,
        radio?:csscategories,
        radios?:csscategories,
        "radios-inline"?:csscategories,
        'range'?:csscategories,
        section?:csscategories,
        selectfieldset?:csscategories,
        select?:csscategories,
        submit?:csscategories,
        text?:csscategories,
        tabs?:csscategories,
        tabarray?:csscategories,
        textarea?:csscategories,
        default:csscategories
    }
    export type frameworkcfg={
        name:string,
        text:string;
        stylesheets:string[],
        scripts?:string[],
        widgetstyles:widgetstyles,
        widgets?:any;
    }

    

}