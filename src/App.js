import React from 'react';
import MainWindow from './MainWindow.js'
import ConfigurationWindow from './ConfigurationWindow.js'
import 'bootstrap/dist/css/bootstrap.min.css';
import { lightTheme, darkTheme } from "./components/Themes"
import "./components/Aside/AsideStyle.css"
import "react-pro-sidebar/dist/css/styles.css";


import {
  BrowserRouter,
  HashRouter,
  Switch,
  Route
} from "react-router-dom";


const ipcRenderer = window.require("electron").ipcRenderer;

export default class App extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      theme: 'light',
      projectFolder: '',
      executablePath: '',
      fileData: "",
      sourceFile: "",
      lineNumber: "", 
    }
    this.themeSwitchHandler = this.themeSwitchHandler.bind(this)
  }

  themeSwitchHandler(_theme) {
    if (_theme) {
      this.setState({
        theme: 'dark'
      })
    } else {
      this.setState({
        theme: 'light'
      })
    }
  }

  async componentDidMount() {
    console.log("Mount")
    var that = this;
    ipcRenderer.on('distributeSwitchMode', function (evt, message) {
      that.setState({
        theme: message.theme ? "dark" : "light"
      })
    });

    ipcRenderer.on('distributeSelectedFolderRes', function (evt, response) {
      that.setState({
        projectFolder: response.projectFolder,
      })
    });

    ipcRenderer.on('distributeSelectedExecutable', function (evt, response) {
      that.setState({
        executablePath: response.executablePath,
      })
    });

    let setting = await ipcRenderer.invoke('requestInitialSetting')
    this.setState({
      projectFolder: setting.project_path,
      executablePath: setting.execFile
    })
  }

  showFile(e) {
    e.preventDefault();
    ipcRenderer.invoke('showFile', this.props.executablePath)
    var that = this;
    ipcRenderer.on('distributeFileData', function (evt, response) {
      that.setState({
        fileData: response.fileData
      })
    });
  }


  render() {
    console.log(this.state.theme);
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      console.log("DEV")
      return (
        <BrowserRouter>

        
        <div style={{height:"100%",width:"100%"}}>
          <Switch>
            <Route exact path="/" render={() =>
              <MainWindow
                theme={this.state.theme === 'light' ? lightTheme : darkTheme}
                projectFolder={this.state.projectFolder}
                executablePath={this.state.executablePath}
              />}
            />
            <Route exact path="/Configuration" render={() =>
              <ConfigurationWindow
                theme={this.state.theme === 'light' ? lightTheme : darkTheme}
                themeSwitchHandler={this.themeSwitchHandler} />}
            />
          </Switch>
          </div>
        </BrowserRouter>)
    } else {
      console.log("PRODUCTION")
      return (
        <HashRouter>
          <Switch>
            <Route exact path="/" render={() =>
              <MainWindow
                theme={this.state.theme === 'light' ? lightTheme : darkTheme}
              />}
            />
            <Route exact path="/Configuration" render={() =>
              <ConfigurationWindow
                theme={this.state.theme === 'light' ? lightTheme : darkTheme}
                themeSwitchHandler={this.themeSwitchHandler} />}
            />
          </Switch>
        </HashRouter>)
    }
  }
}
