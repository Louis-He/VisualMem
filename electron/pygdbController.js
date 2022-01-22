var windowsManager = require('./windowsManager.js');
var child_process = require('child_process');

const net  = require('net');
const port = 4000;

var create_python_session_embedded = true;
var l_pygdb_child_process = null;

var l_pygdb_socket = null;
var l_attached_controller = false;

var isWin = process.platform === "win32";
var isMac = process.platform === "darwin";
var isLinux = process.platform === "linux";

exports.startPygdbSession = function () {
    l_socket = net.createServer(function(socket) {
        l_pygdb_socket = socket;
        socket.write('SYN;0;');

        l_pygdb_socket.on('data', function(data) {
            data = data.toString('ascii');
            
            // l_socket.destroy(); // kill client after server's response
    
            if (data === "SYN") {
                console.log('[Info] Pygdb Connection Established.')
                var execFile = windowsManager.getExecFile()
                socket.write(`INI;${execFile.length};${execFile}`);
            } else {
                console.log('[Info] Received: ' + data);
            }
        });
        
        l_pygdb_socket.on('close', function() {
            console.log('[Info] Connection closed');
        });
    
        // Don't forget to catch error, for your own sake.
        l_pygdb_socket.on('error', function(err) {
            console.log(`[Error] Error: ${err}`);
        });
    });

    l_socket.listen(port, '127.0.0.1');

    // if enabled, the pygdb_interface will be automatically generated here!
    if (create_python_session_embedded) {
        pythonExecName = 'python3';
        if (isWin) {
            pythonExecName = 'python';
        }


        l_pygdb_child_process = child_process.spawn(pythonExecName, ['-u', './pygdbmi/pygdb_interface.py'], {
            shell: true,
        });

        l_pygdb_child_process.stdout.on('data', function (data) {
            console.log('[PyGDB handler stdout]' + data);
        });

        l_pygdb_child_process.stderr.on('data', function(data) {
            console.log('[PyGDB handler stderr]' + data);
        });

        l_pygdb_child_process.on('close', function (code) {
            console.log('PyGDB handler instance exited with code ' + code)
            l_pygdb_child_process = null
        });

    }
}

exports.startController = function () {
    l_pygdb_socket.write("START;0;");
    l_attached_controller = true;

    return true;
}

exports.pygdbNextLine = function () {
    l_pygdb_socket.write("CMD;1;n")
}

exports.pygdbContinue = function () {
    l_pygdb_socket.write("CMD;1;c")
}

exports.pygdbFIN = function () {
    l_pygdb_socket.write("CMD;3;end")
}

exports.pygdbGetLocal = function () {
    if (l_pygdb_socket !== null) {
        l_pygdb_socket.write("GETLOCAL;0;")
    }
}