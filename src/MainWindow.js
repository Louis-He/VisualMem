import React from 'react';
import './css/App.css';
import { Container, Button, Row, Col } from 'react-bootstrap';
import { ThemeProvider } from "styled-components";
import { MainBody } from "./components/GlobalStyles";

const ipcRenderer = window.require("electron").ipcRenderer;

function renderRequestOpenConfig() {
  ipcRenderer.invoke('requestOpenConfig',)
}

export default class MainWindow extends React.Component {
  constructor(props) {
    super(props);
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
              </div>
            </Container>
            
            <footer>aba</footer>
          </MainBody>
        </>
      </ThemeProvider>
    );
  }
}