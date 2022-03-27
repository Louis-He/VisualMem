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
          </div>
        </Container>
      </MainBody>
    );
  }
}