const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const root = fs.readdirSync('/')

const debug = true;

var mainWindow = null;

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

  mainWindow = win

  // win.loadFile('index.html')
  if (debug) {
    win.loadURL('http://localhost:3000/')
  } else {
    win.loadURL(`file://${path.join(__dirname, '../build/index.html')}`)
  }

  win.webContents.openDevTools();
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
ipcMain.handle('perform-action', (event, ...args) => {
  let rawdata = fs.readFileSync(`${path.join(__dirname, '../config/gdb.json')}`);
  let gdbSetting = JSON.parse(rawdata);
  console.log(gdbSetting);
  mainWindow.webContents.send('asynchronous-message', { 'SAVED': 'File Saved' });
  
  const win = new BrowserWindow({
    width: 500,
    height: 250,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      show: true,
    }
  })
  win.on('close', function() { //   <---- Catch close event
    console.log("config window closed")
  });
  
  if (debug) {
    win.loadURL('http://localhost:3000/Configuration')
  } else {
    win.loadURL(`file://${path.join(__dirname, '../build/index.html#Configuration')}`)
  }
})