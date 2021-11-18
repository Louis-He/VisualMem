const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const path = require('path')
var windowsManager = require('./windowsManager.js');

// set global variables here
global.share = {
  BrowserWindow, dialog, ipcMain
};

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    title: "VisualMem",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
      enableRemoteModule: true,
    }
  })
  win.on('close', function () { //   <---- Catch close event
    if (windowsManager.isDebugMode()) {
      windowsManager.debugLog("Main window closed")
    }
    windowsManager.setMainWindow(null)
  });

  if (windowsManager.isDebugMode()) {
    if (windowsManager.isDebugMode()) {
      windowsManager.debugLog("Main window start")
    }
    win.loadURL('http://localhost:3000/')
    win.webContents.openDevTools();
  } else {
    win.loadURL(`file://${path.join(__dirname, '../build/index.html')}`)
  }

  windowsManager.setMainWindow(win)
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// include script that handle renderer processes => main process calls
require('./rendererToMain.js');