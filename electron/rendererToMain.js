/* This file processes all renderer processes => main process calls
 */
const path = require('path')
const fs = require('fs')
// var GDBManager = require('./gdbEntry.js');
var windowsManager = require('./windowsManager.js');
var pygdbController = require('./pygdbController.js')
var compilerController = require('./compilerController.js')

global.share.ipcMain.handle('electronLog', (event, ...args) => {
  console.log(args)
})

global.share.ipcMain.handle('requestOpenConfig', (event, ...args) => {
  let rawdata = fs.readFileSync(`${path.join(__dirname, '../config/gdb.json')}`);
  let setting = JSON.parse(rawdata);

  if (windowsManager.isDebugMode()) {
    console.log(setting);
  }
  
  const configWindow = windowsManager.getConfigWindow()
  if (configWindow != null) {
    configWindow.focus()
    return
  }

  const newConfigWindow = new global.share.BrowserWindow({
    width: 600,
    height: 250,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      show: true,
    }
  })
  newConfigWindow.on('close', function () { //   <---- Catch close event
    if (windowsManager.isDebugMode()) {
      console.log("config window closed")
    }
    windowsManager.setConfigWindow(null)
  });
  
  if (windowsManager.isDebugMode()) {
    newConfigWindow.loadURL('http://localhost:3000/Configuration')
    newConfigWindow.webContents.openDevTools();
  } else {
    newConfigWindow.loadURL(`file://${path.join(__dirname, '../build/index.html#Configuration')}`)
  }
  windowsManager.setConfigWindow(newConfigWindow)
})

global.share.ipcMain.handle('requestSwitchMode', (event, ...args) => {
  const mainWindow = windowsManager.getMainWindows()
  if (mainWindow !== null) {
    mainWindow.webContents.send('distributeSwitchMode', { 'theme': args[0] });
  }
})

global.share.ipcMain.handle('requestStartGDB', (event, ...args) => {
  // let ifStartGDB = GDBManager.startGDB();

  // if (ifStartGDB) {
  //   GDBManager.startRunAndStop();
  // }
  
  pygdbController.startController();

  pygdbController.pygdbReproduceBreakpoint();

  return true;
  // return ifStartGDB
  // return Promise.resolve(ifStartGDB);
})

global.share.ipcMain.handle('requestNextLineGDB', (event, ...args) => {
  pygdbController.pygdbNextLine();
})

global.share.ipcMain.handle('requestStepGDB', (event, ...args) => {
  pygdbController.pygdbStepin();
})

global.share.ipcMain.handle('requestAddBreakpoint', (event, ...args) => {
  pygdbController.pygdbAddBreakpoint(args[0]);
})

global.share.ipcMain.handle('requestDeleteBreakpoint', (event, ...args) => {
  pygdbController.pygdbDeleteBreakpoint(args[0]);
})

global.share.ipcMain.handle('requestReproduceBreakpoint', (event, ...args) => {
  pygdbController.pygdbReproduceBreakpoint(args[0]);
})

global.share.ipcMain.handle('requestCleanupBreakpoint', (event, ...args) => {
  pygdbController.pygdbCleanupBreakpoint(args[0]);
})

global.share.ipcMain.handle('requestContinueGDB', (event, ...args) => {
  pygdbController.pygdbContinue();
})

global.share.ipcMain.handle('requestStopGDB', (event, ...args) => {
  const mainWindow = windowsManager.getMainWindows()
  if (mainWindow !== null) {
    mainWindow.webContents.send('distributeEditorUserProgramExited', {});
  }
  pygdbController.pygdbFIN();
})

global.share.ipcMain.handle('sendMsgToGDB', (event, ...args) => {
  console.log(args[0])

  if (args[0] == "getStack") {
    // GDBManager.getStack()
  } else if (args[0] == "getSources") {
    // GDBManager.getSourceFiles()
  } else if (args[0] == "getLocals") {
    // GDBManager.getLocals()
    pygdbController.pygdbGetLocal();
  } else if (args[0] == "getDetailedLocals") {
    // GDBManager.getDetailedLocals()
  } else {
    // GDBManager.execGdbCommand(args[0]);
    pygdbController.pygdbCustomCommand(args[0]);
  }
})

global.share.ipcMain.handle('requestInitialSetting', (event, ...args) => {
  return windowsManager.getSettingInitial()
})

global.share.ipcMain.handle('requestSelectProjectFolder', async (event, ...args) => {
  const result = await global.share.dialog.showOpenDialog(windowsManager.getMainWindows(), {
    properties: ['openDirectory']
  })

  let projectFolder = "";
  if (result.filePaths.length !== 0) {
    projectFolder = result.filePaths[0]
  }

  windowsManager.setProjectFolder(false, projectFolder)

  const mainWindow = windowsManager.getMainWindows()
  if (mainWindow !== null) {
    mainWindow.webContents.send('distributeSelectedFolderRes', { 'projectFolder': projectFolder });
  }
})

global.share.ipcMain.handle('requestSelectSourceFile', async (event, ...args) => {
  const result = await global.share.dialog.showOpenDialog(windowsManager.getMainWindows(), {
    defaultPath: args[1]
  })

  if (result.canceled) {
    return
  } else {
    windowsManager.setSourceFile(false, result.filePaths[0])

    const mainWindow = windowsManager.getMainWindows()
    if (mainWindow !== null) {
      mainWindow.webContents.send('distributeSelectedExecutable', { 'executablePath': windowsManager.getExecFile() });

      const data = fs.readFileSync(result.filePaths[0], {encoding:'utf-8', flag:'r'});
      console.log(data);
      

      mainWindow.webContents.send('distributeFileData', { 'fileData': data });
    }
  }
})

global.share.ipcMain.handle('requestCompilation', async (event, ...args) => {
  // windowsManager.setExecFile(result.filePaths[0]);
  compilerController.compile();
})

// global.share.ipcMain.handle('showFile', async (event, ...args) => {

//   const data = fs.readFileSync(args[0], {encoding:'utf-8', flag:'r'});
//   console.log(data);
  
//   const mainWindow = windowsManager.getMainWindows()
//   if (mainWindow !== null) {
//     mainWindow.webContents.send('distributeFileData', { 'fileData': data });
//   }
  
// })