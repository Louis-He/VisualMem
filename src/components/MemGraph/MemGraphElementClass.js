export default class MemGraphElementClass {
    constructor(addr, ele) {
        // Variables used as helpers
        this.isVisited   = false
        this.visitedFrom = new Set()
        this.height      = -1
        this.depth       = -1
        //this.sourceCount = 0

        this._prevAddr   = new Set()
        this._afterAddr  = new Set()
        this.addr        = addr
        this.name        = ele.name
        this.type        = ele.type
        this.value       = ele.value

        this.isPtr       = "ptrTarget" in ele
        this.isLL        = "isLL" in ele && ele.isLL
        this.isArray     = "isArray" in ele && ele.isArray
        this.is2D        = "is2D"    in ele && ele.is2D // if the array is a 2D array
        this.isTree      = "isTree"  in ele && ele.isTree
        this.leftChild   = false
        this.rightChild  = false

        if (this.isLL) {
            this.linkedMember     = "linkedMember" in ele && ele.linkedMember
            this.members          = "members" in ele && ele.members
            if (this.linkedMember in ele.value) {
                this.nextLinkedMemberAddr =  ele.value[this.linkedMember].value
                this.addAfterAddr(this.nextLinkedMemberAddr)
            }
        }

        if(this.isTree) {
            this.linkedMemberLeft   = "linkedMember" in ele && ele.linkedMember.left
            this.linkedMemberRight  = "linkedMember" in ele && ele.linkedMember.right
            this.members            = "members" in ele && ele.members

            if (this.linkedMemberLeft in ele.value) {
                this.nextLinkedMemberAddr =  ele.value[this.linkedMemberLeft].value
                this.addAfterAddr(this.nextLinkedMemberAddr)
                this.leftChild = this.nextLinkedMemberAddr
            }
            if (this.linkedMemberRight in ele.value) {
                this.nextLinkedMemberAddr = ele.value[this.linkedMemberRight].value
                this.addAfterAddr(this.nextLinkedMemberAddr)
                this.rightChild = this.nextLinkedMemberAddr
            }
        }

        // initialize the afterAddr set
        if ("ptrTarget" in ele) {
            this.isPtr = true
            if (ele.ptrTarget) {
                this.addAfterAddr(ele.value)
            }
        }
    }

    addAfterAddr(addr) {
        this._afterAddr.add(addr)
    }

    addPrevAddr(addr) {
        this._prevAddr.add(addr)
    }

    removeAfterAddr(addr) {
        this._afterAddr.delete(addr)
    }

    /**
     * return the length of the element name
     */
    getElementName() {
        return this.name.length
    }

    getValue() {
        // return JSON.stringify(this.value)
        return this.value
    }

    getAfterAddr() {
        return this._afterAddr
    }

    getPrevAddr() {
        return this._prevAddr
    }

    getMembers() {
        return this.members
    }

    getLeftAddr() {
        return this.linkedMemberLeft
    }

    getRightAddr() {
        return this.linkedMemberRight
    }
}