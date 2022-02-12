import MemGraphObjClass from "./MemGraphObjClass"

export default class MemGraphClass {
    constructor() {
        this.graphObjMap = new Object()
    }

    init() {
        this.graphObjMap = new Object()
    }

    /**
     * Add element to graphObj (local function, only called by addElement)
     * 1. If referenceAddr is not null, then add this element to the already existing graphObj
     * 2. If referenceAddr is null, then create a new graphObj and add to the graphObjMap
     * 
     * @param {string} addr          : address of the new element
     * @param {object} ele           : the new element
     * @param {string} referenceAddr : address of the already existing element that this new element should group together
     */
    _addElement(addr, ele, referenceAddr) {
        if (referenceAddr !== null && referenceAddr in this.graphObjMap) {
            this.graphObjMap[referenceAddr].addElement(ele)
            this.graphObjMap[addr] = this.graphObjMap[referenceAddr]
        } else {
            this.graphObjMap[addr] = new MemGraphObjClass
            this.graphObjMap[addr].addElement(ele)
        }
    }

    /**
     * Try to add one element to the graph.
     * 
     * @param {string} addr          : the address of the element 
     * @param {object} ele           : detailed information of the element
     * @param {string} referenceAddr : the reference address of the element that this new element should group together
     * @returns {"isContinue": boolean, "nextAddr": String}
     *          If the element connects to another one by pointer, then return the next address that needs to be explored.
     *          If the element connects to nothing or invalid address, then return not continuing.
     */
    addElement(addr, ele, referenceAddr) {
        // does not support linked list at this moment
        if ("isLL" in ele) {
            return {"isContinue": false}
        }
        
        if (addr in this.graphObjMap) {
            return {"isContinue": false}
        }

        if ("ptrTarget" in ele) {
            // if the pointer points to a legal memory
            if (ele.ptrTarget) {
                // check if the memory it points to is already been added in the map,
                // if that is the case, update reference address and stop searching
                if (ele.value in this.graphObjMap){
                    referenceAddr = ele.value
                    this._addElement(addr, ele, referenceAddr)
                    return {"isContinue": false}
                } else {
                    this._addElement(addr, ele, referenceAddr)
                    return {"isContinue": true, "nextAddr": ele.value}
                }
            } else {
                // if the pointer points to an illegal memory, than this pointer is the deepest node of this whole tree
                this._addElement(addr, ele, referenceAddr)
                return {"isContinue": false}
            }
        } else {
            // the element is a value, just add the element
            this._addElement(addr, ele, referenceAddr)
            return {"isContinue": false}
        }
    }

    dumpElement() {
        console.log(this.graphObjMap)
        // for (let key in this.graphObjMap) {
        //     this.graphObjMap[key].dumpElement()
        // }
    }
}