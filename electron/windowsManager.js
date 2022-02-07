/* This file stores all global variables, do not explicitly expose variables.
 * Use get and set functions instead.
 */
const path = require('path')
const fs = require('fs')

var l_mainWindow = null;
var l_configWindow = null;
var l_debug = true;
var l_project_folder = "";
var l_exec_file = "";
var l_source_file = "";

exports.isDebugMode = function() {
  return l_debug;
};

exports.debugLog = function (msg) {
  if (l_debug) { console.log(msg) }
}
 
exports.getMainWindows = function() {
  return l_mainWindow;
};

exports.setMainWindow = function(win) {
  l_mainWindow = win;
};

exports.getConfigWindow = function() {
  return l_configWindow;
};

exports.setConfigWindow = function(win) {
  l_configWindow = win;
};

exports.getProjectFolder = function() {
  return l_project_folder;
};

exports.getSettingInitial = function () {
  const settingFilePath = `${path.join(__dirname, '../config/gdb.json')}`
  let rawdata = fs.readFileSync(settingFilePath);
  let setting = JSON.parse(rawdata);

  this.setProjectFolder(setting.project_path)
  return setting
}

exports.initialize = function () {
  const settingFilePath = `${path.join(__dirname, '../config/gdb.json')}`
  let rawdata = fs.readFileSync(settingFilePath);
  let setting = JSON.parse(rawdata);
  
  l_exec_file = setting.execFile;
  l_source_file = setting.sourceFile;
  l_project_folder = setting.project_path;
}

exports.setProjectFolder = function (projectFolder) {
  l_project_folder = projectFolder;

  const settingFilePath = `${path.join(__dirname, '../config/gdb.json')}`
  let rawdata = fs.readFileSync(settingFilePath);
  let setting = JSON.parse(rawdata);
  setting.project_path = projectFolder

  // convert JSON object to a string
  const data = JSON.stringify(setting);

  // write file to disk
  fs.writeFile(settingFilePath, data, 'utf8', (err) => {
    if (err) {
      console.log(`Error writing file: ${err}`);
    } else {
      console.log(`File is written successfully!`);
    }
  });
};

exports.getExecFile = function () {
  return l_exec_file
}

exports.setExecFile = function (execFile) {
  l_exec_file = execFile;

  const settingFilePath = `${path.join(__dirname, '../config/gdb.json')}`
  let rawdata = fs.readFileSync(settingFilePath);
  let setting = JSON.parse(rawdata);
  setting.execFile = execFile;

  // convert JSON object to a string
  const data = JSON.stringify(setting);

  // write file to disk
  fs.writeFile(settingFilePath, data, 'utf8', (err) => {
    if (err) {
      console.log(`Error writing file: ${err}`);
    } else {
      console.log(`executablePath: ${execFile}`);
    }
  });
}

exports.getSourceFile = function () {
  return l_source_file
}

exports.setSourceFile = function (sourceFile) {
  l_source_file = sourceFile;

  const sourceFilePath = `${path.join(__dirname, '../config/gdb.json')}`
  let rawdata = fs.readFileSync(sourceFilePath);
  let setting = JSON.parse(rawdata);
  setting.sourceFile = sourceFile;

  // convert JSON object to a string
  const data = JSON.stringify(setting);

  // write file to disk
  fs.writeFile(sourceFilePath, data, 'utf8', (err) => {
    if (err) {
      console.log(`Error writing file: ${err}`);
    } else {
      console.log(`sourceFilePath: ${sourceFile}`);
    }
  });
}
