var windowsManager = require('./windowsManager.js');
var child_process = require('child_process');

const net  = require('net');
const port = 4000;

var create_python_session_embedded = false;
var l_pygdb_child_process = null;

var l_pygdb_socket = null;
var l_attached_controller = false;

var l_buf_remining_len = 0;
var l_tmp_recv_buf = "";
var onMessageReceiveCallbackFunc = null;

var isWin = process.platform === "win32";
var isMac = process.platform === "darwin";
var isLinux = process.platform === "linux";

function getVariableInfoCallback (message) {
    // call graph initializer
    const mainWindow = windowsManager.getMainWindows()
    if (mainWindow !== null) {
      mainWindow.webContents.send('getVariablesForGraphInitializer', { 'message': message});
    }
}

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
                let receivedDataLen = data.length

                if (l_buf_remining_len !== 0) {
                    // continue appending messages
                    l_tmp_recv_buf += data
                    l_buf_remining_len -= receivedDataLen
                } else {
                    // new message, decode whether this is an info message
                    if (receivedDataLen < 12) {
                        return
                    }

                    let messageType = data.substring(0, 4)
                    let messageRealLength = parseInt(data.substring(4, 12))
                    let realMessage = data.substring(12)

                    if (messageType === "INFO") {
                        l_buf_remining_len = parseInt(messageRealLength)
                        l_tmp_recv_buf += realMessage
                        l_buf_remining_len -= realMessage.length
                        onMessageReceiveCallbackFunc = getVariableInfoCallback
                    }
                }

                if (l_buf_remining_len === 0 && onMessageReceiveCallbackFunc != null) {
                    onMessageReceiveCallbackFunc(l_tmp_recv_buf);

                    l_buf_remining_len = 0
                    l_tmp_recv_buf = ""
                    onMessageReceiveCallbackFunc = null
                }
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
    var execFile = windowsManager.getExecFile()
    l_pygdb_socket.write(`START;${execFile.length};${execFile}`);
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