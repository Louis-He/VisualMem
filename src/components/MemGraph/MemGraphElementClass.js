export default class MemGraphElementClass {
    constructor(addr, ele) {
        // Variables used as helpers
        this.isVisited   = false
        this.visitedFrom = new Set()
        this.height      = -1
        this.depth       = -1

        this._prevAddr   = new Set()
        this._afterAddr  = new Set()
        this.addr        = addr
        this.name        = ele.name
        this.type        = ele.type
        this.value       = ele.value

        this.isLL        = "isLL" in ele && ele.isLL
        if (this.isLL) {
            this.linkedMember     = "linkedMember" in ele && ele.linkedMember
            if (this.linkedMember in ele.value) {
                this.nextLinkedMemberAddr =  ele.value[this.linkedMember].value
                this.addAfterAddr(this.nextLinkedMemberAddr)
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

    getAfterAddr() {
        return this._afterAddr
    }

    getPrevAddr() {
        return this._prevAddr
    }
}