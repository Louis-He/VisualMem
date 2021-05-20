/* This file stores all global variables, do not explicitly expose variables.
 * Use get and set functions instead.
 */

var l_mainWindow = null;
var l_configWindow = null;
var l_debug = false;

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
  //validate the name...
  l_mainWindow = win;
};

exports.getConfigWindow = function() {
  return l_configWindow;
};

exports.setConfigWindow = function(win) {
  //validate the name...
  l_configWindow = win;
};