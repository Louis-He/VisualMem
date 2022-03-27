import React from 'react';
import './css/App.css';
import './css/nodeStyle.css';
import './../node_modules/react-reflex/styles.css';
import './../node_modules/react-grid-layout/css/styles.css';
import './../node_modules/react-resizable/css/styles.css';
import { Container, Button, Form } from 'react-bootstrap';
import ReactTooltip from "react-tooltip";
import { CaretRightSquare, XSquare, SkipEndCircle, ArrowRightCircle, Eye, EyeSlash } from 'react-bootstrap-icons';
import { ThemeProvider } from "styled-components";
import { MainBody } from "./components/GlobalStyles";
import GridLayout from 'react-grid-layout';
//import Editor from './components/RightPanel/Editor.js'
import Aside from "./components/Aside/Aside"
import Page1 from "./components/RightPanel/Page1.js"
import "./components/Aside/AsideStyle.css"
import "react-pro-sidebar/dist/css/styles.css";
//import { Resizable } from "re-resizable";

// import ReactFlow, { Handle } from 'react-flow-renderer';

import MemGraph from './components/MemGraph/MemGraph';

const ipcRenderer = window.require("electron").ipcRenderer;


function renderRequestsendMsgToGDB(msg) {
  ipcRenderer.invoke('sendMsgToGDB', msg)
}

// // TODO: need to update
// const elementsCreator = function ({locals}) {

//   const elementList = [];

//   let ID = 1;
//   let X = 100;
//   let Y = 50;

//   // /console.log(locals.length)
//   if (locals.length < 2) {
//     return []
//   }
//   for (let i = 0; i < 2; i++) {
//     const element = { id: ID,  type: 'special', position: {x:X, y:Y}, data: { text: "name: " + locals[i][0].name + ", value: " + locals[i][0].value}, style: {opacity: 1}};
//     ID = ID + 1;
//     Y = Y + 50;
//     elementList.push(element);
//   }

//   return elementList
// }

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
      variableDict: {},
      sourceFile: "",
      lineNumber: "", 
    }

    this.updateLineNumber = this.updateLineNumber.bind(this);
    this.updateSourceFile = this.updateSourceFile.bind(this);
  }

  componentDidMount() {
    var that = this;
    // ipcRenderer.on('distributeDetailedLocals', function (evt, locals) {
    //   const elementTemp = elementsCreator(locals)
    //   that.setState( {
    //     elements: elementTemp
    //   })
    // });

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

  updateLineNumber(lineNum) {
    this.setState({
      lineNumber: lineNum
    })
  }

  updateSourceFile(sourceF) {
    this.setState({
      sourceFile: sourceF
    })
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
        <div className = "MainWindow">
          <Aside />
          <Page1 fileData={this.state.fileData} />
          <div style={{height:"100%",width:"100%", overflow:"scroll"}}>
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
                          <p>Current Executable Path: {this.props.executablePath}</p>
                        </div>


                        <Button variant="primary" onClick={(e) => this.showFile(e)}>
                          Show Source File
                        </Button>

                        <p></p>


                        <MemGraph updateLineNumber = {this.updateLineNumber} updateSourceFile = {this.updateSourceFile}/>

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
            </div>
          </div>
        </>
      </ThemeProvider>
    );
  }
}