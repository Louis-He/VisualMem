import React from 'react';
// import { Main } from 'electron';
const ipcRenderer = window.require("electron").ipcRenderer;


function checkGDBPath() {
  ipcRenderer.invoke('perform-action',)
}

export default class MainWindow extends React.Component {
  constructor(props) {
    super(props);
    
  }
  render() {
    return (
      <div className="mainwindow">
        {/* <header>
          <div className="App-header"></div>
        </header> */}
        <button onClick={checkGDBPath}>TEST button</button>
        <footer>ddd</footer>
      </div>
    );
  }
}