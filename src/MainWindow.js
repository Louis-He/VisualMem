import React from 'react';
import './css/App.css';
import './css/nodeStyle.css';
import './../node_modules/react-reflex/styles.css';
import './../node_modules/react-grid-layout/css/styles.css';
import './../node_modules/react-resizable/css/styles.css';
import { Container, Button, Form } from 'react-bootstrap';
import ReactTooltip from "react-tooltip";
import { Folder2Open, CaretRightSquare, XSquare, SkipEndCircle, ArrowRightCircle, Eye, EyeSlash } from 'react-bootstrap-icons';
import { ThemeProvider } from "styled-components";
import { MainBody } from "./components/GlobalStyles";
import GridLayout from 'react-grid-layout';

import ReactFlow, { Handle } from 'react-flow-renderer';

const ipcRenderer = window.require("electron").ipcRenderer;


function renderRequestsendMsgToGDB(msg) {
  ipcRenderer.invoke('sendMsgToGDB', msg)
}

// TODO: need to update
const elementsCreator = function ({locals}) {

  const elementList = [];

  let ID = 1;
  let X = 100;
  let Y = 50;

  // /console.log(locals.length)
  if (locals.length < 2) {
    return []
  }
  for (let i = 0; i < 2; i++) {
    const element = { id: ID,  type: 'special', position: {x:X, y:Y}, data: { text: "name: " + locals[i][0].name + ", value: " + locals[i][0].value}, style: {opacity: 1}};
    ID = ID + 1;
    Y = Y + 50;
    elementList.push(element);
  }

  return elementList
}

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

// ==== renderer class ====
export default class MainWindow extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      GDBAttached: false,
      displayEle: false,

      GDBCommand: "> ",
      fileData: "",
      elements: [],
      sourceFile: "",
      lineNumber: ""
    }
  }

  // TODO: review
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

  componentDidMount() {
    var that = this;
    ipcRenderer.on('distributeDetailedLocals', function (evt, locals) {
      const elementTemp = elementsCreator(locals)
      that.setState( {
        elements: elementTemp
      })
    });

    ipcRenderer.on('getVariablesForGraphInitializer', function (evt, message) {
      const parsedJson = JSON.parse(message.message)
      let elementJson = parsedJson['locals'];

      that.setState({
        sourceFile: parsedJson['sourceFile'],
        lineNumber: parsedJson['lineNumber']
      })
      console.log(parsedJson['lineNumber'])
      console.log(parsedJson['sourceFile'])

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
        element_test: element_test,
      })
    });

    ipcRenderer.on('distributeUserProgramExited', function (evt) {
      if (that.state.GDBAttached) {
        that.setState( {
          GDBAttached: false,
          elements: []
        })
      }
    });

    ipcRenderer.on('distributeGDBUpdate', function (evt) {
      console.log("Update happened in the GDB backend")

      if (that.state.displayEle) {
        that.displayVar()
      }
    });

  }

  async renderRequestStartGDB() {
    const ifStartGDB = await ipcRenderer.invoke('requestStartGDB',)

    if (ifStartGDB) {
      this.setState({
        GDBAttached: true
      })
    }
  }
  

  renderRequestNextLineExecution() {
    ipcRenderer.invoke('requestNextLineGDB', 1, )
  }

  renderRequestContinueExecution() {
    ipcRenderer.invoke('requestContinueGDB',)
  }

  renderRequestStopGDB() {
    ipcRenderer.invoke('requestStopGDB',)
    if (this.state.GDBAttached) {
      this.setState({
        GDBAttached: false
      })
    }
  }

  updateProgramVis() {
    this.setState({
      displayEle: !this.state.displayEle
    })
  }

  GDBCommandLineOnChangeHandler(e) {
    this.setState({
      GDBCommand: e.target.value
    })
  }

  sendGDBCommandButton() {
    renderRequestsendMsgToGDB(this.state.GDBCommand.substr(2))
    this.setState({
      GDBCommand: "> "
    })
  }

  displayVar() {
    renderRequestsendMsgToGDB('getDetailedLocals')
  }


  onGDBCommandEnterPress(e) {
    if(e.keyCode === 13 && e.shiftKey === false) {
      e.preventDefault();
      this.sendGDBCommandButton();
    }
  }

  selectProjectFolder(e) {
    e.preventDefault();
    ipcRenderer.invoke('requestSelectProjectFolder',)
  }

  selectExecutable(e) {
    e.preventDefault();
    ipcRenderer.invoke('requestSelectExecutable', this.props.projectFolder)
  }

  showFile(e) {
    e.preventDefault();
    ipcRenderer.invoke('showFile', this.props.executablePath)
    var that = this;
    ipcRenderer.on('distributeFileData', function (evt, response) {
      that.setState({
        fileData: response.fileData
      })
    });
  }
  
  render() {
    let startGDBButton = <span></span>
    let eyeGDBButton = <span></span>
    let eyeSlashGDBButton = <span></span>
    let nextLineGDBButton = <span></span>
    let continueGDBButton = <span></span>
    let stopGDBButton = <span></span>

    if (!this.state.GDBAttached) {
      startGDBButton = [
        <Button
          onClick={() => this.renderRequestStartGDB()}
          data-tip data-for="startGDBTip"
          className="btn btn-success btn-sm"
          style={{ fontSize: "18px", lineHeight: "1", padding: "5px" }}
          key="startButton">
          <CaretRightSquare style={{ verticalAlign: 'baseline' }} />
        </Button>,
        <ReactTooltip id="startGDBTip" place="top" effect="solid" key="startButtonTip">
          Start GDB and pause at main function
        </ReactTooltip>
      ]
    } else {
      nextLineGDBButton = [
        <Button
          onClick={() => this.renderRequestNextLineExecution()}
          data-tip data-for="nextLineTip"
          className="btn btn-primary btn-sm"
          style={{ fontSize: "18px", lineHeight: "1", padding: "5px", marginLeft: "10px" }}
          key="nextLineButton">
            <ArrowRightCircle style={{ verticalAlign: 'baseline' }} />
        </Button>,
        <ReactTooltip id="nextLineTip" place="top" effect="solid"  key="nextLineTip">
          Execute One Line
        </ReactTooltip>
      ]
      continueGDBButton = [
        <Button
          onClick={() => this.renderRequestContinueExecution()}
          data-tip data-for="continueTip"
          className="btn btn-primary btn-sm"
          style={{ fontSize: "18px", lineHeight: "1", padding: "5px", marginLeft: "10px" }}
          key="continueButton">
            <SkipEndCircle style={{ verticalAlign: 'baseline' }} />
        </Button>,
        <ReactTooltip id="continueTip" place="top" effect="solid"  key="continueTip">
          Continue Execution until next breakpoint
        </ReactTooltip>
      ]
      stopGDBButton = [
        <Button
          onClick={() => this.renderRequestStopGDB()}
          data-tip data-for="stopGDBTip"
          className="btn btn-danger btn-sm"
          style={{ fontSize: "18px", lineHeight: "1", padding: "5px", marginLeft: "10px" }}
          key="stopButton">
            <XSquare style={{ verticalAlign: 'baseline' }} />
        </Button>,
        <ReactTooltip id="stopGDBTip" place="top" effect="solid"  key="stopButtonTip">
          Stop GDB
        </ReactTooltip>
      ]

      if (!this.state.displayEle) {
        eyeGDBButton = [
          <Button
            onClick={() => this.updateProgramVis()}
            data-tip data-for="showVisGDBTip"
            className="btn btn-success btn-sm"
            style={{ fontSize: "18px", lineHeight: "1", padding: "5px", marginLeft: "10px" }}
            key="showVisGDBButton">
              <Eye style={{ verticalAlign: 'baseline' }} />
          </Button>,
          <ReactTooltip id="showVisGDBTip" place="top" effect="solid"  key="showVisGDBTip">
            Show Program Visualization
          </ReactTooltip>
        ]
      } else {
        eyeSlashGDBButton = [
          <Button
            onClick={() => this.updateProgramVis()}
            data-tip data-for="hideVisGDBTip"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: "18px", lineHeight: "1", padding: "5px", marginLeft: "10px" }}
            key="hideVisGDBButton">
              <EyeSlash style={{ verticalAlign: 'baseline' }} />
          </Button>,
          <ReactTooltip id="hideVisGDBTip" place="top" effect="solid"  key="hideVisGDBTip">
            Hide Program Visualization
          </ReactTooltip>
        ]
      }
    }

    const layout = [
      {i: 'a', x: 0, y: 0, w: 1, h: 2, isDraggable: false, isResizable: true},
      {i: 'b', x: 1, y: 0, w: 3, h: 2, minW: 2, maxW: 4},
      {i: 'c', x: 4, y: 0, w: 1, h: 2}
    ];

    return (
      <ThemeProvider theme={this.props.theme}>
        <>
          <MainBody>
          
            
          <Container>
                        {/* <div style={{ height: "200px" }}>
                        <ReflexContainer orientation="vertical">

                          <ReflexElement>
                            <div className="pane-content">
                              <label>
                                Left Pane (resizable)

                                <div style={{ height: 500, width: 500 }}>
                                  <ReactFlow elements={this.state.elements} nodeTypes={nodeTypes} />
                                </div>

                              </label>
                            </div>
                          </ReflexElement>

                          <ReflexSplitter/>

                          <ReflexElement
                            minSize="200"
                            maxSize="800">
                            <div className="pane-content">
                              <label>
                                Right Pane (resizable)
                                <br/>
                                <br/>
                                minSize = 200px
                                <br/>
                                maxSize = 800px
                              </label>
                            </div>
                          </ReflexElement>

                          </ReflexContainer>
                        </div> */}
                      
                      
                        
                        <div className="container_ext">
                          {/* <Button onClick={renderRequestOpenConfig}>TEST button</Button>
                          <Button onClick={renderRequestStartGDB}>Start GDB</Button>
                          <Button onClick={renderRequestStopGDB}>Stop GDB</Button> */}
                          {startGDBButton}
                          {nextLineGDBButton}
                          {continueGDBButton}
                          {stopGDBButton}
                          {eyeGDBButton}
                          {eyeSlashGDBButton}
                        </div>
                        <div>
                          <label>Select Project Folder
                            <span
                              htmlFor="files"
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: "18px", lineHeight: "1" }}>
                              <Folder2Open style={{ verticalAlign: 'baseline' }} />
                            </span>
                            <input id="files"
                              webkitdirectory = ""
                              style={{ visibility: "hidden", width: "0px" }}
                              type="file"
                              onClick={(e) => this.selectProjectFolder(e)}
                            />
                          </label>
                        </div>

                        <div>
                          <p>Current Selected Folder: {this.props.projectFolder}</p>
                        </div>

                        <div>
                          <p>Current source file: {this.state.sourceFile}</p>
                        </div>

                        <div>
                          <p>Current line number: {this.state.lineNumber}</p>
                        </div>

                        <div>
                          <label>Select Executable
                            <span
                              htmlFor="files"
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: "18px", lineHeight: "1" }}>
                              <Folder2Open style={{ verticalAlign: 'baseline' }} />
                            </span>
                            <input id="files"
                              style={{ visibility: "hidden", width: "0px" }}
                              type="file"
                              onClick={(e) => this.selectExecutable(e)}
                            />
                          </label>
                        </div>

                        <div>
                          <p>Current Executable Path: {this.props.executablePath}</p>
                        </div>

                        <div style={{ height: 500, width: 1000 }}>
                          <ReactFlow elements={this.state.element_test} nodeTypes={nodeTypes} minZoom={1} maxZoom={1} translateExtent={[[0, 0], [1000, 500]]} />
                        </div>

                        <div>
                          <Form>
                            <Form.Group controlId="exampleForm.ControlTextarea1">
                              <Form.Label>Command Sent to GDB</Form.Label>
                              <Form.Control as="textarea" rows={3}
                                value={this.state.GDBCommand}
                                onKeyDown={(e) => this.onGDBCommandEnterPress(e)}
                                onChange={(e) => this.GDBCommandLineOnChangeHandler(e)} />
                            </Form.Group>

                            <Button variant="primary" onClick={(e) => this.sendGDBCommandButton()}>
                              Send
                            </Button>

                          </Form>
                        </div>

                        <Button variant="primary" onClick={(e) => this.displayVar()}>
                          Display Variables
                        </Button>
                        
                        {/* <Button variant="primary" onClick={(e) => this.showFile(e)}>
                          Display File Content
                        </Button> */}

                        {/* <div>
                          <p> File Data: {this.state.fileData} </p>
                        </div> */}

                                    
                        <GridLayout className="layout" layout={layout} cols={12} rowHeight={30} width={1200}>
                          <div key="a">a</div>
                          <div key="b">b</div>
                          <div key="c">c</div>
                        </GridLayout>
                      </Container>
          </MainBody>
        </>
      </ThemeProvider>
    );
  }
}