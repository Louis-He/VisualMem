import threading
import socket
import ctypes
from pygdbmi.gdbcontroller import GdbController
from pprint import pprint
import sys

import json

HOST = '127.0.0.1'  # The server's hostname or IP address
PORT = 4000        # The port used by the server
BUFSIZE = 1024


def unbufferedPPrint(*args, **kwargs):
    pprint(*args, **kwargs)
    sys.stdout.flush()

def unbufferedPrint(*args, **kwargs):
    print(*args, **kwargs)
    sys.stdout.flush()

class varSnapshot:
    def __init__(self) -> None:
        self.varDict = {}
        self.typeDict = {}

        # All the members below are temperory variables that are used during the 
        # construction of the varDict
        self.linkedListBeingRefered = set() # Add to this set if a node has been referenced somewhere 

    def addVariable(self, gdbcontroller, variable, varAddr = None):
        varName = variable['name']

        if varAddr is None:
            response = gdbcontroller.write('-data-evaluate-expression "&(' + varName + ')"')
            response = response[0]
            # unbufferedPrint(response)
            varAddr = response['payload']['value']

        unbufferedPrint("try to add variable", variable)

        # See if the newly added variable is already being refered 
        # Now only works for Linked List
        if "isLL" in variable and varAddr in self.linkedListBeingRefered:
            variable["isRefered"] = True

        if varAddr not in self.varDict:
            self.varDict[varAddr] = variable
        elif self.varDict[varAddr]['name'].count("*") != 0:
            self.varDict[varAddr] = variable
            unbufferedPrint("[Warning] Overload Variable")
        else:
            unbufferedPrint("[Error] ADDVAR ERROR")

    def tryAddType(self, gdbcontroller, variable):
        surfaceType = variable["type"]
        typeName = surfaceType
        
        if surfaceType not in self.typeDict:
            # Flags need to be set here
            linkedMembers = []

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

                    # check if the member is possibly a linker to another node that has the same type
                    if memberType.count("*") == 0:
                        # The member is not even a pointer, pass the check!
                        continue
                    
                    nextNodeType = memberType[:memberType.rfind("*")].strip()
                    if nextNodeType in aliasList:
                        linkedMembers.append(memberName)

                unbufferedPrint("linkedMembers: ", linkedMembers)
                newTypeDict = {
                    "aliasList": aliasList, 
                    "memberDict": typeMemberDict,
                    "isLL": False
                }

                if len(linkedMembers) == 1:
                    newTypeDict["isLL"] = True
                    newTypeDict["linkedListMember"] = linkedMembers[0]

                self.typeDict[surfaceType] = newTypeDict
                self.typeDict[typeName] = self.typeDict[surfaceType]
            else:
                # Seems like the underlining type is already there
                # Let's add the new typename to the alias list
                underliningTypeDict = self.typeDict[typeName]
                underliningTypeDict["aliasList"].append(surfaceType)

                self.typeDict[surfaceType] = underliningTypeDict

        return typeName

    def processStruct(self, gdbcontroller, variable, structAddr = None):
        unbufferedPrint("process Struct")
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

        newVarDict = {"name": curName, "type": curType, "value": memberDict}


        unbufferedPrint(self.typeDict[structTypeName])
        # The first condition: Check if the node is part of a Linked List
        # The second condition: Only count reference by another node, not by arbitrary pointer!
        if self.typeDict[structTypeName]["isLL"]:
            newVarDict["isLL"] = True
            newVarDict["isRefered"] = False
            newVarDict["linkedMember"] = self.typeDict[structTypeName]["linkedListMember"]
            # Special operations for a linked list
            # Add a field to indicate if the node is the head node or not
            referredAddr = memberDict[self.typeDict[structTypeName]["linkedListMember"]]["value"]
            referredType = memberDict[self.typeDict[structTypeName]["linkedListMember"]]["type"]

            if referredAddr in self.varDict:
                self.varDict[referredAddr]["isRefered"] = True
            else:
                # not sure if the node will be added later, so...
                # Add the node to the temp nodes.
                self.linkedListBeingRefered.add(referredAddr)
                self.processPointer(gdbcontroller, {
                    'name': "((" + referredType + ")(" + referredAddr + "))",
                    'type': referredType,
                    'value': referredAddr,
                }, isAddOriginalPointerAddr = False)
        
        self.addVariable(gdbcontroller, 
            newVarDict,
            varAddr = structAddr
        )


    def processPointer(self, gdbcontroller, variable, isAddOriginalPointerAddr = True):
        curName = variable['name']
        curType = variable['type']
        curValue = variable['value']
        curDict = {"name": variable['name'], "type": variable['type'], "value": variable['value'], 'ptrTarget': True}

        asteriskCount = variable['type'].count("*")
        curAddr = None

        for _ in range(asteriskCount):
            unbufferedPrint("process pointer")

            if curAddr is None:
                # Only the original pointer will be in this if
                # Used as the condition to check if this is the first iteration

                if isAddOriginalPointerAddr:
                    self.addVariable(gdbcontroller, curDict, varAddr=curAddr)
                curName = "(" + curName + ")"
            else:
                response = gdbcontroller.write('-data-evaluate-expression "*(' + curType + ')(' + curAddr + ')"')
                response = response[0]
                unbufferedPrint(response)
                if response['message'] == 'error':
                    curDict["ptrTarget"] = False
                    return

                curValue = response['payload']['value']
                curType = curType[:-1].strip()
                curDict = {"name": curName, "type": curType, "value": curValue, 'ptrTarget': True}
                self.addVariable(gdbcontroller, curDict, varAddr=curAddr)

            curAddr = curValue
            curName = "*" + curName
            
        
        response = gdbcontroller.write('-data-evaluate-expression "*(' + curType + ')(' + curAddr + ')"')
        response = response[0]
        unbufferedPrint(response)
        if response['message'] == 'error':
            curDict["ptrTarget"] = False
            return

        curValue = response['payload']['value']
        curType = curType[:-1].strip()
        curDict = {"name": curName, "type": curType, "value": curValue, 'ptrTarget': True}

        if curValue.count("{") == 0:
            self.addVariable(gdbcontroller, curDict, varAddr=curAddr)
        else:
            unbufferedPrint("Maybe a struct or something, need to process further!")

            curDict["name"] = "(*((" + curType + "*)" + "(" + curAddr + ")))"
            self.processVariable(gdbcontroller, curDict, curAddr)
            
        # unbufferedPrint("Ptr")

    def processVariable(self, gdbcontroller, variable, varAddr = None):
        unbufferedPPrint(variable)

        # varName = variable['name']
        varType = variable['type']
        # varValue = variable['value']

        asteriskCount = varType.count("*")
        bracketCount = varType.count("[")

        if 'value' not in variable:
            # should be either a struct, or an array
            # unbufferedPrint("[Error] Cannot process right now.")
            if bracketCount != 0:
                unbufferedPrint("[Error] Array detected. Can't process right now.")
            elif asteriskCount != 0:
                unbufferedPrint("[Error] Can't process right now, seems a bit strange, need to CHECK!")
            else:
                unbufferedPrint("we have a struct here!")
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

        unbufferedPrint("================")
        unbufferedPPrint(self.varDict)

class pygdbController:
    def __init__(self, socket) -> None:
        self.electron_socket = socket
        self.execFilePath = None
        self.controller = None

        self.varSnapshot = varSnapshot()

    def sendCommandToGDB(self, command, isPrint = False) -> bool:
        response = self.controller.write(command)

        if isPrint:
            unbufferedPPrint(response)
            

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
        self.controller = GdbController(
            # /Users/qihan6/Documents/gdb_darwin_hang_fix/build/gdb/gdb
            command=["gdb", "--nx", "--quiet", "--interpreter=mi3"], 
            time_to_check_for_additional_output_sec=0.05
        )
        unbufferedPrint(self.execFilePath)
        isSuccessful = self.sendCommandToGDB('-file-exec-and-symbols "' + self.execFilePath + '"', True)
        self.sendCommandToGDB('-break-insert main', True)
        self.sendCommandToGDB('-exec-run', True)

        if not isSuccessful:
            self.sendErrMsgtoElectron("[ERROR] Can't start gdb.")
            return False
        
        return True

    def runNextLine(self, isGetVariables=False) -> bool:
        isSuccessful = self.sendCommandToGDB('-exec-next', True)
        self.sendBackVarInfo()
        return isSuccessful

    def runContinue(self, isGetVariables=False) -> bool:
        isSuccessful = self.sendCommandToGDB('-exec-continue', True)
        self.sendBackVarInfo()
        return isSuccessful

    def stopgdb(self):
        self.controller.write("q")
        self.controller = None

    def getVariables(self):
        response = self.controller.write('-stack-list-variables --simple-values')
        response = response[0]

        self.varSnapshot.createVarsnapshot(self.controller, response)

    def sendBackVarInfo(self):
        self.getVariables()
        varInfoJsonStr = json.dumps(self.varSnapshot.varDict)

        parsedStr = "INFO" + '{:8d}'.format(len(varInfoJsonStr)) + varInfoJsonStr
        self.electron_socket.send(parsedStr.encode())


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
            unbufferedPrint('Exception raise failure')


def pygdb_interface_entry():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((HOST, PORT))

    pygdb_controller = pygdbController(s)

    while True:
        electron_side = s.recv(BUFSIZE)
        if not electron_side: 
            unbufferedPrint('Electron side exited.')
            break

        electron_side = electron_side.decode('utf-8')

        unbufferedPrint(electron_side)
        processIncomingMessage(pygdb_controller, electron_side)



if __name__ == '__main__':
    main_thread = threading.Thread(target=pygdb_interface_entry, args=())
    main_thread.start()
    main_thread.join()