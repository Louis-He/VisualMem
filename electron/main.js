const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const root = fs.readdirSync('/')

const debug = false;

var mainWindow = null;
var configWindow = null;

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })
  win.on('close', function() { //   <---- Catch close event
    console.log("Main window closed")
    mainWindow = null
  });

  mainWindow = win

  // win.loadFile('index.html')
  if (debug) {
    win.loadURL('http://localhost:3000/')
    // win.loadURL('http://localhost:3000/Configuration')
    win.webContents.openDevTools();
  } else {
    win.loadURL(`file://${path.join(__dirname, '../build/index.html')}`)
  }
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

// In the Main process
ipcMain.handle('requestOpenConfig', (event, ...args) => {
  let rawdata = fs.readFileSync(`${path.join(__dirname, '../config/gdb.json')}`);
  let gdbSetting = JSON.parse(rawdata);
  console.log(gdbSetting);
  
  if (configWindow != null) {
    configWindow.focus()
    return
  }

  configWindow = new BrowserWindow({
    width: 600,
    height: 250,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      show: true,
    }
  })
  configWindow.on('close', function() { //   <---- Catch close event
    console.log("config window closed")
    configWindow = null
  });
  
  if (debug) {
    configWindow.loadURL('http://localhost:3000/Configuration')
    configWindow.webContents.openDevTools();
  } else {
    configWindow.loadURL(`file://${path.join(__dirname, '../build/index.html#Configuration')}`)
  }
})

ipcMain.handle('requestSwitchMode', (event, ...args) => {
  if (mainWindow != null) {
    mainWindow.webContents.send('distributeSwitchMode', { 'theme': args[0] });
  }
})