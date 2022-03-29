var windowsManager = require('./windowsManager.js');
var child_process = require('child_process');
var pygdbController = require('./pygdbController.js')
// const { isCompositeComponent } = require('react-dom/test-utils');

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

exports.gdbLog = function (logMessage) {
  console.log(logMessage);
}

// Return true if new GDB session attached
exports.startGDB = function () {
  return pygdbController.startController();

  // var that = this
  // this.gdbLog("startGDB")
  // if (windowsManager.getExecFile() === "") {
  //   windowsManager.debugLog("Exec File Not Set Properly.")
  //   return false
  // }

  // if (l_gdb_instance === null) {
  //   windowsManager.debugLog("create new GDB instance")
  //   l_gdb_instance = child_process.spawn('gdb', [windowsManager.getExecFile()], {
  //     shell: true,
  //   });

  //   l_gdb_instance.stdout.on('data', function (data) {
  //     windowsManager.debugLog('stdout: ' + data);

  //     l_stdout_buffer += data
  //     if (l_stdout_buffer.includes(" exited with code ")) {
  //       that.stopGDB()
  //       const mainWindow = windowsManager.getMainWindows()
  //       mainWindow.webContents.send('distributeUserProgramExited', {});
  //     }
  //   });

  //   l_gdb_instance.stderr.on('data', function (data) {
  //     windowsManager.debugLog('stderr: ' + data);
  //     l_stderr_buffer += data
  //   });

  //   l_gdb_instance.on('close', function (code) {
  //     windowsManager.debugLog('GDB instance exited with code ' + code)
  //     l_gdb_instance = null
  //     l_stdout_buffer = ""
  //     l_stderr_buffer = ""
  //   });
  //   return true
  // } else {
  //   windowsManager.debugLog("GDB instance is running")
  //   return false
  // }
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
  this.execGdbCommand("set startup-with-shell off")
  this.execGdbCommand("b main")
  this.execGdbCommand("r")
}


// notifyMainWindow = function () {
//   if (l_gdb_instance !== null) {
//     const mainWindow = windowsManager.getMainWindows()
//     mainWindow.webContents.send('distributeGDBUpdate', {});
//   }
// }

exports.nextLineExecute = function () {
  pygdbController.pygdbNextLine();

  // this.clearBufferAndExecGdbCommand("n")
  // l_waitUntilCommandDone(notifyMainWindow)
}

exports.continueExecute = function () {
  pygdbController.pygdbContinue();

  // this.clearBufferAndExecGdbCommand("c")
  // l_waitUntilCommandDone(notifyMainWindow)
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


function decodeGDBSingleVarStmt(varStmt) {
  while (varStmt[0] === " ") {
    varStmt = varStmt.substring(1)
  }

  if (varStmt === "") { return {} }

  let equalIdx = varStmt.indexOf('=')
  if (equalIdx !== -1) {
    // handle case: varName = 
    if (equalIdx + 2 >= varStmt.length) {
      return {
        "name": varStmt.substring(0, equalIdx - 1)
      }
    }

    // handle case: varName = varVal
    return {
      "name": varStmt.substring(0, equalIdx - 1),
      "value": varStmt.substring(equalIdx + 2)
    }
  } else {
    // handle case: varVal
    return {
      "value": varStmt
    }
  }
}


// include left, but not right
function decodeGDBVarOutput(segmentLine) {
  if (segmentLine[0] === ',') {
    segmentLine = segmentLine.substring(1)
  }
  let variableArr = []

  var commaIdx
  while ( (commaIdx = segmentLine.indexOf(',')) !== -1 ) {
    let varRes = decodeGDBSingleVarStmt(segmentLine.substring(0, commaIdx))
    if (varRes.name !== undefined && varRes.value !== undefined) {
      variableArr.push(varRes)
    } else if (varRes.name !== undefined && varRes.value === undefined) {
      variableArr.push(varRes)
    } else if (varRes.name === undefined && varRes.value !== undefined) {
      if (variableArr.length === 0) {
        variableArr = [{"value": [varRes.value]}]
      } else {
        variableArr[0].value.push(varRes.value)
      }
    }

    segmentLine = segmentLine.substring(commaIdx + 2)
  }

  let varRes = decodeGDBSingleVarStmt(segmentLine)
  if (varRes.name !== undefined && varRes.value !== undefined) {
    variableArr.push(varRes)
  } else if (varRes.name !== undefined && varRes.value === undefined) {
    variableArr.push(varRes)
  }
  
  return variableArr
}


function l_printBracketInfo(variableLine, bracketInfo) {
  var variableDict = []
  
  var currentLeft = bracketInfo.left + 1
  var currentRight = bracketInfo.right

  let hasChildren = false
  for (var i = 0; i < bracketInfo.children.length; i++) {
    currentRight = bracketInfo.children[i].left
    var variableArr = decodeGDBVarOutput(variableLine.substring(currentLeft, currentRight))
    // console.log(variableLine.substring(currentLeft, currentRight))
    // console.log(variableArr)
    
    if (variableArr.length >= 0 && variableArr[variableArr.length - 1].value === undefined) {
      let retDict = l_printBracketInfo(variableLine, bracketInfo.children[i])
      variableArr[variableArr.length - 1].value = retDict
    }

    variableDict = variableDict.concat(variableArr)
    hasChildren = true
    currentLeft = bracketInfo.children[i].right + 1
  }

  currentRight = bracketInfo.right
  var variableArr = decodeGDBVarOutput(variableLine.substring(currentLeft, currentRight))
  // console.log(variableLine.substring(currentLeft, currentRight))
  // console.log(variableArr)
  variableDict = variableDict.concat(variableArr)
  // console.log(variableDict)
  return variableDict
}

function l_printVariableDict(variableDict) {
  variableDict.forEach(element => {
    if (typeof element.value === 'object') {
      if (element.name !== undefined) {
        console.log(element.name + ": ")
      }
      l_printVariableDict(element.value)
    } else {
      if (element.value === undefined) {
        console.log(element)
      } else {
        console.log(element.name + ': ' + element.value)
      }
    }
  });
}

function l_parseVarVal(variableLine) {
  while (variableLine[0] == " ") {
    variableLine = variableLine.substring(1, variableLine.length)
  }

  // console.log(variableLine)

  var currentDepth = 0
  var bracketInfo = {"left": -1, "right": variableLine.length, "children": []}
  for (var i = 0; i < variableLine.length; i++) {
    if (variableLine[i] === '{') {      
      let targetedJson = bracketInfo
      for (var level = 0; level < currentDepth; level++) {
        targetedJson = targetedJson.children[targetedJson.children.length - 1]
      }

      targetedJson.children.push({ "left": i, "right": -1, children: [] })
      
      currentDepth++
    } else if (variableLine[i] === '}') {
      let targetedJson = bracketInfo
      for (var level = 0; level < currentDepth; level++) {
        targetedJson = targetedJson.children[targetedJson.children.length - 1]
      }

      targetedJson["right"] = i
      currentDepth--
    }
  }

  variableDict = l_printBracketInfo(variableLine, bracketInfo)
  // l_printVariableDict(variableDict)
  return variableDict
}

function l_parseLocals(locals_stdout_buffer) {
  var lines = locals_stdout_buffer.split('\n')
  var localVars = []

  let line = ""
  for (var i = 0; i < lines.length; i++) {
    lines[i] = lines[i].replace("\r", "")
    if (lines[i][0] == ' ') {
      line += lines[i]
      continue
    } else {
      if (line != "") {
        // var variableName = line.substring(0, line.indexOf("="))
        // variableName = variableName.replace(" ", "")
        // var variableVal = line.substring(line.indexOf("=") + 1, line.length)
        
        // console.log(variableName)
        // localVars.push(variableName)
        localVars.push(l_parseVarVal(line))
      }
      line = lines[i]
    }
  }

  return localVars
}

var getLocalsCallbackFunc = function l_getLocalsCallback() {
  windowsManager.debugLog("getLocals Ready")

  return l_parseLocals(l_stdout_buffer)
}

exports.getLocals = async function () {
  pygdbController.pygdbGetLocal()

  // this.clearBufferAndExecGdbCommand("info locals")
  // let localVars = await l_waitUntilCommandDone(getLocalsCallbackFunc)

  // return localVars
}


exports.getDetailedLocals = async function () {
  this.clearBufferAndExecGdbCommand("info locals")
  let localVars = await l_waitUntilCommandDone(getLocalsCallbackFunc)
  console.log(localVars)

  const mainWindow = windowsManager.getMainWindows()
  mainWindow.webContents.send('distributeDetailedLocals', { 'locals': localVars });
}

var getDisassemblyCallbackFunc = function l_getStackCallback() {
  windowsManager.debugLog("getDisassemblyCallbackFunc Ready")

  var lines = l_stdout_buffer.split('\n')
  
  for (var i = 0; i < lines.length; i++) {
    
  }

  return {
    "beenReadFiles": beenReadFiles,
    "onDemandFiles": onDemandFiles
  }
}

exports.getDisassemble = async function () {
  this.clearBufferAndExecGdbCommand("disas /m $pc-20, $pc+20")
  let disas = await l_waitUntilCommandDone(getDisassemblyCallbackFunc)
  console.log(disas)

  // const mainWindow = windowsManager.getMainWindows()
  // mainWindow.webContents.send('distributeDetailedLocals', { 'locals': localVars });
}

exports.stopGDB = function () {
  pygdbController.pygdbFIN();

  // if (l_gdb_instance === null) {
  //   windowsManager.debugLog("No GDB instance running")
  // } else {
  //   l_gdb_instance.stdin.write('q\n')

  //   windowsManager.debugLog("Stop GDB instance")
  // }
}
