export default class MemGraphObjClass {
    constructor() {
        this.elementMap = {}
        this.debugPrintFlag = false
    }

    resetDebugPrintFlag() {
        this.debugPrintFlag = false
    }

    /**
     * @param {String} addr              : the address of the element object that needs to be added
     * @param {MemGraphElementClass} ele : element object that needs to be added
     */
    addElement(addr, ele) {
        if (addr in this.elementMap) {
            return
        }

        this.elementMap[addr] = ele
    }

    dumpElement() {
        // for (let item of this.elementMap) {
        //     console.log(item)
        // }
        if (!this.debugPrintFlag) {
            console.log(this)
            this.debugPrintFlag = true
        }
    }

    /**
     * initialize all the nodes back to not visited from any other nodes
     * so to handle the loop corner case
     */
    resetNodesUnvisited() {
        for (let addr in this.elementMap) {
            this.elementMap[addr].visitedFrom.clear()
        }
    }

    /**
     * Calculate the highest height of each node
     * The height is used to determine where to draw each node
     * 
     *        ^          x (h = 2)
     *        |          | \ 
     * height |    (h=1) x  x (h = 0)
     *        |         / \
     *        =  (h=0) x   x (h = 0)
     * 
     * @param {Set of Addr String} leafNodesSet : the leaf nodes that haven't been searched
     * @param {Integer} currentHeight           : the current height of search
     */
    generateHeightofEachNode(leafNodesSet, currentHeight) {
        let nextLeafNodesSet = new Set()
        
        for (let eleAddr of leafNodesSet) {
            let ele = this.elementMap[eleAddr]
            
            if (ele.isVisited) {
                continue
            }

            ele.height = currentHeight

            // add all the nodes before this node to the new leafNodes set
            for (let prevEleAddr of ele.getPrevAddr()) {
                nextLeafNodesSet.add(prevEleAddr)
            }
        }

        if (nextLeafNodesSet.length > 0) {
            this.generateHeightofEachNode(nextLeafNodesSet, currentHeight + 1)
        }
    }

    /**
     * Generate an array of react flow objects for this memGraphObj
     */
    generateObjectGraph() {
        // find all the bottom nodes
        let leafNodes = new Set()

        for (let addr in this.elementMap) {
            if (this.elementMap[addr].getAfterAddr().size > 1) {
                continue
            } else {
                leafNodes.add(addr)
            }
        }
        
        // Start from leaf nodes, find the height of the node starting from leaf(0)
        this.resetNodesUnvisited()
        this.generateHeightofEachNode(leafNodes, 0)
    }
}