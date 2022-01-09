var windowsManager = require('./windowsManager.js');

const net  = require('net');
const port = 4000;

var l_pygdb_socket = null;
var l_attached_controller = false;

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