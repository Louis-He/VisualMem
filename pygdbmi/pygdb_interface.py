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
        if (("isLL" in variable or "isTree" in variable) and varAddr in self.linkedListBeingRefered):
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
            members = []

            # If not already exist add one
            response = gdbcontroller.write('ptype (' + variable['name'] + ')')
            response = response[1:-1]

            aliasList = [surfaceType]

            typeStr = ""
            for line in response:
                typeStr += line["payload"]

            typeStrArr = typeStr.split("\\n")

            # typeNameLine = typeStrArr[0]

            # remove the error line for python
            for line in typeStrArr:
                if line.startswith("Python"):
                    typeStrArr.remove(line)
                    break
            # get the type name line
            for line in typeStrArr:
                if line.startswith('type'):
                    typeNameLine = line
                    break
            
            # parse type name
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
                        members.append(memberName)
                        continue
                    
                    nextNodeType = memberType[:memberType.rfind("*")].strip()
                    if nextNodeType in aliasList:
                        linkedMembers.append(memberName)

                unbufferedPrint("linkedMembers: ", linkedMembers)
                newTypeDict = {
                    "aliasList": aliasList, 
                    "memberDict": typeMemberDict,
                    "isLL": False,
                    "isTree": False
                }
                
                newTypeDict["members"] = members

                # If only one linked member -> linked list
                if len(linkedMembers) == 1:
                    newTypeDict["isLL"] = True
                    newTypeDict["linkedListMember"] = linkedMembers[0]
                # If two linked member -> tree
                elif len(linkedMembers) == 2:
                    newTypeDict["isTree"] = True
                    #TODO: change hardcode
                    newTypeDict["linkedListMember"] = {}
                    newTypeDict["linkedListMember"]["left"] = linkedMembers[0] 
                    newTypeDict["linkedListMember"]["right"] = linkedMembers[1]


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
            newVarDict["members"] = self.typeDict[structTypeName]["members"]
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

        elif self.typeDict[structTypeName]["isTree"]:
            # unbufferedPrint("=========self.typeDict[structTypeName]", self.typeDict[structTypeName])
            # unbufferedPrint("=========newVarDict", newVarDict)
            newVarDict["isTree"] = True
            newVarDict["isRefered"] = False
            newVarDict["linkedMember"] = {"left": self.typeDict[structTypeName]["linkedListMember"]["left"], "right": self.typeDict[structTypeName]["linkedListMember"]["right"]}

            referredLeftAddr = memberDict[self.typeDict[structTypeName]["linkedListMember"]["left"]]["value"]
            referredrightAddr = memberDict[self.typeDict[structTypeName]["linkedListMember"]["right"]]["value"]
            referredLeftType = memberDict[self.typeDict[structTypeName]["linkedListMember"]["left"]]["type"]
            referredrightType = memberDict[self.typeDict[structTypeName]["linkedListMember"]["right"]]["type"]

            if referredLeftAddr in self.varDict:
                self.varDict[referredLeftAddr]["isRefered"] = True
            else:
                # TODO: not sure if we need to change linkedListBeingRefered or not
                self.linkedListBeingRefered.add(referredLeftAddr)
                self.processPointer(gdbcontroller, {
                    'name': "((" + referredLeftType + ")(" + referredLeftAddr + "))",
                    'type': referredLeftType,
                    'value': referredLeftAddr,
                }, isAddOriginalPointerAddr = False)

            if referredrightAddr in self.varDict:
                self.varDict[referredrightAddr]["isRefered"] = True
            else:
                self.linkedListBeingRefered.add(referredrightAddr)
                self.processPointer(gdbcontroller, {
                    'name': "((" + referredrightType + ")(" + referredrightAddr + "))",
                    'type': referredrightType,
                    'value': referredrightAddr,
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

        unbufferedPrint(curDict)

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
                # unbufferedPrint(response)
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
        # unbufferedPrint(response)
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
    
    def processArray(self, gdbcontroller, variable, isAddOriginalPointerAddr = True):
        unbufferedPrint("=============Processing array!!!")

        curName = variable['name']
        curType = variable['type']
        unbufferedPrint(curName)
        
        curValue = []

        brasketCount = variable['type'].count("[")

        # get array type
        arrayType = curType.split(' ')[0]

        # get the size of the variable type
        response = gdbcontroller.write('-data-evaluate-expression sizeof(' + arrayType + ')')
        response = response[0]
        varSize = int(response['payload']['value'])

        # get the address of the variable
        response = gdbcontroller.write('-data-evaluate-expression "&(' + curName + ')"')
        response = response[0]
        headAddr = response['payload']['value']

        if (brasketCount == 1): # 1d array
            # get the length of the array
            arrayLength = curType.split('[')[1][0:-1]

            # get the value of the head address
            response = gdbcontroller.write('-data-evaluate-expression "*(' + arrayType+ ' *)(' + headAddr + ')"')
            response = response[0]
            curValue.append(response['payload']['value'])

            # increment the address by the variable size to get the next element
            curAddr = self.incrementAddr(headAddr, varSize)

            for i in range(int(arrayLength)-1):
                # get rest of the values
                response = gdbcontroller.write('-data-evaluate-expression "*(' + arrayType+ ' *)(' + curAddr + ')"')
                response = response[0]
                curValue.append(response['payload']['value'])
                curAddr = self.incrementAddr(curAddr, varSize)
            
            unbufferedPrint(curValue)
            curDict = {"name": curName, "type": curType, "isArray": True, "value": curValue}

            self.addVariable(gdbcontroller, curDict, varAddr=headAddr)

        elif (brasketCount == 2): # 2d array
            # get number of rows for the array
            numRow = curType.split('[')[1][0:-1]

            # get number of cols for the array
            numCol = curType.split('[')[2][0:-1]

            curAddr = headAddr

            for i in range(int(numRow)):
                rowValue = []
                for j in range(int(numCol)):
                    unbufferedPrint(curAddr)
                    # unbufferedPrint('-data-evaluate-expression "**(' + arrayType+ ')(' + curAddr + ')"')
                    response = gdbcontroller.write('-data-evaluate-expression "*(' + arrayType+ ' *)(' + curAddr + ')"')
                    response = response[0]
                    unbufferedPrint(response)
                    rowValue.append(response['payload']['value'])
                    curAddr = self.incrementAddr(curAddr, varSize)
                curValue.append(rowValue)
                rowValue = []
            
            unbufferedPrint(curValue)
            curDict = {"name": curName, "type": curType, "isArray": True, "is2D": True, "value": curValue}

            self.addVariable(gdbcontroller, curDict, varAddr=headAddr)

        else:
            unbufferedPrint("More than 2 dimensional array detected! Cannot process right now")

        

        unbufferedPrint("=============Done Processing array!!!")

        #unbufferedPrint(curDict)

    def incrementAddr(self, address, varSize):
        # convert the address from hex to int
        addressDec = int(address, 16)

        # add the variable size to get to the next element address
        addressDec = addressDec + varSize

        # return the changed back hex address
        return hex(addressDec)
        

    def processVariable(self, gdbcontroller, variable, varAddr = None):
        # unbufferedPrint("========VICKY1========")
        # unbufferedPPrint(variable)

        # varName = variable['name']
        varType = variable['type']
        # varValue = variable['value']

        asteriskCount = varType.count("*")
        bracketCount = varType.count("[")

        if 'value' not in variable:
            # should be either a struct, or an array
            # unbufferedPrint("[Error] Cannot process right now.")
            if bracketCount != 0:
                self.processArray(gdbcontroller, variable)
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
        self.lineNumber = ''
        self.sourceFile = ''

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
    
    def startController(self, execFilePath) -> bool:
        self.initializeController(execFilePath)

        self.controller = GdbController(
            # /Users/qihan6/Documents/gdb_darwin_hang_fix/build/gdb/gdb
            command=["/Users/qihan6/Documents/gdb_darwin_hang_fix/build/gdb/gdb", "--nx", "--quiet", "--interpreter=mi3"], 
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
        self.getSourceFileAndLineNumber()
        varInfoJsonStr = json.dumps({'lineNumber': self.lineNumber, 'sourceFile': self.sourceFile, 'locals': self.varSnapshot.varDict})
        unbufferedPrint('lineNumber: ', self.lineNumber, 'sourceFile: ', self.sourceFile)

        parsedStr = "INFO" + '{:8d}'.format(len(varInfoJsonStr)) + varInfoJsonStr
        self.electron_socket.send(parsedStr.encode())

    def getSourceFileAndLineNumber(self):
        response = self.controller.write('-file-list-exec-source-file')
        self.lineNumber = response[0]['payload']['line']
        self.sourceFile = response[0]['payload']['fullname']


def processIncomingMessage(pygdb_controller, msg):
    msgArr = msg.split(';')
    if msgArr[0] == 'SYN':
        pygdb_controller.electron_socket.send("SYN".encode())
    elif msgArr[0] == 'INI':
        pass
    elif msgArr[0] == 'START':
        pygdb_controller.startController(msgArr[2])
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