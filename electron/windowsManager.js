/* This file stores all global variables, do not explicitly expose variables.
 * Use get and set functions instead.
 */

var l_mainWindow = null;
var l_configWindow = null;
var l_debug = false;
var l_project_folder = "";

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

exports.setProjectFolder = function(projectFolder) {
  l_project_folder = projectFolder;
};