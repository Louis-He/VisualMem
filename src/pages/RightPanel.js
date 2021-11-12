import React from 'react';
import './css/App.css';

import SourceFilePanel from './RightPanel/SourceFilePanel.js'
import GraphPanel from './RightPanel/GraphPanel.js'
import DebugPanel from './RightPanel/DebugPanel.js'
import {PANEL_ENUM} from './RightPanel/PanelUtil.js'

export default class RightPanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            selectedPanel=this.props.selectedPanel
        }
    }

    render() {
        let renderedPanel;

        switch (this.state.selectedPanel) {
            case PANEL_ENUM.DEBUG:
                renderedPanel = <DebugPanel/>
                break;
            case PANEL_ENUM.GRAPH:
                renderedPanel = <GraphPanel/>
                break;
            case PANEL_ENUM.SOURCEFILE:
                renderedPanel = <SourceFilePanel/>
                break;
        }

        return (
            <div>
                <div>Right Panel</div>
                {renderedPanel}
            </div>
        )
    }
}