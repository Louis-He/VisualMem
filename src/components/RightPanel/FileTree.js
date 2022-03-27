import React, { Component } from 'react';
import dirTree from 'directory-tree'; // use this istead of 'readdirp`
import FolderTree, { testData } from 'react-folder-tree';
import 'react-folder-tree/dist/style.css';

function Page3() {
    const onTreeStateChange = (state, event) => console.log(state, event);
    const dirTree = require("directory-tree");
    //const testData = dirTree("/Users/wxc/Developer/snippets-electron-js-master/main.js");
    //alert(testData);

    return (
      <FolderTree
        data={ testData }
        onChange={ onTreeStateChange }
      />
    );
  }
  
  export default Page3;

/*
export default class TreeView extends Component {
    constructor() {
        super();

        this.state = {
            tree: null //initialize tree
        }

        this.renderTreeNodes = this.renderTreeNodes.bind(this);
    }

    componentWillMount() {
        const { root } = this.props;
        const tree = dirTree(root);

        this.setState({ tree });
    }

    renderTreeNodes(children) {
        if (children.length === 0) return null;

        return (
            children.map(child => {
                return (
                    <div key={child.path} id={child.path}>
                        { child.hasOwnProperty('children') && child.type === 'directory'?
                            this.renderTreeNodes(child.children) : null}
                    </div>
                )
            })
        )
    }

    render() {
        const { tree } = this.state;

        return (
            <div id="default">
                <div id={tree.path}>
                    { this.renderTreeNodes(tree.children) }
                </div>
            </div>
        );
    }

}
*/