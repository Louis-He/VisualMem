import React from 'react';
import ReactFlow, { Handle } from 'react-flow-renderer';

const ipcRenderer = window.require("electron").ipcRenderer;

// special type components
const arrayHeadComponent = ({ data }) => {
    return (
      <div className='arrayHead'>
        <p className='arrayName'> {data.name}</p>
        <div> 
          <div className='arrayIndex'> {data.index} </div>
          <div className='arrayNode'> {data.text} </div>
        </div>
      </div>
    );
  };
  
  const arrayComponent = ({ data }) => {
    return (
      <div>
        <div className='arrayIndex'> {data.index} </div>
        <div className='arrayNode'> {data.text} </div>
      </div>
    );
  };
  
  const normalComponent = ({ data }) => {
    return (
      <div className='normal'>
        <p className='normalName'> {data.name} </p>
        <div>
          <div className='normalNode'> {data.text} </div>
        </div>
      </div>
    );
  };
  
  // TODO: change class name
  const normalNodeComponent = ({ data }) => {
    return (
      <div className='normal'>
        <Handle 
          type="source"
          position="left"
          style = {{top: "35%", left: "44.44%", borderRadius: 0}}
          className='linkedListNode'
        />
        <p className='normalName'> {data.name} </p>
        <div>
          <div className='normalNode'> {data.text} </div>
        </div>
      </div>
    );
  };
  
  // TODO: change class name
  const pointerComponent = ({ data }) => {
    return (
      <div className='normal'>
        <p className='pointerName'> {data.name} </p>
        <div>
          <Handle type="target" position="left" style = {{top: "35%", left: "70%", borderRadius: 0}} className='linkedListNode'/>
          <div className='pointerNode'> </div>
          <Handle type="source" position="right" style = {{top: "35%", borderRadius: 0}} className='linkedListNode'/>
        </div>
      </div>
    );
  };
  
  const linkedListHeadComponent = ({ data }) => {
    return (
      <div className='linkedList'>
        <p className='linkedListName'> {data.name} </p>
        <div>
          <div className='linkedListIndex'> Head </div>
          <div className='linkedListNode'> {data.text} </div>
        </div>
        <Handle 
          type="source"
          position="right"
          className = "handle"
          style = {{top: "90%", borderRadius: 0}}
        />
      </div>
    )
  }
  
  const linkedListComponent = ({ data }) => {
    return (
      <div>
        <Handle type="target" position="left" className='linkedListNode'/>
        <div className='linkedListNode'> {data.text} </div>
        <Handle 
          type="source"
          position="right"
          style = {{top: "70%", borderRadius: 0}}
          className='linkedListNode'
        />
      </div>
    )
  }
  
  const treeHeadComponent = ({ data }) => {
    return (
      <div>
        <Handle id = "a" type="source" position="bottom" style = {{left: "30%", borderRadius: 0}} className='treeNode'/>
        <div className='treeNode'> {data.text} </div>
        <Handle 
          id = "b"
          type="source"
          position="bottom"
          style = {{left: "70%", borderRadius: 0}}
          className='treeNode'
        />
      </div>
    )
  }
  
  const treeComponent = ({ data }) => {
    return (
      <div>
        <Handle type="target" position="top" style = {{left: "50%", borderRadius: 0}} className='treeNode' id = 'a'/>
        <Handle type="target" position="bottom" style = {{left: "30%", borderRadius: 0}} className='treeNode' id = 'b'/>
        <div className='treeNode'> {data.text} </div>
        <Handle 
          type="source"
          position="bottom"
          style = {{left: "70%", borderRadius: 0}}
          className='treeNode'
          id = 'c'
        />
      </div>
    )
  }

const nodeTypes = {
    array: arrayComponent,
    arrayHead: arrayHeadComponent,
    normal: normalComponent,
    normalNode: normalNodeComponent,
    pointer: pointerComponent,
    linkedList: linkedListComponent,
    linkedListHead: linkedListHeadComponent,
    tree: treeComponent,
    treeHead: treeHeadComponent,
};

var x_test = 0;
var y_test = 0;
var x_min = 0;
var element_index = 0;
var groupElement = [];

export default class MemGraph extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            element_graph: "",
            sourceFile: "",
            lineNumber: "", 
        }
    }

    componentDidMount () {
        var that = this;
        ipcRenderer.on('getVariablesForGraphInitializer', function (evt, message) {
            const parsedJson = JSON.parse(message.message)

            that.setState({
              variableDict: parsedJson['locals'],
            })
            
            that.props.appState.setState({
              sourceFile: parsedJson['sourceFile'],
              lineNumber: parsedJson['lineNumber']
            })

            let elementJson = parsedJson['locals'];
      
            var element_test = [];
            var element_temp = Object.create(null);
            var element_id = [];
            var be_pointed = [];
      
            // convert the json into array && added a field
            for (var i in elementJson) {
              // i -> outer key
              // elementJson[i] -> outer value
              let value = elementJson[i];
              var map_temp = Object.create(null);
      
              for (var j in value) {
                //j -> innner key
                //elementJson[i][j] -> innner value
                map_temp[j] = value[j]
              }
              if (map_temp['ptrTarget']) {
                be_pointed.push(map_temp["value"])
              }
              if (map_temp['isLL']) {
                be_pointed.push(map_temp['value'][map_temp['linkedMember']]['value'])
              }
              map_temp['visited'] = false
      
              element_temp[i] = map_temp
              element_id.push(i)
            }
      
            console.log(element_temp)
            console.log(be_pointed)
      
            // iterate the json for each of the element
            for (var key in element_temp) {
              if(element_temp[key]['isLL']) { //if the element is a linked list
                var nextName = element_temp[key]['linkedMember'];
                var nextNode = element_temp[key]['value'][nextName]['value'];
      
                if (nextNode !== '0x0') {
                  that.getNode(element_temp, element_test, element_id, key, nextNode)
                }
      
              } else { // if the element is not a linked list
                that.getNode(element_temp, element_test, element_id, key, element_temp[key]['value'])
              }
      
              // adjust positions
              for (var element of element_test) {
                if(groupElement.includes(element.id)) {
                  if(element.position !== undefined && (element.position.x < 0 || be_pointed.includes(element.id))) {
                    element.position.x = element.position.x + (-x_min) + 50;
                  }
                }
              }
              groupElement = [];
              x_min = 0;
            }
            // adjust positions
            // for (var element of element_test) {
            //   if(element.position !== undefined && (element.position.x < 0 || be_pointed.includes(element.id))) {
            //     element.position.x = element.position.x + (-x_min) + 50;
            //   }
            // }
            // x_min = 0;
            
            console.log(element_test)
            console.log(element_temp)
            x_test = 0;
            y_test = 0;
            
      
            that.setState({
                element_graph: element_test,
            })
        });
    }
    

    getNode(element_temp, element_test, element_id, outer_key, value) {
        // if the element has been visited before -> return
        if (element_temp[outer_key]['visited']) {
            return
        }
    
        if((element_temp[outer_key]['ptrTarget'] && element_id.includes(value))) { // if ptrTarget field presented -> pointer, get the pointed element first (recursion)
            if(element_temp[value]['isLL']) { //if the next node is a linked list
                let nextName = element_temp[value]['linkedMember'];
                let nextNode = element_temp[value]['value'][nextName]['value'];
                if (nextNode !== '0x0') {
                    this.getNode(element_temp, element_test, element_id, value, nextNode)
                }
            } else { // if the next node is not a linked list
                this.getNode(element_temp, element_test, element_id, value, element_temp[value]['value'])
            }
        } else if (element_temp[outer_key]['isLL']) { // the node is in linked list
            let nextName = element_temp[outer_key]['linkedMember'];
            let nextNode = element_temp[outer_key]['value'][nextName]['value'];
            if (nextNode !== '0x0') {
                this.getNode(element_temp, element_test, element_id, value, nextNode)
            }
        } else if (element_temp[outer_key]['ptrTarget'] && !element_id.includes(value)) { // if pointer but the element it points does not exist
            console.log("ERROR")
            return
        }
    
        // when the function gets returned, enters here
        if(element_temp[outer_key]['visited'] === false) { // only push into array if the element has not been visited
          if(element_temp[outer_key]['ptrTarget']) { // for pointers
            let x_temp;
            let y_temp;
    
            for (var element of element_test) {
              if(element_temp[value]['isLL']) {
                if(element.id === value) {
                  if(element.position !== undefined) {
                    x_temp = element.position.x - 140;
                    y_temp = element.position.y;
                    if (x_temp <= x_min) {
                      x_min = x_temp;
                    }
                  }
                  break;
                }
              } else {
                if(element.id === element_temp[outer_key]['value']) {
                  // console.log(element_temp[outer_key]['value'])
                  // console.log(element.position.x)
                  if(element.position !== undefined) {
                    x_temp = element.position.x - 80;
                    y_temp = element.position.y;
                    if (x_temp <= x_min) {
                      x_min = x_temp;
                    }
                  }
                  break;
                }
              }
            }
    
            // push for node
            element_test.push({ id: outer_key,  type: 'pointer', position: {x:x_temp, y:y_temp}, data: { name: element_temp[outer_key]['name'], text: value}, draggable: true})
            element_temp[outer_key]['index'] = element_index;
            element_index = element_index + 1;
    
            // push for edge
            element_test.push({
              id: outer_key + element_temp[outer_key]['value'],
              source: outer_key,
              target: element_temp[outer_key]['value'],
              arrowHeadType: 'arrow', 
              style: {strokeWidth: 4},
            })
            element_index = element_index + 1;
      
          } else if (element_temp[outer_key]['isLL']) { // for linked list
    
            let nextName = element_temp[outer_key]['linkedMember'];
            let nextNode = element_temp[outer_key]['value'][nextName]['value'];
            let nodeValue = element_temp[outer_key]['value']['val']['value'];
    
            let x_temp;
            let y_temp;
    
            if (nextNode !== '0x0') {
              for (let element of element_test) {
                if(element.id === nextNode) {
                  if(element.position !== undefined) {
                    x_temp = element.position.x - 140;
                    y_temp = element.position.y;
                    if (x_temp <= x_min) {
                      x_min = x_temp;
                    }
                  }
                  break;
                }
              }
            } else {
              x_test = 50;
              y_test = y_test + 50;
              x_temp = x_test;
              y_temp = y_test;
            }
            
            // push for node
            element_test.push({ id: outer_key,  type: 'linkedList', position: {x:x_temp, y:y_temp}, data: { name: element_temp[outer_key]['name'], text: nodeValue}, draggable: true})
            element_temp[outer_key]['index'] = element_index;
            element_index = element_index + 1;
            
            // push for edge
            if (nextNode !== '0x0') {
              element_test.push({
                id: outer_key + element_temp[outer_key]['value'],
                source: outer_key,
                target: nextNode,
                arrowHeadType: 'arrow', 
                style: {strokeWidth: 4},
              })
              element_index = element_index + 1;
            }
    
          } else { // for normal nodes
            x_test = 50;
            y_test = y_test + 50;
    
            element_test.push({ id: outer_key,  type: 'normalNode', position: {x:x_test, y:y_test}, data: { name: element_temp[outer_key]['name'], text: value}, draggable: true})
            element_temp[outer_key]['index'] = element_index;
            element_index = element_index + 1;
          }
      
        }
      
        element_temp[outer_key]['visited'] = true; // mark the element as visited
        groupElement.push(outer_key)
        return;
      }

    render() {
        // this.updateGraph();.

        // return "TEST";
        
        if (this.state.element_graph !== "") {
            return (
                <div style={{ height: 500, width: 1000 }}>
                    <ReactFlow elements={this.state.element_graph} nodeTypes={nodeTypes} minZoom={1} maxZoom={1} translateExtent={[[0, 0], [1000, 500]]} />
                </div>
            )
        }
        
        return "NO DATA"
    }
}