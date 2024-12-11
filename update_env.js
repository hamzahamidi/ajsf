//this will update the environment files with the
//package version info
var fs = require("fs");
var pakjson = require('./package.json');
var pakjsonAng = require('./node_modules/@angular/core/package.json');
var pakjsonMat = require('./node_modules/@angular/material/package.json');
console.log(`updating environment files with v${pakjson.version}...`);
const envFiles = [
    './demo/environments/environment.ts',
    './demo/environments/environment.prod.ts'
]

function backupFiles() {
    console.log(`backing up files...`);
    envFiles.forEach(fpath => {
        fs.copyFileSync(fpath, fpath + ".bak");
    })
}

function renameFiles() {
    console.log(`renaming files...`);
    envFiles.forEach(fpath => {
        let newPath = fpath.split('.ts').join('.mjs')
        fs.renameSync(fpath, newPath);
    })

}

function getPackageInfo() {
    return {
        version: pakjson.version,
        angularVersion: pakjsonAng.version,
        //pakjson.dependencies && pakjson.dependencies["@angular/core"],
        materialVersion: pakjsonMat.version
            //pakjson.dependencies && pakjson.dependencies["@angular/material"]
    }
}


function writeFile(environmentData, outputPath) {
    console.log(`writing out file ${outputPath}`);
    let env = environmentData;
    //env.version = pakjson.version;
    let pakInfo = getPackageInfo();
    Object.assign(env, pakInfo);
    let fileData = `
    export const environment =${JSON.stringify(env)}
    `
    fs.writeFileSync(outputPath, fileData);

}

function processFile(importPath, outputPath) {
    return import (importPath).then(envmod => {
        let envData = envmod.environment;
        writeFile(envData, outputPath);
        console.log(`removing ${importPath}...`);
        fs.rmSync(importPath);
        console.log(`removing ${outputPath}.bak...`);
        fs.rmSync(outputPath + '.bak');
    })
}

function processAll() {
    let mainProm = Promise.resolve(true);
    envFiles.forEach(fpath => {
        let importPath = fpath.split('.ts').join('.mjs');
        let outputPath = fpath;
        mainProm = mainProm.then(tr => {
            return processFile(importPath, outputPath)
        })
    })
    mainProm.catch(err => {
        console.log(err);
        process.exit(1);
    })
}

backupFiles();
renameFiles();
processAll();