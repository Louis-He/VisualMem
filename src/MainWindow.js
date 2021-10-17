import React from 'react';
import './css/App.css';
import { Container, Button, Form } from 'react-bootstrap';
import { Folder2Open } from 'react-bootstrap-icons';
import { ThemeProvider } from "styled-components";
import { MainBody } from "./components/GlobalStyles";

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


// ==== renderer class ====
export default class MainWindow extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      GDBCommand: "> "
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
  
  render() {
    return (
      <ThemeProvider theme={this.props.theme}>
        <>
          <MainBody>
            {/* <header>
              <div className="App-header"></div>
            </header> */}
            <Container>
              <div class="wrap">
                  <div id="left" class="left">
                        <div id="logoDiv" class="logoDiv">
                            <p id="logoTitle" class="logoTitle">
                                <span>Debugger Visualize</span>
                            </p>
                        </div>
                        <div class="menu-title">Menu 1</div>
                        <div class="menu-item" href="#one" data-toggle="tab">
                            －functionality 1
                        </div>
                        <div class="menu-item" href="#two" data-toggle="tab">
                            －functionality 2
                        </div>
                        <div class="menu-title">Menu 2</div>
                        <div class="menu-item" href="#three" data-toggle="tab">
                            －functionality 1
                        </div>
                        <div class="menu-item" href="#four" data-toggle="tab">
                            －functionality 2
                        </div>
                  </div>
                  <div id="right" class="tab-content right">
                          <div id="one" class="tab-pane active">
                              <span>
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
                              </span>
                          </div>
                          <div id="two" class="tab-pane">
                              <span>
                                    内容二
                              </span>
                          </div>
                          <div id="three" class="tab-pane">
                              <span>
                                    内容三
                              </span>
                          </div>
                  </div>
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
            </Container>
            
            <footer>aba</footer>
          </MainBody>
        </>
      </ThemeProvider>
    );
  }
}