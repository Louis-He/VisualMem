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
//import FileTree from "./../../components/RightPanel/FileTree.js"
//import dirTree from 'directory-tree';
//import FileTree from 'react-filetree-electron';

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

  selectProjectFolder(e) {
    e.preventDefault();
    ipcRenderer.invoke('requestSelectProjectFolder',)
  }

  selectExecutable(e) {
    e.preventDefault();
    ipcRenderer.invoke('requestSelectExecutable', this.props.projectFolder)
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
            <MenuItem icon={<AiOutlineFile />} onClick={(e) => this.selectExecutable(e)}>Select Executable File</MenuItem>
          </Menu>
          <Menu iconShape="circle">
            <SubMenu
              suffix={<span className="badge yellow">3</span>}
              title="Data Structures"
            >
              <MenuItem onClick={() => this.changePage('S1')}> Data struc 1 </MenuItem>
              <MenuItem onClick={() => this.changePage('S2')}> Data struc 2 </MenuItem>
              <MenuItem onClick={() => this.changePage('S3')}> Data struc 3 </MenuItem>
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