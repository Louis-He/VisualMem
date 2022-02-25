import MemGraphElementClass from "./MemGraphElementClass"
import MemGraphObjClass from "./MemGraphObjClass"

export default class MemGraphClass {
    constructor() {
        this.graphObjMap = []
        this.graphEleMap = {}
    }

    init(localVarJson) {
        this.graphObjMap = []
        this.graphEleMap = {}

        // create a MemGraphElementClass object for each object in localVarJson
        for (var addr in localVarJson) {
            this.graphEleMap[addr] = new MemGraphElementClass(addr, localVarJson[addr])
        }

        var that = this
        function eachAddrOperation(addr, afterAddr) {
            if (afterAddr in that.graphEleMap) {
                that.graphEleMap[afterAddr].addPrevAddr(addr)
            } else {
                that.graphEleMap[addr].removeAfterAddr(afterAddr)
            }
        }

        // Update MemGraphElementMap so that each MemGraphElementClass has links to prevAddr and afterAddr
        for (const addr in this.graphEleMap) {
            let afterAddrs = this.graphEleMap[addr].getAfterAddr()

            afterAddrs.forEach(afterAddr => eachAddrOperation(addr, afterAddr))
        }

        console.log(this.graphEleMap)
    }

    constructGraph() {
        for (const addr in this.graphEleMap) {
            if (this.graphEleMap[addr].isVisited) {
                continue
            }

            // add a new object here
            let newGraphObj = new MemGraphObjClass()
            this._addElement(newGraphObj, this.graphEleMap[addr])
            this.graphObjMap.push(newGraphObj)
        }

        console.log(this.graphObjMap)
    }

    /**
     * Add element to graphObj (local function, only called by addElement)
     * 1. If referenceAddr is not null, then add this element to the already existing graphObj
     * 2. If referenceAddr is null, then create a new graphObj and add to the graphObjMap
     * 
     * @param {MemGraphObjClass} newGraphObj : the graph object map that the new element will add to
     * @param {MemGraphElementClass} ele     : the new element
     * @param {boolean} lookBefore           : whether to check the element before this element
     * @param {boolean} lookAfter            : whether to check the element after this element
     */
    _addElement(newGraphObj, ele) {
        // if the element is pointed by another element, but doesn't point to anything else
        if (ele.addr in newGraphObj) {
            return
        }
        // newGraphObj[ele.addr] = ele
        newGraphObj.addElement(ele.addr, ele)

        ele.isVisited = true


        let afterAddrs = ele.getAfterAddr()

        var that = this
        afterAddrs.forEach(afterAddr => {
            that._addElement(newGraphObj, that.graphEleMap[afterAddr])
        })

        let beforeAddrs = ele.getPrevAddr()

        beforeAddrs.forEach(beforeAddr => {
            that._addElement(newGraphObj, that.graphEleMap[beforeAddr])
        })
    }


    // dumpElement() {
    //     // console.log(this.graphObjMap)
    //     for (let key in this.graphObjMap) {
    //         this.graphObjMap[key].resetDebugPrintFlag()
    //     }

    //     for (let key in this.graphObjMap) {
    //         this.graphObjMap[key].dumpElement()
    //     }
    // }
}