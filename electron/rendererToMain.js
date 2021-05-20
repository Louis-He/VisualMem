/* This file processes all renderer processes => main process calls
 */
const path = require('path')
const fs = require('fs')
var GDBManager = require('./gdbEntry.js');

var windowsManager = require('./windowsManager.js');

global.share.ipcMain.handle('requestOpenConfig', (event, ...args) => {
  let rawdata =fs.readFileSync(`${path.join(__dirname, '../config/gdb.json')}`);
  let gdbSetting = JSON.parse(rawdata);

  if (windowsManager.isDebugMode()) {
    console.log(gdbSetting);
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
  if (mainWindow != null) {
    mainWindow.webContents.send('distributeSwitchMode', { 'theme': args[0] });
  }
})

global.share.ipcMain.handle('requestStartGDB', (event, ...args) => {
  GDBManager.startGDB();
})

global.share.ipcMain.handle('requestStopGDB', (event, ...args) => {
  GDBManager.stopGDB();
})