import React from 'react';
import './css/App.css';
import { Container, Button, Form } from 'react-bootstrap';
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
    if(e.keyCode == 13 && e.shiftKey == false) {
      e.preventDefault();
      this.sendGDBCommandButton();
    }
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
              <div className="container_ext">
                <Button onClick={renderRequestOpenConfig}>TEST button</Button>
                <Button onClick={renderRequestStartGDB}>Start GDB</Button>
                <Button onClick={renderRequestStopGDB}>Stop GDB</Button>
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
            </Container>
            
            <footer>aba</footer>
          </MainBody>
        </>
      </ThemeProvider>
    );
  }
}