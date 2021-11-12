import React from 'react';
import './css/App.css';
import './../node_modules/react-reflex/styles.css';
import './../node_modules/react-grid-layout/css/styles.css';
import './../node_modules/react-resizable/css/styles.css';
import { Container, Button, Form } from 'react-bootstrap';
import { Folder2Open } from 'react-bootstrap-icons';
import { ThemeProvider } from "styled-components";
import { MainBody } from "./components/GlobalStyles";
import GridLayout from 'react-grid-layout';
import {
  ReflexContainer,
  ReflexSplitter,
  ReflexElement
} from 'react-reflex'


const ipcRenderer = window.require("electron").ipcRenderer;

// ==== renderer -> main functions ====
function renderRequestOpenConfig() {
  ipcRenderer.invoke('requestOpenConfig',)
}

function renderRequestStartGDB() {
  ipcRenderer.invoke('requestStartGDB',)
}

function renderRequestStopGDB() {
  ipcRenderer.invoke('requestStopGDB',)
}

function renderRequestsendMsgToGDB(msg) {
  ipcRenderer.invoke('sendMsgToGDB', msg)
}

// ==== renderer <- main functions ====
ipcRenderer.on('distributeDetailedLocals', function (evt, locals) {
  console.log(locals)
});

// ==== renderer class ====
export default class MainWindow extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      GDBCommand: "> ",
      fileData: ""
    }
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
            <Container>
            
              <div style={{ height: "200px" }}>
              <ReflexContainer orientation="vertical">

                <ReflexElement>
                  <div className="pane-content">
                    <label>
                      Left Pane (resizable)
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
              </div>
            
            
              
              <div className="container_ext">
                <Button onClick={renderRequestOpenConfig}>TEST button</Button>
                <Button onClick={renderRequestStartGDB}>Start GDB</Button>
                <Button onClick={renderRequestStopGDB}>Stop GDB</Button>
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
            
            <footer>aba</footer>
          </MainBody>
        </>
      </ThemeProvider>
    );
  }
}