var windowsManager = require('./windowsManager.js');
var child_process = require('child_process');

var l_gdb_instance = null;

exports.startGDB = function () {
  windowsManager.debugLog("startGDB")

  if (l_gdb_instance === null) {
    windowsManager.debugLog("create new GDB instance")
    l_gdb_instance = child_process.spawn('gdb', {
      shell: true,
    });

    l_gdb_instance.stdout.on('data', function (data) {
      windowsManager.debugLog('stdout: ' + data);
    });

    l_gdb_instance.stderr.on('data', function (data) {
      windowsManager.debugLog('stderr: ' + data);
    });

    l_gdb_instance.on('close', function (code) {
      windowsManager.debugLog('GDB instance exited with code ' + code)
      l_gdb_instance = null
    });
    
  } else {
    windowsManager.debugLog("GDB instance is running")
    return
  }
}

exports.stopGDB = function () {
  if (l_gdb_instance === null) {
    windowsManager.debugLog("No GDB instance running")
  } else {
    l_gdb_instance.stdin.write('q\n')

    windowsManager.debugLog("Stop GDB instance")
  }
}


exports.sendCommand = function (message) {
  if (l_gdb_instance === null) {
    throw "GDB Instance not started"
  }

  l_gdb_instance.stdin.write(message + '\n')
}