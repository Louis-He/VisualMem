import logo from './logo.svg';
import './App.css';
import React from 'react';
// import { Main } from 'electron';
import MainWindow from './MainWindow.js'
import ConfigurationWindow from './ConfigurationWindow.js'
import { Col, Row } from "react-bootstrap";
import {
  BrowserRouter,
  HashRouter,
  Switch,
  Route,
  Link
} from "react-router-dom";


const ipcRenderer = window.require("electron").ipcRenderer;


ipcRenderer.on('asynchronous-message', function (evt, message) {
    console.log(message); // Returns: {'SAVED': 'File Saved'}
});

export default class App extends React.Component {
  constructor(props) {
    super(props);
    
  }
  render() {
    const debug = true;

    // return (
    //   <div className="mainwindow">
    //     {/* <header>
    //       <div className="App-header"></div>
    //     </header> */}
    //     <button onClick={checkGDBPath}>TEST button</button>
    //     <footer>ddd</footer>
    //   </div>
    // );

    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      console.log("DEV")
        return (
            <BrowserRouter>
                <Switch>
                    <Route exact path = "/" component = {MainWindow} />
                    <Route exact path = "/Configuration" component = {ConfigurationWindow} />
                </Switch>
            </BrowserRouter>)
    } else {
      console.log("PRODUCTION")
        return (
            <HashRouter>
                <Switch>
                    <Route exact path = "/" component = {MainWindow} />
                    <Route exact path = "/Configuration" component = {ConfigurationWindow} />
                </Switch>
            </HashRouter>)
    }
  }
}
