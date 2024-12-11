import { css_fw } from "@zajsf/cssframework";

export const cssFrameworkCfgBootstrap3:css_fw.frameworkcfg={
    "name": "bootstrap-3",
    "text":"Bootstrap 3",
    "stylesheets": [
        "//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css",
        "//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap-theme.min.css"
    ],

    "scripts": [
        "//ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js",
        "//ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js",
        "//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"
    ],

    "widgetstyles": {
        "__themes__": [
            {"name":"bootstrap3_default","text":"Bootstrap3 default"}
        ],
        "$ref": {
            "fieldHtmlClass": "btn pull-right btn-info"
        },
        "__array_item_nonref__": {
            "htmlClass": "list-group-item"
        },
        "__form_group__": {
            "htmlClass": "form-group"
        },
        "__control_label__": {
            "labelHtmlClass": "control-label"
        },
        "__active__": {
            "activeClass": "active"
        },
        "__required_asterisk__": "text-danger",
        "__screen_reader__": "sr-only",
        "__remove_item__": "close pull-right",
        "__help_block__": "help-block",
        "__field_addon_left__": "input-group-addon",
        "__field_addon_right__": "input-group-addon",
        "alt-date": {},
        "alt-datetime": {},
        "__array__": {
            "htmlClass": "list-group"
        },
        "array": {},
        "authfieldset": {},
        "advancedfieldset": {},
        "button": {
            "fieldHtmlClass": "btn btn-sm btn-primary"
        },
        "checkbox": { "fieldHtmlClass": "checkbox" },
        "checkboxes": {
            "fieldHtmlClass": "checkbox"
        },
        "checkboxbuttons": {
            "fieldHtmlClass": "sr-only",
            "htmlClass": "btn-group",
            "itemLabelHtmlClass": "btn"
        },
        "checkboxes-inline": {
            "htmlClass": "checkbox",
            "itemLabelHtmlClass": "checkbox-inline"
        },
        "date": {},
        "datetime-local": {},
        "fieldset": {},
        "integer": {},
        "number": {},
        "optionfieldset": {},
        "password": {},
        "radiobuttons": {
            "fieldHtmlClass": "sr-only",
            "htmlClass": "btn-group",
            "itemLabelHtmlClass": "btn"
        },
        "radio": { "fieldHtmlClass": "radio" },
        "radios": {
            "fieldHtmlClass": "radio"
        },
        "radios-inline": {
            "htmlClass": "radio",
            "itemLabelHtmlClass": "radio-inline"
        },
        "range": {},
        "section": {},
        "selectfieldset": {},
        "select": {},
        "submit": {
            "fieldHtmlClass": "btn btn-primary"
        },
        "text": {},
        "tabs": {
            "labelHtmlClass": "nav nav-tabs",
            "htmlClass": "tab-content",
            "fieldHtmlClass": "tab-pane"
        },
        "tabarray": {
            "labelHtmlClass": "nav nav-tabs",
            "htmlClass": "tab-content",
            "fieldHtmlClass": "tab-pane"
        },
        "textarea": {},
        "default": {
            "fieldHtmlClass": "form-control"
        }
    }
}