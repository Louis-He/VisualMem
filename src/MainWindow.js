import React from 'react';
import './css/App.css';
import './../node_modules/react-reflex/styles.css';
import './../node_modules/react-grid-layout/css/styles.css';
import './../node_modules/react-resizable/css/styles.css';
import { Container, Button, Form } from 'react-bootstrap';
import ReactTooltip from "react-tooltip";
import { Folder2Open, CaretRightSquare, XSquare } from 'react-bootstrap-icons';
import { ThemeProvider } from "styled-components";
import { MainBody } from "./components/GlobalStyles";
import GridLayout from 'react-grid-layout';
// import {
//   ReflexContainer,
//   ReflexSplitter,
//   ReflexElement
// } from 'react-reflex'

import ReactFlow, { Handle } from 'react-flow-renderer';


const ipcRenderer = window.require("electron").ipcRenderer;

// ==== renderer -> main functions ====
// function renderRequestOpenConfig() {
//   ipcRenderer.invoke('requestOpenConfig',)
// }

function renderRequestStartGDB() {
  ipcRenderer.invoke('requestStartGDB',)
}

function renderRequestStopGDB() {
  ipcRenderer.invoke('requestStopGDB',)
}

function renderRequestsendMsgToGDB(msg) {
  ipcRenderer.invoke('sendMsgToGDB', msg)
}


const elementsCreator = function ({locals}) {

  const elementList = [];

  let ID = 1;
  let X = 100;
  const Y = 100;

  // /console.log(locals.length)
  for (let i = 0; i < 2; i++) {
    const element = { id: ID,  type: 'special', position: {x:X, y:Y}, data: { text: "name: " + locals[i][0].name + " value: " + locals[i][0].value}};
    ID = ID + 1;
    elementList.push(element);
  }

  console.log(elementList)

  return elementList
}


// ==== renderer <- main functions ====
// ipcRenderer.on('distributeDetailedLocals', function (evt, locals) {
//   console.log(locals)
//   console.log(elementsCreator(locals))
// });


const customNodeStyles = {
  background: '#9CA8B3',
  color: '#FFF',
  padding: 10,
};

const CustomNodeComponent = ({ data }) => {
  return (
    <div style={customNodeStyles}>
      <Handle type="target" position="left" style={{ borderRadius: 0 }} />
      <div>{data.text}</div>
      <Handle
        type="source"
        position="right"
        id="b"
        style={{ top: '70%', borderRadius: 0 }}
      />
    </div>
  );
};


const nodeTypes = {
  special: CustomNodeComponent,
};


// ==== renderer class ====
export default class MainWindow extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      GDBCommand: "> ",
      fileData: "",
      elements: []
    }
  }

  componentDidMount() {
    var that = this;
    ipcRenderer.on('distributeDetailedLocals', function (evt, locals) {
      const elementTemp = elementsCreator(locals)
      that.setState( {
        elements: elementTemp
      })
    });
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

    const layout = [
      {i: 'a', x: 0, y: 0, w: 1, h: 2, isDraggable: false, isResizable: true},
      {i: 'b', x: 1, y: 0, w: 3, h: 2, minW: 2, maxW: 4},
      {i: 'c', x: 4, y: 0, w: 1, h: 2}
    ];

    return (
      <ThemeProvider theme={this.props.theme}>
        <>
          <MainBody>
            
            {/* <header>
              <div className="App-header"></div>
            </header> */}
              <div className="wrap">
                <div className="resize-box">
                  <div className="resize-box-left fl">
                      <div className="resize-bar horizontal limit-horizontal"></div>
                      <div className="dividing-line-horizontal"></div>
                      <div className="resize-real-box">
                      <div id="left" className="left">
                        <div id="logoDiv" className="logoDiv">
                            <p id="logoTitle" className="logoTitle">
                                <span>Debugger Visualizer</span>
                            </p>
                        </div>
                        <div className="menu-title">Menu 1</div>
                        <div className="menu-item" href="#one" data-toggle="tab">
                            －functionality 1
                        </div>
                        <div className="menu-item" href="#two" data-toggle="tab">
                            －functionality 2
                        </div>
                        <div className="menu-title">Menu 2</div>
                        <div className="menu-item" href="#three" data-toggle="tab">
                            －functionality 1
                        </div>
                        <div className="menu-item" href="#four" data-toggle="tab">
                            －functionality 2
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="resize-box-right">
                    <div id="one" className="tab-pane active">
                      <Container>
                        {/* <div style={{ height: "200px" }}>
                        <ReflexContainer orientation="vertical">

                          <ReflexElement>
                            <div className="pane-content">
                              <label>
                                Left Pane (resizable)

                                <div style={{ height: 300 }}>
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
                          <Button
                              onClick={renderRequestStartGDB}
                              data-tip data-for="startGDBTip"
                              className="btn btn-success btn-sm"
                              style={{ fontSize: "18px", lineHeight: "1", padding: "5px" }}>
                              <CaretRightSquare style={{ verticalAlign: 'baseline' }} />
                          </Button>

                          <ReactTooltip id="startGDBTip" place="top" effect="solid">
                            Start GDB and pause at main function
                          </ReactTooltip>

                          <Button
                              onClick={renderRequestStopGDB}
                              data-tip data-for="stopGDBTip"
                              className="btn btn-danger btn-sm"
                              style={{ fontSize: "18px", lineHeight: "1", padding: "5px", marginLeft: "10px" }}>
                                <XSquare style={{ verticalAlign: 'baseline' }} />
                          </Button>

                          <ReactTooltip id="stopGDBTip" place="top" effect="solid">
                            Stop GDB
                          </ReactTooltip>
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

                        <div style={{ height: 300 }}>
                          <ReactFlow elements={this.state.elements} nodeTypes={nodeTypes} />
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

                        

                        <Button variant="primary" onClick={(e) => this.showFile(e)}>
                          Display File Content
                        </Button>

                        <div>
                          <p> File Data: {this.state.fileData} </p>
                        </div>

                        

                        
                        <GridLayout className="layout" layout={layout} cols={12} rowHeight={30} width={1200}>
                          <div key="a">a</div>
                          <div key="b">b</div>
                          <div key="c">c</div>
                        </GridLayout>
                      </Container>
                    </div>
                    <div id="two" className="tab-pane">
                        <span>
                              Content 2
                        </span>
                    </div>
                    <div id="three" className="tab-pane">
                        <span>
                              Content 3
                        </span>
                    </div>
                  </div>
                </div>
              </div>
            
          </MainBody>
        </>
      </ThemeProvider>
    );
  }
}