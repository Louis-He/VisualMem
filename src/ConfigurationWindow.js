import React from 'react';
import './css/App.css';
import { Container, Button, Row, Col, Form } from 'react-bootstrap';
import { Folder2Open } from 'react-bootstrap-icons';
import { ThemeProvider } from "styled-components";
import { MainBody } from "./components/GlobalStyles";

// const electron = window.require("electron");
const ipcRenderer = window.require("electron").ipcRenderer;

function renderRequestSwitchMode(theme) {
  ipcRenderer.invoke('requestSwitchMode', theme)
}

export default class ConfigurationWindow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      darkThemeChecked: false,
    }
    this.onSwitchAction = this.onSwitchAction.bind(this)
  }

  handleChange(selectorFiles) {
    console.log(selectorFiles);
  }

  onSwitchAction(e) {
    renderRequestSwitchMode(!this.state.darkThemeChecked)
    this.props.themeSwitchHandler(!this.state.darkThemeChecked)
    this.setState({
      darkThemeChecked: !this.state.darkThemeChecked
    })
  }

  render() {
    return (
      <ThemeProvider theme={this.props.theme}>
        <>
          <MainBody>
            <Container >
              <div className="container_ext">
                <h1>DDD</h1>
                <Row>
                  <Col xs={9}>
                    PATH TO GDB
                  </Col>
                  <Col xs={3}>
                    <label htmlFor="files" className="btn btn-primary btn-sm" style={{ fontSize: "18px", lineHeight: "1" }}><Folder2Open style={{verticalAlign: 'baseline'}}/></label>
                    <input id="files" style={{visibility:"hidden", width:"0px"}} type="file" onChange={ (e) => this.handleChange(e.target.files) }></input>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Form.Check 
                      type="switch"
                      id="custom-switch"
                      label="Check this switch"
                      checked={this.state.darkThemeChecked}
                      onChange={this.onSwitchAction}
                    />
                  </Col>
                </Row>
              </div>
            </Container>
          </MainBody>
        </>
      </ThemeProvider>
    );
  }
}