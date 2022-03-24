import ReactFlow, { Handle } from 'react-flow-renderer';

export default class MemGraphObjClass {
    constructor() {
        this.elementMap = {}
        this.debugPrintFlag = false

        this.placementOccupiedSet = new Set()
        this.memGraphRepresentation = []
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
     * @param {Set of String(nextNodeAddr;srcNodeAddr)} leafNodesSet : the leaf nodes that haven't been searched
     * @param {Integer} currentHeight                                : the current height of search
     */
    generateHeightofEachNode(leafNodesSet, currentHeight) {
        let nextLeafNodesSet = new Set()
        
        for (let searchEdge of leafNodesSet) {
            let searchInfo = searchEdge.split(";") ;

            let newNodeAddr = searchInfo[0];
            let srcNodeAddr = searchInfo[1];

            let ele = this.elementMap[newNodeAddr]
            
            if (ele.visitedFrom.has(srcNodeAddr)) {
                continue
            } else {
                ele.height = currentHeight

                // add all the nodes before this node to the new leafNodes set
                for (let prevEleAddr of ele.getPrevAddr()) {
                    nextLeafNodesSet.add(prevEleAddr + ";" + ele.addrs)
                }
            }
        }

        if (nextLeafNodesSet.size > 0) {
            this.generateHeightofEachNode(nextLeafNodesSet, currentHeight + 1)
        }
    }

    /**
     * 
     * @param {Set of String(nextNodeAddr;srcNodeAddr)} rootNodeSet 
     * @param {Integer} currentDepth 
     */
    generateDepthofEachNode(rootNodeSet, currentDepth) {
        let nextRootNodeSet = new Set()

        for (let searchEdge of rootNodeSet) {
            let searchInfo = searchEdge.split(";")

            let newNodeAddr = searchInfo[0];
            let srcNodeAddr = searchInfo[1];

            let ele = this.elementMap[newNodeAddr]
            
            if (ele.visitedFrom.has(srcNodeAddr)) {
                continue
            } else {
                ele.depth = currentDepth

                // add all the nodes before this node to the new leafNodes set
                for (let afterEleAddr of ele.getAfterAddr()) {
                    nextRootNodeSet.add(afterEleAddr + ";" + ele.addrs)
                }    
            }
        }

        if (nextRootNodeSet.size > 0) {
            this.generateDepthofEachNode(nextRootNodeSet, currentDepth + 1)
        }
    }

    /**
     * Create a custom reactflow coponent based on prevAddrLength
     * @param {int} prevAddrLength 
     */
    _generateCustomReactflowComponent(prevAddrLength, nodeClassName) {
        var targetArr = []
        
        targetArr.push(
            <Handle type="target" position="left" className={nodeClassName} key="s0" id="s0" 
                style = {{top: "35%", left: "44.44%", borderRadius: 0}}/>
        )

        // if we have more than one prevAddr, we need to create a custom reactflow component for each prevAddr
        if (prevAddrLength !== 0) {
            let startPos = 50;
            let finalPos = 100;
            let beginingPos = startPos + (finalPos - startPos) / (prevAddrLength-1) / 2

            for (var i = 1; i < prevAddrLength; i++) {
                let pos = beginingPos + (finalPos - startPos) * (i-1) / (prevAddrLength-1);
                targetArr.push(
                    <Handle type="target" position="bottom" className={nodeClassName} key={"s" + i.toString()} id={"s" + i.toString()}
                        style = {{top: "52%", left: pos.toString()+"%", borderRadius: 0}}/>
                )
            } 
        }
        
        return ({ data }) => {return (
            <div className='normal'>
                {targetArr}
                <p className='normalName'> {data.name} </p>
                <div>
                    <div className='normalNode'> {data.text} </div>
                </div>
            </div>
        )}
    }

    /**
     * The helper function to generate the memGraphRepresentation for each node
     * @param {MemGraphElementClass Object} srcAddr The node after the current node that requested the node generation
     * @param {int} srcId The id of the target handler that the current node should be connected to
     * @param {MemGraphElementClass Object} ele The current node
     * @param {int} startingY The starting y position of the node
     * @param {int} startingX The starting x position of the node
     * @param {Object of node styles} customNodeStyle All the styles for the graph
     * @returns 
     */
    _generateReactflowGraphHelper(srcAddr, srcId, ele, startingY, startingX, customNodeStyle) {
        // check if staringY and startingX has already been occupied
        var formattedNumber = ("000" + startingX).slice(-4) + ("000" + startingY).slice(-4);

        while (this.placementOccupiedSet.has(formattedNumber)) {
            startingY += 1
            formattedNumber = ("000" + startingX).slice(-4) + ("000" + startingY).slice(-4);
        }
        this.placementOccupiedSet.add(formattedNumber)

        let allPrevAddrs = Array.from(ele.getPrevAddr())

        // draw the node
        if (ele.getAfterAddr().size !== 0) {
            this.memGraphRepresentation.push({ 
                id: ele.addr, 
                type: 'pointer', 
                position: {x: startingX * 120 + 10, y: startingY * 60 + 10}, 
                data: { 
                    name: ele.name.includes("*") ? " " : ele.name, 
                    text: ele.getValue().toString()
                }, 
                targetHandle: '1',
                draggable: true
            })
        } else if(ele.isLL) {
            let members = ele.getMembers()
            var textContent = ''

            members.forEach(member => {
                    let memberValue = ele.getValue()[member]["value"]
                    textContent = textContent + member + ":" + memberValue + " "
                }
            )
            this.memGraphRepresentation.push({ 
                id: ele.addr, 
                type: 'linkedList', 
                position: {x: startingX * 120 + 10, y: startingY * 60 + 10}, 
                data: { 
                    name: ele.name.includes("*") ? " " : ele.name, 
                    text: textContent
                }, 
                draggable: true
            })
        } else if (ele.isArray) {
            let arrayList = ele.value;
            this.memGraphRepresentation.push({ 
                id: ele.addr, 
                type: 'arrayHead', 
                position: {x: startingX * 120 + 10, y: startingY * 60 + 10}, 
                data: { 
                    name: ele.name.includes("*") ? " " : ele.name, 
                    index: 0,
                    text: arrayList[0]
                }, 
                draggable: true
            })
            startingX += 1;
            
            for (var i = 1; i < arrayList.length; i++) {
                // TODO: handle position!!
                this.memGraphRepresentation.push({ 
                    id: ele.addr+i, 
                    type: 'array', 
                    position: {x: startingX * 120 + 10 + 80, y: startingY * 60 + 10}, 
                    data: { 
                        name: ele.name.includes("*") ? " " : ele.name, 
                        index: i,
                        text: arrayList[i]
                    }, 
                    draggable: true
                })
                startingX += 1;
            }
        } else if (ele.isTree) {
            // do nothing for now
        } else {
            customNodeStyle[ele.addr + allPrevAddrs.length.toString() + "_style"] = this._generateCustomReactflowComponent(allPrevAddrs.length, "normalNode");

            this.memGraphRepresentation.push({ 
                id: ele.addr, 
                type: ele.addr + allPrevAddrs.length.toString() + "_style", 
                position: {x: startingX * 120 + 10, y: startingY * 60 + 10}, 
                data: { 
                    name: ele.name.includes("*") ? " " : ele.name, 
                    text: ele.getValue().toString().replace(/"/g, "")
                }, 
                draggable: true
            })
        }
        

        // draw the edge if srcAddr is not null pointer, means that
        // this node has a child
        if (srcAddr !== "0x0") {
            this.memGraphRepresentation.push({
                id: ele.addr + srcAddr,
                source: ele.addr,
                target: srcAddr,
                arrowHeadType: 'arrow', 
                targetHandle: srcId,
                style: {strokeWidth: 4},
            })
        }

        var Y_addition = 0
        var ret_startingY = startingY

        
        this.bubbleSort(allPrevAddrs, allPrevAddrs.length)

        var i = 0
        for (let prevEleAddr of allPrevAddrs) {
            if (Y_addition === 0) {
                ret_startingY = Math.max(
                    ret_startingY, 
                    this._generateReactflowGraphHelper(ele.addr, "s" + i.toString(), this.elementMap[prevEleAddr], startingY + Y_addition, startingX - 1, customNodeStyle)
                );
            } else {
                ret_startingY = Math.max(
                    ret_startingY, 
                    this._generateReactflowGraphHelper(ele.addr, "s" + i.toString(), this.elementMap[prevEleAddr], startingY + Y_addition, startingX, customNodeStyle)
                );
            }
            Y_addition += 1
            i += 1
        }

        return ret_startingY
    }

    bubbleSort(allPrevAddrs, size) {
        var i, j;

        for (i = 0; i < size-1; i++) {
            for (j = 0; j < size-i-1; j++) {
                if (this.elementMap[allPrevAddrs[j]].depth < this.elementMap[allPrevAddrs[j+1]].depth) {
                    this.swap(allPrevAddrs,j,j+1);
                }
            }
        }
    }
    
    swap(array, before, after) {
        var temp = array[before];
        array[before] = array[after];
        array[after] = temp;
    }

    /**
     * Generate graph representataion data structure for reactflow
     */
    generateReactflowGraph(startingY, customNodeStyle) {
        // calculate the width of the graph and reset the visit flag
        // var maximumDepth = 0;
        // for (let addr in this.elementMap) {
        //     if (this.elementMap[addr].depth > maximumDepth) {
        //         maximumDepth = this.elementMap[addr].depth
        //     }
        //     this.elementMap[addr].isVisited = false
        // }
        // let width = maximumDepth + 1
        
        // starting from the leaves and draw the block up
        this.placementOccupiedSet = new Set()
        this.memGraphRepresentation = []
        
        var nextY = startingY
        for (let addr in this.elementMap) {
            if (this.elementMap[addr].getAfterAddr().size === 0) {
                nextY = this._generateReactflowGraphHelper(
                    "0x0",
                    "s0",
                    this.elementMap[addr],
                    startingY,
                    this.elementMap[addr].depth,
                    customNodeStyle
                );
            }
        }
        return nextY
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
                leafNodes.add(addr + ";0x0")
            }
        }
        
        // Start from leaf nodes, find the height of the node starting from leaf(0)
        this.resetNodesUnvisited()
        this.generateHeightofEachNode(leafNodes, 0)


        let rootNodes = new Set()

        for (let addr in this.elementMap) {
            if (this.elementMap[addr].getPrevAddr().size > 1) {
                continue
            } else {
                rootNodes.add(addr + ";0x0")
            }
        }

        // start from root nodes, find the deepest depth of the node starting from root(0)
        this.resetNodesUnvisited()
        this.generateDepthofEachNode(rootNodes, 0)
    }
}