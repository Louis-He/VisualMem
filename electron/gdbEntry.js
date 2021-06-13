var windowsManager = require('./windowsManager.js');
var child_process = require('child_process');

var l_gdb_instance = null;
var l_stdout_buffer = "";
var l_stderr_buffer = "";


exports.execGdbCommand = function (message) {
  if (l_gdb_instance === null) {
    throw "GDB Instance not started"
  }

  l_gdb_instance.stdin.write(message + '\n')
}


exports.clearBufferAndExecGdbCommand = function (inputCommand) {
  l_stdout_buffer = "";
  l_stderr_buffer = "";
  
  this.execGdbCommand(inputCommand);
}


exports.startGDB = function () {
  windowsManager.debugLog("startGDB")
  if (windowsManager.getExecFile() === "") {
    windowsManager.debugLog("Exec File Not Set Properly.")
    return
  }

  if (l_gdb_instance === null) {
    windowsManager.debugLog("create new GDB instance")
    l_gdb_instance = child_process.spawn('gdb', [windowsManager.getExecFile()], {
      shell: true,
    });

    l_gdb_instance.stdout.on('data', function (data) {
      windowsManager.debugLog('stdout: ' + data);
      l_stdout_buffer += data
    });

    l_gdb_instance.stderr.on('data', function (data) {
      windowsManager.debugLog('stderr: ' + data);
      l_stderr_buffer += data
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

function sleep(milliseconds) {  
  return new Promise(resolve => setTimeout(resolve, milliseconds));  
}
   
async function l_waitUntilCommandDone (callBack) {
  while (l_stdout_buffer.indexOf("(gdb)") == -1) {
    await sleep(100);  
  };
  return callBack();
}

exports.startRunAndStop = function () {
  this.execGdbCommand("b main")
  this.execGdbCommand("r")
}

var getStackCallbackFunc = function l_getStackCallback() {
  var lines = l_stdout_buffer.split('\n')
  let re = /#(\d+)\s+(\w+) \(([^.]+)?\) at ([\.,\\,\/,\w+]+):(\d+)/;
  let re2 = /#(\d+)\s+(0x[\d,\w]+) in (\w+) \(([^.]+)?\) at ([\.,\\,\/,\w+]+):(\d+)/;
  
  let stackInfo = []
  let firstLine = true
  for (var i = 0; i < lines.length; i++) {
    let match
    if (firstLine) {
      match = lines[i].match(re)
      if (match === null) { continue }
      stackInfo.push(
        {
          "depth": match[1],
          "funcName": match[2],
          "params": match[3],
          "sourceFile": match[4],
          "sourceFileLine": match[5]
        }
      )
      firstLine = false
    } else {
      match = lines[i].match(re2)
      if (match === null) { continue }
      stackInfo.push(
        {
          "depth": match[1],
          "funcAdd": match[2],
          "funcName": match[3],
          "params": match[4],
          "sourceFile": match[5],
          "sourceFileLine": match[6]
        }
      )
    }
  }
  
  return {"stackInfo": stackInfo}
}

exports.getStack = async function () {
  this.clearBufferAndExecGdbCommand("info stack")
  let stackInfo = await l_waitUntilCommandDone(getStackCallbackFunc)
  windowsManager.debugLog(stackInfo)

  return stackInfo
}


var getSourceFilesCallbackFunc = function l_getStackCallback() {
  windowsManager.debugLog("getSourceFiles Ready")

  var lines = l_stdout_buffer.split('\n')
  
  var beenReadFiles = []
  var onDemandFiles = []
  var haveBeenReadSection = false
  var readOnDemandSection = false
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].indexOf("symbols have been read in") != -1) {
      haveBeenReadSection = true
      continue
    } else if (lines[i].indexOf("read in on demand") != -1) {
      haveBeenReadSection = false
      readOnDemandSection = true
      continue
    } else if (lines[i].indexOf("(gdb)") != -1) {
      readOnDemandSection = false
      continue
    }

    let line = lines[i]
    line = line.replace("\r", "")
    line = line.replace("\n", "")
    line = line.replace(",", "")
    if (line.length <= 1) { continue }
    if (haveBeenReadSection) {
      beenReadFiles.push(line)
    } else if (readOnDemandSection) {
      onDemandFiles.push(line)
    }
  }

  return {
    "beenReadFiles": beenReadFiles,
    "onDemandFiles": onDemandFiles
  }
}

exports.getSourceFiles = async function () {
  this.clearBufferAndExecGdbCommand("info sources")
  let sourceFiles = await l_waitUntilCommandDone(getSourceFilesCallbackFunc)
  windowsManager.debugLog(sourceFiles)

  return sourceFiles
}


exports.stopGDB = function () {
  if (l_gdb_instance === null) {
    windowsManager.debugLog("No GDB instance running")
  } else {
    l_gdb_instance.stdin.write('q\n')

    windowsManager.debugLog("Stop GDB instance")
  }
}