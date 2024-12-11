/**
 * aim of this script is to extract all of the css class names that are used
 * in daisyui, it must be supplied a stylePath
 * (for daisyui 3.7 this is typically un der ./node_modules/daisyui/dist/full.css) 
 * and an outputFile(typically zajsf-daisyui/src/daisyui_class_names.css)
 * the script will then try to enumerate all of the css class names
 * the reason this is done is: when the tailwind cli attempts to build the 
 * tailwind-output.scss file, it will include all of the css classes that are scanned
 * so it should also include all of the classes that were extracted into daisyui_class_names.css
 * if build size is large, then should maybe only use this for development
 */

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const path = require('path');
const fs = require('fs').promises;
const minimist = require('minimist');

// Read command line arguments
const args = minimist(process.argv.slice(2), {
    boolean: ['all'],
    string: ['stylePath', 'outputPath', 'outputFormat', 'classPrefix'],
    alias: {
        stylePath: 's',
        outputPath: 'o',
        outputFormat: 'f',
        classPrefix: 'p'

    },
    default: {
        outputFormat: 'css', //can be  json|css
        outputPath: 'css_class_names.css'
    }
});

// Check if stylePath is defined
if (!args.stylePath) {
    console.error('Error: stylePath is required');
    process.exit(1);
}


var htmlDoc = `
<!DOCTYPE html>
<html><meta http-equiv="content-type" content="text/html; charset=utf-8">
    <head>
    </head>
    <body>
    </body>
</html>
`
let stylePath = args.stylePath;
let cwd = process.cwd()
var classes;
fs.readFile(path.join(cwd, stylePath), { encoding: 'utf-8' }).then(readRes => {
    let mainCss = readRes;

    var dom = new JSDOM(htmlDoc, {
        resources: "usable"
    });
    var doc = dom.window.document
    var head = doc.getElementsByTagName('head')[0];
    style = doc.createElement("style");
    style.type = 'text/css';
    style.innerHTML = mainCss;
    head.appendChild(style);

    classes = getClassNames(doc, args.classPrefix);
    console.log(Object.keys(classes).length + " class names to be written");
    let cssTxt = args.outputFormat == "json" ? JSON.stringify(classes) : classesMap2Css(classes);
    return fs.writeFile(args.outputPath, cssTxt);
}).then(wfres => {
    // Object.keys(classes).forEach(cname => {
    //     fs.write(cname + ',').then(wfres => {

    //     }).catch(werr => {
    //         console.log(werr);
    //     })
    // })
}).catch(err => {
    console.log(err);
})



//doc.styleSheets[0].cssRules[0].cssText

function classesMap2Css(classMap) {
    let cssTxt = "";
    Object.keys(classMap).forEach(cname => {
        cssTxt += cname + " {}"
    })
    return cssTxt;
}

function getClassNames(doc, prefix) {
    var sheet, sheets = doc.styleSheets;
    var rule, rules;
    var classes = {};
    var temp;
    var identifier =
        /(?:[A-Za-z0-9_-]|[^\0-\237]|\\(?:[^A-Fa-f0-9]|[A-Fa-f0-9]{1,6} ?))+/;
    var classInSelector = new RegExp('\\.(' + identifier.source + ')',
        'gm');
    for (var i = 0, iLen = sheets.length; i < iLen; i++) {
        sheet = sheets[i];
        rules = sheet.cssRules;

        for (var j = 0, jLen = rules.length; j < jLen; j++) {
            rule = rules[j];

            // Get the classes
            temp = rule.cssText.match(classInSelector)
                //rule.cssText.match(/\.\w+/g);

            if (temp) {
                let cname = temp[0];
                if (cname.substring(1).match(/^\d/)) {
                    cname = '\\' + cname
                }
                let fcname = cname;
                if (prefix) {
                    fcname = "." + prefix + "-" + cname.split(".")[1];
                }

                classes[fcname] = {}
            }
        }
    }
    // Return an array of the classes
    return classes;

}