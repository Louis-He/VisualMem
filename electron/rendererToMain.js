/* This file processes all renderer processes => main process calls
 */
const path = require('path')
const fs = require('fs')
// var GDBManager = require('./gdbEntry.js');
var windowsManager = require('./windowsManager.js');
var pygdbController = require('./pygdbController.js')
var compilerController = require('./compilerController.js')
var selectedFilePath = "";

global.share.ipcMain.handle('requesSaveFile', async (event, {data}) => {
//global.share.ipcMain.on('requesSaveFile', async (event, data) => {
  console.log("data")
  const mainWindow = windowsManager.getMainWindows()
  const { filePath, canceled } = await global.share.dialog.showSaveDialog(mainWindow, {
    defaultPath: "text.txt"
  });

  if (filePath && !canceled) {
    const data = new Uint8Array(Buffer.from('Hello Node.js'));
    fs.writeFile(filePath, data, (err) => {
      if (err) throw err;
      console.log('The file has been saved!');
    });
  }
})


global.share.ipcMain.on('saveDialog2', (event, arg) => {
  const mainWindow = windowsManager.getMainWindows();
  let sourceCode = arg.data;
  let filePath = windowsManager.getSourceFile();
  //console.log("--------",filePath);
  fs.writeFile(filePath, sourceCode, (err) => {
    //console.log("Writing files........")
    if(!err){
      //console.log("File Written");
      mainWindow.webContents.send('savedMessage', {'SAVED': 'File Saved'});
    }
    else {
      console.log(err);
      mainWindow.webContents.send('errSaveMassage', {'Error': 'Cannot save file'});
    }
  });
})


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
  pygdbController.startController();
  pygdbController.pygdbReproduceBreakpoint();

  return true;
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

  if (args[0] == "getLocals") {
    pygdbController.pygdbGetLocal();
  } else {
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
      //console.log(data);
      selectedFilePath = result.filePaths[0];
      //console.log("---------", selectedFilePath);
      

      mainWindow.webContents.send('distributeFileData', { 'fileData': data });
    }
  }
})

global.share.ipcMain.handle('requestCompilation', async (event, ...args) => {
  compilerController.compile();
})