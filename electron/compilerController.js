const path = require('path')
const fs = require('fs')
var windowsManager = require('./windowsManager.js');
var child_process = require('child_process');

const gccCompilerExec = 'gcc';

exports.compile = function () {   
    l_gcc_compilation_child_process = child_process.spawn(gccCompilerExec, ['-g', '"' + windowsManager.getSourceFile() + '"'], {
        shell: true,
    });

    l_gcc_compilation_child_process.stdout.on('data', function (data) {
        console.log('[gcc stdout]' + data);
    });

    l_gcc_compilation_child_process.stderr.on('data', function(data) {
        console.log('[gcc stderr]' + data);
    });

    l_gcc_compilation_child_process.on('close', function (code) {
        console.log('gcc instance exited with code ' + code)
    });
}