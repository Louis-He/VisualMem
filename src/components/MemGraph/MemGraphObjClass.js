export default class MemGraphObjClass {
    constructor() {
        this.elementSet = new Set()
    }

    addElement(ele) {
        this.elementSet.add(ele)
    }

    dumpElement() {
        for (let item of this.elementSet) {
            console.log(item)
        }
    }
}