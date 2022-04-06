import React from "react";
import { Container } from 'react-bootstrap';
// import Editor from "./Editor.js"
import Editor2 from "./Editor_2"
import { MainBody } from "./../../components/GlobalStyles";

//const ipcRenderer = window.require("electron").ipcRenderer;



//const Aside = () => {

export default class Aside extends React.Component{

  constructor(){
    super()
    this.state = {
      pageID: 'M1'
    }
  }

  render(){
    return (
      <MainBody>
        <Container style={{width:"70vh"}}>
          <div>
            <p></p>
            <Editor2 fileData ={this.props.fileData} fileUpdatefunc={this.props.fileUpdatefunc} lineNumber={this.props.lineNumber}/>
          </div>
        </Container>
      </MainBody>
    );
  }
}