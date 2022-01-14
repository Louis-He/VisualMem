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

        print("try to add variable", variable)

        if varAddr not in self.varDict:
            self.varDict[varAddr] = variable
        elif self.varDict[varAddr]['name'].count("*") != 0:
            self.varDict[varAddr] = variable
            print("[Warning] Overload Variable")
        else:
            print("[Error] ADDVAR ERROR")

    def tryAddType(self, gdbcontroller, variable):
        surfaceType = variable["type"]
        typeName = surfaceType
        
        if surfaceType not in self.typeDict:
            # If not already exist add one
            response = gdbcontroller.write('ptype (' + variable['name'] + ')')
            response = response[1:-1]

            aliasList = [surfaceType]

            typeStr = ""
            for line in response:
                typeStr += line["payload"]

            typeStrArr = typeStr.split("\\n")

            typeNameLine = typeStrArr[0]
            typeName = typeNameLine[typeNameLine.find("=") + 1:typeNameLine.find("{")].strip()
            
            if typeName not in self.varDict:
                # The underlining type also does not exist
                if typeName not in aliasList:
                    aliasList.append(typeName)

                typeStrArr = typeStrArr[1:-2]
                typeMemberDict = {}
                for memberLine in typeStrArr:
                    memberLine = memberLine.strip()
                    memberLine = memberLine.replace(";", "")

                    lastSpace = memberLine.rfind(" ")
                    lastAsterisk = memberLine.rfind("*")
                    lastRightBracket = memberLine.rfind("]")

                    lastTypeCharacter = max(lastSpace, lastAsterisk, lastRightBracket)

                    memberType = memberLine[:lastTypeCharacter+1].strip()
                    memberName = memberLine[lastTypeCharacter+1:].strip()

                    typeMemberDict[memberName] = memberType

                self.typeDict[surfaceType] = {"aliasList": aliasList, "memberDict": typeMemberDict}
                self.typeDict[typeName] = {"aliasList": aliasList, "memberDict": typeMemberDict}
            else:
                # Seems like the underlining type is already there
                # Let's add the new typename to the alias list
                underliningTypeDict = self.typeDict[typeName]
                underliningTypeDict["aliasList"].append(surfaceType)

                self.typeDict[surfaceType] = underliningTypeDict

        return typeName

    def processStruct(self, gdbcontroller, variable, structAddr = None):
        print("process Struct")
        structTypeName = self.tryAddType(gdbcontroller, variable)

        memberDict = {}

        curType = variable['type']
        curName = variable['name']
        # loop all the members and try to get each member value
        for member, memberType in self.typeDict[structTypeName]["memberDict"].items():
            response = gdbcontroller.write('-data-evaluate-expression "(' + curName + "." + member + ')"')
            response = response[0]

            memberValue = response['payload']['value']
            memberDict[member] = {"value": memberValue, "type": memberType}
        
        self.addVariable(gdbcontroller, 
            {"name": curName, "type": curType, "value": memberDict},
            varAddr = structAddr
        )


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
                response = gdbcontroller.write('-data-evaluate-expression "*(' + curType + ')(' + curAddr + ')"')
                response = response[0]
                print(response)
                if response['message'] == 'error':
                    curDict["ptrTarget"] = False
                    return

                curValue = response['payload']['value']
                curType = curType[:-1].strip()
                curDict = {"name": curName, "type": curType, "value": curValue, 'ptrTarget': True}
                self.addVariable(gdbcontroller, curDict, curAddr)

            curAddr = curValue
            curName = "*" + curName
            
        
        response = gdbcontroller.write('-data-evaluate-expression "*(' + curType + ')(' + curAddr + ')"')
        response = response[0]
        print(response)
        if response['message'] == 'error':
            curDict["ptrTarget"] = False
            return

        curValue = response['payload']['value']
        curType = curType[:-1].strip()
        curDict = {"name": curName, "type": curType, "value": curValue, 'ptrTarget': True}

        if curValue.count("{") == 0:
            self.addVariable(gdbcontroller, curDict, curAddr)
        else:
            print("Maybe a struct or something, need to process further!")

            curDict["name"] = "(*((" + curType + "*)" + "(" + curAddr + ")))"
            self.processVariable(gdbcontroller, curDict, curAddr)
            
        # print("Ptr")

    def processVariable(self, gdbcontroller, variable, varAddr = None):
        pprint(variable)

        # varName = variable['name']
        varType = variable['type']
        # varValue = variable['value']

        asteriskCount = varType.count("*")
        bracketCount = varType.count("[")

        if 'value' not in variable:
            # should be either a struct, or an array
            # print("[Error] Cannot process right now.")
            if bracketCount != 0:
                print("[Error] Array detected. Can't process right now.")
            elif asteriskCount != 0:
                print("[Error] Can't process right now, seems a bit strange, need to CHECK!")
            else:
                print("we have a struct here!")
                self.processStruct(gdbcontroller, variable, varAddr)
        else:
            if asteriskCount != 0:
                # Possibly a struct already being dereferenced
                self.processPointer(gdbcontroller, variable)
            else:
                if variable['value'].count("{") != 0:
                    self.processStruct(gdbcontroller, variable, varAddr)
                else:
                    self.addVariable(gdbcontroller, variable)

    def createVarsnapshot(self, gdbcontroller, varDict):
        self.varDict = {}
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
        self.controller = GdbController(time_to_check_for_additional_output_sec=0.05)
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