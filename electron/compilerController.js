const path = require('path')
const fs = require('fs')
var windowsManager = require('./windowsManager.js');
var child_process = require('child_process');

const gccCompilerExec = 'gcc';

var l_errorMessages = "";

exports.saveSourceFile = function (text) {
    try {
        fs.writeFileSync(windowsManager.getSourceFile(), text, 'utf-8');
    } catch (e) {
        console.error("Source file save failed");
    }
}


exports.compile = function () {   
    l_errorMessages = "";

    l_gcc_compilation_child_process = child_process.spawn(gccCompilerExec, ['-g', '"' + windowsManager.getSourceFile() + '"', '-o', windowsManager.getProjectFolder()+'/'+'out.exe'], {
        shell: true,
    });

    l_gcc_compilation_child_process.stdout.on('data', function (data) {
        console.log('[gcc stdout]' + data);
    });

    l_gcc_compilation_child_process.stderr.on('data', function(data) {
        console.log('[gcc stderr]' + data);
        l_errorMessages += data;
    });

    l_gcc_compilation_child_process.on('close', function (code) {
        console.log('gcc instance exited with code ' + code)
        
        const mainWindow = windowsManager.getMainWindows();
        if (code === 0) {
            mainWindow.webContents.send('CompileSuccess', );
        } else {
            mainWindow.webContents.send('CompileError', l_errorMessages);
        }
    });
}