/* This file processes all renderer processes => main process calls
 */
const path = require('path')
const fs = require('fs')
var GDBManager = require('./gdbEntry.js');

var windowsManager = require('./windowsManager.js');

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
  GDBManager.startGDB();
  GDBManager.startRunAndStop();
})

global.share.ipcMain.handle('requestStopGDB', (event, ...args) => {
  GDBManager.stopGDB();
})

global.share.ipcMain.handle('sendMsgToGDB', (event, ...args) => {
  console.log(args[0])

  if (args[0] == "getStack") {
    GDBManager.getStack()
  } else if (args[0] == "getSources") {
    GDBManager.getSourceFiles()
  } else {
    GDBManager.execGdbCommand(args[0]);
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

  windowsManager.setProjectFolder(projectFolder)

  const mainWindow = windowsManager.getMainWindows()
  if (mainWindow !== null) {
    mainWindow.webContents.send('distributeSelectedFolderRes', { 'projectFolder': projectFolder });
  }
})

global.share.ipcMain.handle('requestSelectExecutable', async (event, ...args) => {
  const result = await global.share.dialog.showOpenDialog(windowsManager.getMainWindows(), {
    defaultPath: args[1]
  })

  if (result.canceled) {
    return
  } else {
    windowsManager.setExecFile(result.filePaths[0])
  }
})