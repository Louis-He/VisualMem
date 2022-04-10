import React from 'react';
import ReactFlow, { Handle } from 'react-flow-renderer';
import MemGraphClass from './MemGraphClass';

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
        id="s0"
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
        <Handle type="source" position="right" style = {{top: "35%", borderRadius: 0}} className='linkedListNode' id="s0"/>
        <div className='pointerNode'> </div>
        <Handle type="target" position="left" style = {{top: "35%", left: "70%", borderRadius: 0}} className='linkedListNode' id="t0"/>
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
        id="s0"
      />
    </div>
  )
}
  
const linkedListComponent = ({ data }) => {
  return (
    <div className='linkedList'>
      <p className='linkedListName'> {data.name} </p>
      <div>
        <div className='linkedListNode'>{data.text}</div>
      </div>
      <Handle type="target" position="left" style = {{top: "35%", left: "42%", borderRadius: 0}} className = "handle" id="t0"/>
      <Handle 
        type="source"
        position="right"
        className = "handle"
        style = {{top: "35%", borderRadius: 0}}
        id="s0"
      />
    </div>
  )
}
  
const treeHeadComponent = ({ data }) => {
  return (
    <div>
      <Handle type="source" position="bottom" style = {{left: "30%", borderRadius: 0}} className='treeNode' id="s0"/>
      <div className='treeNode'> {data.text} </div>
      <Handle 
        type="source"
        position="bottom"
        style = {{left: "70%", borderRadius: 0}}
        className='treeNode'
        id="s1"
      />
    </div>
  )
}
  
const treeComponent = ({ data }) => {
  return (
    <div>
      <Handle type="target" position="top" style = {{left: "50%", borderRadius: 0}} className='treeNode' id='t0'/>
      <Handle type="source" position="bottom" style = {{left: "30%", borderRadius: 0}} className='treeNode' id='s0'/>
      <div className='treeNode'> {data.text} </div>
      <Handle 
        type="source"
        position="bottom"
        style = {{left: "70%", borderRadius: 0}}
        className='treeNode'
        id='s1'
      />
    </div>
  )
}

var nodeTypes;

export default class MemGraph extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            nodeTypesId: 0,
            element_graph: "",
            memGraph: new MemGraphClass(),
        }
    }

    componentDidMount () {
        var that = this;

        ipcRenderer.on('getVariablesForGraphInitializer', function (evt, message) {
            nodeTypes = {
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
            const parsedJson = JSON.parse(message.message)
            
            that.props.updateLineNumber(parsedJson['lineNumber'])
            that.props.updateSourceFile(parsedJson['sourceFile'])

            let localVarJson = parsedJson['locals'];
            let memGraph = that.state.memGraph;

            // Construct the new memory graph, initialize the whole graph
            console.log(localVarJson)
            memGraph.init(localVarJson)

            memGraph.constructGraph()
            
            // var customNodeStyle = {}
            var reactFlowGraph = memGraph.generateReactflowGraph(nodeTypes)
            
            that.setState({
                element_graph: reactFlowGraph,
                nodeTypesId: that.state.nodeTypesId + 1,
            })
        });
    }

    render() {
        
        if (this.state.element_graph !== "") {
            return (
                <div style={{ height: this.props.winHeight-330, width: (this.props.winWidth - 270) * 0.45 }}>
                    <ReactFlow elements={this.state.element_graph} nodeTypes={nodeTypes} nodeTypesId={this.state.nodeTypesId} minZoom={0.1} maxZoom={10} translateExtent={[[0, 0], [10000, 5000]]} />
                </div>
            )
        }
        
        return "NO DATA"
    }
}