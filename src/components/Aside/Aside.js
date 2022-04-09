import React from "react";
import {
  ProSidebar,
  Menu,
  MenuItem,
  SubMenu,
  SidebarHeader,
  SidebarContent,
  SidebarFooter
} from "react-pro-sidebar";
import { FaGithub } from "react-icons/fa";
import { AiOutlineFile, AiFillFolderOpen } from "react-icons/ai";
import { HiSaveAs } from "react-icons/hi";
//import FileTree from "./../../components/RightPanel/FileTree.js"
//import dirTree from 'directory-tree';
//import FileTree from 'react-filetree-electron';
import {toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ipcRenderer = window.require("electron").ipcRenderer;



//const Aside = () => {

export default class Aside extends React.Component{

  constructor(){
    super()
    this.state = {
      pageID: 'M1'
    }
  }

  changePage(inputID){
    this.setState({
      //count: this.state.pageID = inputID
      pageID: inputID
    })
    console.log(this.state.pageID)
  }

  componentDidMount(){

    //send message after successfully saved file
    ipcRenderer.on('savedMessage', function (evt, message) {
      console.log(message); // Returns: {'SAVED': 'File Saved'}
      toast.configure();
      toast.success('File Saved', {
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000
      })
    });


    ipcRenderer.on('errSaveMassage', function (evt, message) {
      //send message after successfully saved file
      console.log(message); // Returns: {'SAVED': 'File Saved'}
      toast.configure();
      toast.error('No file selected. Save not success.', {
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000
      })
    });
  }

  selectProjectFolder(e) {
    e.preventDefault();
    ipcRenderer.invoke('requestSelectProjectFolder',)
  }

  selectSource(e) {
    e.preventDefault();
    ipcRenderer.invoke('requestSelectSourceFile', this.props.projectFolder)
  }

  // saveFile2(e) {
  //   e.preventDefault();
  //   ipcRenderer.send("saveDialog", {
  //     //baseCode: this.props.fileData,
  //     data: this.props.fileData,
  //     fileType: 'c',
  //     fileName: 'sourse'
  //   })
  //   ipcRenderer.once('succeedDialog', event => {
  //   })
  //   ipcRenderer.once('defeatedDialog', event => {
  //   })
  // }

  saveFile(e){
    //ipcRenderer.Renderer.send("save-dialog", {"data"});
    ipcRenderer.send("saveDialog2", {
      data: this.props.fileData
    })

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
      <ProSidebar>
        <SidebarHeader style={headerStyle}>Debugger Visualizer</SidebarHeader>
        <SidebarContent>
          <Menu iconShape="circle">
            <MenuItem icon={<AiFillFolderOpen />} onClick={(e) => this.selectProjectFolder(e)}>Select Project Folder</MenuItem>
            <MenuItem icon={<AiOutlineFile />} onClick={(e) => this.selectSource(e)}>Select Source File</MenuItem>
            <MenuItem icon={<HiSaveAs />} onClick={(e) => this.saveFile(e)}>Save Source File</MenuItem>
          </Menu>
          <Menu iconShape="circle">
            <SubMenu
              suffix={<span className="badge yellow">3</span>}
              title="Data Structures"
            >
              {/* <MenuItem onClick={() => this.changePage('S1')}> Data struc 1 </MenuItem>
              <MenuItem onClick={() => this.changePage('S2')}> Data struc 2 </MenuItem>
              <MenuItem onClick={() => this.changePage('S3')}> Data struc 3 </MenuItem> */}
            </SubMenu>
          </Menu>
        </SidebarContent>
        {/* <SidebarContent>
          <FileTree executablePath={this.state.executablePath}/>
        </SidebarContent> */}
        <SidebarFooter style={{ textAlign: "center" }}>
          <div className="sidebar-btn-wrapper">
            <a
              href="https://github.com/Louis-He/VisualMem"
              target="_blank"
              className="sidebar-btn"
              rel="noopener noreferrer"
            >
              <FaGithub />
              <span>Github</span>
            </a>
          </div>
        </SidebarFooter>
      </ProSidebar>
    );
  }
}

//export default Aside;


/*
export default function Aside() {
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
    <ProSidebar>
      <SidebarHeader style={headerStyle}>Sidebar Example</SidebarHeader>
      <SidebarContent>
        <Menu iconShape="circle">
          <MenuItem icon={<FaList />}>New</MenuItem>
          <MenuItem icon={<FaGem />}>Components</MenuItem>
        </Menu>
        <Menu iconShape="circle">
          <SubMenu
            suffix={<span className="badge yellow">3</span>}
            title="With Suffix"
          >
            <MenuItem> 1 </MenuItem>
            <MenuItem> 2 </MenuItem>
            <MenuItem> 3 </MenuItem>
          </SubMenu>
        </Menu>
      </SidebarContent>
      <SidebarFooter style={{ textAlign: "center" }}>
        <div className="sidebar-btn-wrapper">
          <a
            href="https://www.github.com"
            target="_blank"
            className="sidebar-btn"
            rel="noopener noreferrer"
          >
            <FaGithub />
            <span>Github</span>
          </a>
        </div>
      </SidebarFooter>
    </ProSidebar>
  );
}
*/