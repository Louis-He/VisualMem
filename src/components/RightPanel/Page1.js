import React from "react";
import { Container, Button, Form } from 'react-bootstrap';
import Editor from "./Editor.js"
import { MainBody } from "./../../components/GlobalStyles";

const ipcRenderer = window.require("electron").ipcRenderer;



//const Aside = () => {

export default class Aside extends React.Component{

  constructor(){
    super()
    this.state = {
      pageID: 'M1'
    }
  }


  render(){
    const headerStyle = {
      padding: "24px",
      textTransform: "uppercase",
      fontWeight: "bold",
      letterSpacing: "1px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "noWrap"
    };

    return (
      <MainBody>
        <Container style={{height:"100%",width:"70vh", overflow:"scroll"}}>
          <div>
            <p></p>
            <Editor source_code ={this.props.fileData}/>
            <p></p>
            <div style={{height:"20vh",width:"100%"}}>
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
          </div>
        </Container>
      </MainBody>
    );
  }
}