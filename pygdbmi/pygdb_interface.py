import threading
import socket
import ctypes
from pygdbmi.gdbcontroller import GdbController
from pprint import pprint


HOST = '127.0.0.1'  # The server's hostname or IP address
PORT = 4000        # The port used by the server
BUFSIZE = 1024

class varSnapshot:
    def __init__(self) -> None:
        self.varDict = {}
        self.typeDict = {}

    def addVariable(self, gdbcontroller, variable, varAddr = None):
        varName = variable['name']

        if varAddr is None:
            response = gdbcontroller.write('-data-evaluate-expression "&(' + varName + ')"')
            response = response[0]
            # print(response)
            varAddr = response['payload']['value']

        if varAddr not in self.varDict:
            self.varDict[varAddr] = variable
        elif self.varDict[varAddr]['name'].count("*") != 0:
            self.varDict[varAddr] = variable
            print("[Warning] Overload Variable")
        else:
            print("[Error] ADDVAR ERROR")

    def processPointer(self, gdbcontroller, variable):
        curName = variable['name']
        curType = variable['type']
        curValue = variable['value']
        curDict = {"name": variable['name'], "type": variable['type'], "value": variable['value'], 'ptrTarget': True}

        asteriskCount = variable['type'].count("*")
        curAddr = None

        for _ in range(asteriskCount):
            print("process pointer")

            if curAddr is None:
                self.addVariable(gdbcontroller, curDict, curAddr)
                curName = "(" + curName + ")"
            else:
                response = gdbcontroller.write('-data-evaluate-expression "(' + curType + ')(' + curAddr + ')"')
                response = response[0]
                # print(response)
                if response['message'] == 'error':
                    curDict["ptrTarget"] = False
                    return

                curValue = response['payload']['value']
                curDict = {"name": curName, "type": curType, "value": curValue, 'ptrTarget': True}
                self.addVariable(gdbcontroller, curDict, curAddr)

            curAddr = curValue
            curName = "*" + curName
            curType = curType[:-1].strip()
        
        response = gdbcontroller.write('-data-evaluate-expression "(' + curType + ')(' + curAddr + ')"')
        response = response[0]
        print(response)
        # if response['message'] == 'error':
        #     curDict["ptrTarget"] = False
        #     return

        # curValue = response['payload']['value']
        # curDict = {"name": curName, "type": curType, "value": curValue, 'ptrTarget': True}
        # self.addVariable(gdbcontroller, curDict, curAddr)

            
        # print("Ptr")

    def processVariable(self, gdbcontroller, variable):
        pprint(variable)

        # varName = variable['name']
        varType = variable['type']
        # varValue = variable['value']

        asteriskCount = varType.count("*")
        bracketCount = varType.count("[")

        if 'value' not in variable:
            # should be either a struct, or an array
            print("[Error] Cannot process right now.")
        else:
            if asteriskCount != 0:
                self.processPointer(gdbcontroller, variable)
            else:
                self.addVariable(gdbcontroller, variable)

    def createVarsnapshot(self, gdbcontroller, varDict):
        for variable in varDict["payload"]["variables"]:
            self.processVariable(gdbcontroller, variable)

        print("================")
        pprint(self.varDict)

class pygdbController:
    def __init__(self, socket) -> None:
        self.electron_socket = socket
        self.execFilePath = None
        self.controller = None

        self.varSnapshot = varSnapshot()

    def sendCommandToGDB(self, command, isPrint = False) -> bool:
        response = self.controller.write(command)

        if isPrint:
            pprint(response)

        for res in response:
            if res["message"] == "error":
                return False
        
        return True

    def sendErrMsgtoElectron(self, msg):
        self.electron_socket.send(msg.encode())

    def initializeController(self, execFilePath):
        execFilePath = execFilePath.replace('\\', '/')

        self.execFilePath = execFilePath
    
    def startController(self,) -> bool:
        self.controller = GdbController(time_to_check_for_additional_output_sec=0.1)
        print(self.execFilePath)
        isSuccessful = self.sendCommandToGDB('-file-exec-and-symbols "' + self.execFilePath + '"', True)
        self.sendCommandToGDB('-break-insert main', True)
        self.sendCommandToGDB('-exec-run', True)

        if not isSuccessful:
            self.sendErrMsgtoElectron("[ERROR] Can't start gdb.")
            return False
        
        return True

    def runNextLine(self) -> bool:
        isSuccessful = self.sendCommandToGDB('-exec-next', True)
        return isSuccessful

    def runContinue(self) -> bool:
        isSuccessful = self.sendCommandToGDB('-exec-continue', True)
        return isSuccessful

    def stopgdb(self):
        self.controller.write("q")
        self.controller = None

    def getVariables(self):
        response = self.controller.write('-stack-list-variables --simple-values')
        response = response[0]

        self.varSnapshot.createVarsnapshot(self.controller, response)


def processIncomingMessage(pygdb_controller, msg):
    msgArr = msg.split(';')
    if msgArr[0] == 'SYN':
        pygdb_controller.electron_socket.send("SYN".encode())
    elif msgArr[0] == 'INI':
        pygdb_controller.initializeController(msgArr[2])
    elif msgArr[0] == 'START':
        pygdb_controller.startController()
    elif msgArr[0] == 'GETLOCAL':
        pygdb_controller.getVariables()
    elif msgArr[0] == 'CMD':
        if msgArr[2] == "n":
            pygdb_controller.runNextLine()
        elif msgArr[2] == "c":
            pygdb_controller.runContinue()
        if msgArr[2] == "end":
            pygdb_controller.stopgdb()
    elif msgArr[0] == 'FIN':
        thread_id = threading.get_ident()
        res = ctypes.pythonapi.PyThreadState_SetAsyncExc(thread_id,
            ctypes.py_object(SystemExit))
        if res > 1:
            ctypes.pythonapi.PyThreadState_SetAsyncExc(thread_id, 0)
            print('Exception raise failure')


def pygdb_interface_entry():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((HOST, PORT))

    pygdb_controller = pygdbController(s)

    while True:
        electron_side = s.recv(BUFSIZE)
        if not electron_side: 
            print('Electron side exited.')
            break

        electron_side = electron_side.decode('utf-8')

        print(electron_side)
        processIncomingMessage(pygdb_controller, electron_side)



if __name__ == '__main__':
    main_thread = threading.Thread(target=pygdb_interface_entry, args=())
    main_thread.start()
    main_thread.join()