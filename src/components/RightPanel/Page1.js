import React from "react";
import { Container } from 'react-bootstrap';
// import Editor from "./Editor.js"
import Editor2 from "./Editor_2"
import { MainBody } from "./../../components/GlobalStyles";

//const ipcRenderer = window.require("electron").ipcRenderer;



//const Aside = () => {

export default class Page1 extends React.Component{

  constructor(){
    super()
    this.state = {
      pageID: 'M1'
    }
  }

  render(){
    return (
      <MainBody>
        <Container style={{width: (this.props.winWidth - 270) * 0.5}}>
          <div>
            <p></p>
            <Editor2 
              fileData ={this.props.fileData} 
              fileUpdatefunc={this.props.fileUpdatefunc} 
              lineNumber={this.props.lineNumber}
              fileChanged={this.props.fileChanged}/>
          </div>
        </Container>
      </MainBody>
    );
  }
}