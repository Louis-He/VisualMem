import React from 'react';
import './css/App.css';
import { Container, Button } from 'react-bootstrap';
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

// ==== renderer <- main functions ====

// ==== renderer class ====
export default class MainWindow extends React.Component {
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
            </Container>
            
            <footer>aba</footer>
          </MainBody>
        </>
      </ThemeProvider>
    );
  }
}