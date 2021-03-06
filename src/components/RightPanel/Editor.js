//import {useState} from 'react'
import React from "react";
import AceEditor from 'react-ace'

// import mode-<language> , this imports the style and colors for the selected language.
import 'ace-builds/src-noconflict/mode-javascript'
import 'ace-builds/src-noconflict/mode-c_cpp'
import 'ace-builds/src-noconflict/theme-monokai'
import 'ace-builds/src-noconflict/ext-language_tools'
import 'ace-builds/src-noconflict/ext-beautify'
import './Editor.css'

    /*const [code, setCode] = useState(`int main(){
    printf("hello world");
    return 0;
}`)*/
/*
function Editor(props) {



  const { source_code } = props
  var code_temp = source_code
  //code_temp = 'int main()'
  const [code, setCode] = useState(code_temp)

//return(<div>{code_temp}</div>)
  if(true){
    return (
      <div>
        <AceEditor
            style={{
                borderRadius: '15px',
                height: '96vh',
                width: '100%',
            }}
            placeholder='Start Coding'
            mode='c_cpp'
            theme='monokai'
            name='basic-code-editor'
            onChange={currentCode => setCode(currentCode)}
            fontSize={18}
            showPrintMargin={true}
            showGutter={true}
            highlightActiveLine={true}
            defaultValue = {code_temp}
            value={code}
            setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: true,
                showLineNumbers: true,
                tabSize: 4,
            }}
        />
      </div>
    )
  }
}

export default Editor
*/



export default class Editor extends React.Component {

  constructor(props, context) {
      super(props, context);
      
      this.onChange = this.onChange.bind(this);
  }

  onChange(newValue) {
      this.props.fileUpdatefunc(newValue);
  }

  render() {
      return (
          <div>
              <AceEditor
                  style={{
                    borderRadius: '15px',
                    height: '96vh',
                    width: '100%',
                  }}
                  mode="c_cpp"
                  theme="monokai"
                  onChange={this.onChange}
                  name="UNIQUE_ID_OF_DIV"
                  value={this.props.fileData}
                  fontSize={18}
                  editorProps={{
                      $blockScrolling: true
                  }}
                  markers={[{startRow: this.props.lineNumber, startCol: 0, endRow: this.props.lineNumber+1, endCol: 0, className: 'replacement_marker', type: 'text' }]}
                  setOptions={{
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                    showLineNumbers: true,
                    tabSize: 4,
                }}
              />
          </div>
      );
  }
}
