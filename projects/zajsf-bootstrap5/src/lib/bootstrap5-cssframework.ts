import { css_fw } from "@zajsf/cssframework";

export const cssFrameworkCfgBootstrap5:css_fw.frameworkcfg={

    "name": "bootstrap-5",
    "text":"Bootstrap 5",
    "scripts": [
        "//cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"
    ],
    "stylesheets": [
        "//cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css",
    ],
    "widgetstyles": {
        "__themes__": [
            {"name":"bootstrap5_default","text":"Bootstrap5 default"},
            {"name":"dark","text":"Dark"},
            {"name":"light","text":"Light"}
        ],
        "$ref": {
            "fieldHtmlClass": "btn float-end btn-info"
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
        "__screen_reader__": "visually-hidden",
        "__remove_item__": "btn-close  float-end",
        "__help_block__": "help-block",
        "__field_addon_left__": "input-group-text",
        "__field_addon_right__": "input-group-text",
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
            "fieldHtmlClass": "visually-hidden",
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
            "fieldHtmlClass": "visually-hidden",
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