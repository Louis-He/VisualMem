import React from 'react';
import MonacoEditor from 'react-monaco-editor';
//import style from "./index.css"
import "./Editor.css"


// This config defines how the language is displayed in the editor.
export const languageDef = {
  defaultToken: '',
	tokenPostfix: '.c',

	brackets: [
		{ open: '{', close: '}', token: 'delimiter.curly' },
		{ open: '[', close: ']', token: 'delimiter.square' },
		{ open: '(', close: ')', token: 'delimiter.parenthesis' },
		{ open: '<', close: '>', token: 'delimiter.angle' }
	],

	keywords: [
		'extern', 'using', 'bool', 'short',
		'ushort', 'int', 'uint', 'long', 'ulong', 'char', 'float', 'double',
		'void', 'default', 'const', 'if', 'else', 'switch', 'case',
		'while', 'do', 'for', 'break', 'continue', 'goto',
		'return', 'throw', 'try', 'catch', 'finally',
		'static', 'struct', 'volatile', 'true', 'false', 'null', 'sizeof'
	],

	namespaceFollows: [
		'namespace', 'using',
	],

	parenFollows: [
		'if', 'for', 'while', 'switch', 'foreach', 'using', 'catch', 'when'
	],

	operators: [
		'=', '??', '||', '&&', '|', '^', '&', '==', '!=', '<=', '>=', '<<',
		'+', '-', '*', '/', '%', '!', '~', '++', '--', '+=',
		'-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '>>', '->'
	],

	symbols: /[=><!~?:&|+\-*/^%]+/,

	// escape sequences
	escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

	// The main tokenizer for our languages
	tokenizer: {
		root: [
      { include: "@tags" },
			// identifiers and keywords
			[/@?[a-zA-Z_]\w*/, {
				cases: {
					'@namespaceFollows': { token: 'keyword.$0', next: '@namespace' },
					'@keywords': { token: 'keyword.$0', next: '@qualified' },
					'@default': { token: 'identifier', next: '@qualified' }
				}
			}],

			// whitespace
			{ include: '@whitespace' },

			// delimiters and operators
			[/}/, {
				cases: {
					'$S2==interpolatedstring': { token: 'string.quote', next: '@pop' },
					'$S2==litinterpstring': { token: 'string.quote', next: '@pop' },
					'@default': '@brackets'
				}
			}],
			[/[{}()[\]]/, '@brackets'],
			[/[<>](?!@symbols)/, '@brackets'],
			[/@symbols/, {
				cases: {
					'@operators': 'delimiter',
					'@default': ''
				}
			}],


			// numbers
			[/[0-9_]*\.[0-9_]+([eE][-+]?\d+)?[fFdD]?/, 'number.float'],
			[/0[xX][0-9a-fA-F_]+/, 'number.hex'],
			[/0[bB][01_]+/, 'number.hex'], // binary: use same theme style as hex
			[/[0-9_]+/, 'number'],

			// delimiter: after number because of .\d floats
			[/[;,.]/, 'delimiter'],

			// strings
			[/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
			[/"/, { token: 'string.quote', next: '@string' }],
			[/\$@"/, { token: 'string.quote', next: '@litinterpstring' }],
			[/@"/, { token: 'string.quote', next: '@litstring' }],
			[/\$"/, { token: 'string.quote', next: '@interpolatedstring' }],

			// characters
			[/'[^\\']'/, 'string'],
			[/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
			[/'/, 'string.invalid']
		],

		qualified: [
			[/[a-zA-Z_][\w]*/, {
				cases: {
					'@keywords': { token: 'keyword.$0' },
					'@default': 'identifier'
				}
			}],
			[/\./, 'delimiter'],
			['', '', '@pop'],
		],

		namespace: [
			{ include: '@whitespace' },
			[/[A-Z]\w*/, 'namespace'],
			[/[.=]/, 'delimiter'],
			['', '', '@pop'],
		],

		comment: [
			[/[^/*]+/, 'comment'],
			// [/\/\*/,    'comment', '@push' ],    // no nested comments :-(
			['\\*/', 'comment', '@pop'],
			[/[/*]/, 'comment']
		],

		string: [
			[/[^\\"]+/, 'string'],
			[/@escapes/, 'string.escape'],
			[/\\./, 'string.escape.invalid'],
			[/"/, { token: 'string.quote', next: '@pop' }]
		],

		litstring: [
			[/[^"]+/, 'string'],
			[/""/, 'string.escape'],
			[/"/, { token: 'string.quote', next: '@pop' }]
		],

		litinterpstring: [
			[/[^"{]+/, 'string'],
			[/""/, 'string.escape'],
			[/{{/, 'string.escape'],
			[/}}/, 'string.escape'],
			[/{/, { token: 'string.quote', next: 'root.litinterpstring' }],
			[/"/, { token: 'string.quote', next: '@pop' }]
		],

		interpolatedstring: [
			[/[^\\"{]+/, 'string'],
			[/@escapes/, 'string.escape'],
			[/\\./, 'string.escape.invalid'],
			[/{{/, 'string.escape'],
			[/}}/, 'string.escape'],
			[/{/, { token: 'string.quote', next: 'root.interpolatedstring' }],
			[/"/, { token: 'string.quote', next: '@pop' }]
		],

		whitespace: [
			[/^[ \t\v\f]*#((r)|(load))(?=\s)/, 'directive.csx'],
			[/^[ \t\v\f]*#\w.*$/, 'namespace.cpp'],
			[/[ \t\v\f\r\n]+/, ''],
			[/\/\*/, 'comment', '@comment'],
			[/\/\/.*$/, 'comment'],
		],

    tags: [
      [/#[a-zA-Z]\w*/, "tag"],
    ],
	},
}

// This config defines the editor's behavior.
// export const configuration = {
//   comments: {
//     lineComment: "#",
//   },
//   brackets: [
//     ["{", "}"], ["[", "]"], ["(", ")"],
//   ],
// }


export default class Editor2 extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      code: "start coding",
    }
    this.editor = null;
    this.monaco = null;
    this.decorations = [];
    this.onChange = this.onChange.bind(this);
    this.editorDidMount = this.editorDidMount.bind(this);
  }

  editorDidMount(editor, monaco) {
    if (!this.editor) {
      this.editor = editor;
      this.monaco = monaco;
      this.editorMousDown();
      this.onMouseMove();
    }
    editor.focus();
  }

  editorWillMount = monaco => {
    if (!monaco.languages.getLanguages().some(({ id }) => id === 'c')) {
      // Register a new language
      monaco.languages.register({ id: 'c' })
      // Register a tokens provider for the language
      monaco.languages.setMonarchTokensProvider('c', languageDef)
      // Set the editing configuration for the language
      // monaco.languages.setLanguageConfiguration('estimatemd', configuration)
    }
  }

  onChange(newValue, e) {
    //this.props.parent(this.props.data._id, newValue);
    this.props.fileUpdatefunc(newValue);
  }

  onMouseMove() {
    this.editor.onMouseMove(e => {
      if (!this.isJsEditor()) return
      this.removeFakeBreakPoint()
      if (e.target.detail && e.target.detail.offsetX && e.target.detail.offsetX >= 0 && e.target.detail.offsetX <= 10) {
        let line = e.target.position.lineNumber
        this.addFakeBreakPoint(line)
      }
    })
    this.editor.onMouseLeave(() => {
      this.removeFakeBreakPoint()
    })
    this.editor.onKeyDown(e => {
      if (e.code === 'Enter') {
        this.removeFakeBreakPoint()
      }
    })
  }

  trigger(id) {
    if (!this.editor) return
    this.editor.trigger('anyString', id)
  }

  insertContent(text) {
    if (this.editor) {
      let selection = this.editor.getSelection()
      let range = new this.monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn)
      let id = {
        major: 1,
        minor: 1
      }
      let op = {
        identifier: id,
        range: range,
        text: text,
        forceMoveMarkers: true
      }
      this.editor.executeEdits(this.root, [op])
      this.editor.focus()
    }
  }

  editorMousDown() {
    this.editor.onMouseDown(e => {
      if (!this.isJsEditor()) {
          return
      }
      if (e.target.detail && e.target.detail.offsetX && e.target.detail.offsetX >= 0 && e.target.detail.offsetX <= 10) {
        let line = e.target.position.lineNumber
        if (this.editor.getModel().getLineContent(line).trim() === '') {
          return
        }
        if (!this.hasBreakPoint(line)) {
          this.addBreakPoint(line)
        } else {
          this.removeBreakPoint(line)
        }
        if (this.lastPosition) {
          this.editor.setPosition(this.lastPosition)
        } else {
          document.activeElement.blur()
        }
      }
      if (e.target.type === 6 || e.target.type === 7) {
        this.lastPosition = this.editor.getPosition()
      }
    })
  }

  isJsEditor() {
    //return this.editor.getModel().getLanguageIdentifier().language === 'javascript'
    return true
  }

  addFakeBreakPoint(line) {
    if (this.hasBreakPoint(line)) return;
    let value = {
      range: new this.monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        linesDecorationsClassName: 'breakpoints-fake'
      }
    }
    this.decorations = this.editor.deltaDecorations(this.decorations, [value])
  }

  removeFakeBreakPoint() {
    this.decorations = this.editor.deltaDecorations(this.decorations, [])
  }

  async addBreakPoint(line) {
    let model = this.editor.getModel()
    if (!model) return
    let value = {
      range: new this.monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        linesDecorationsClassName: 'breakpoints'
      }
    }
    model.deltaDecorations([], [value])
  }

  async removeBreakPoint(line) {
    let model = this.editor.getModel()
    if (!model) return
    let decorations
    let ids = []
    if (line !== undefined) {
      decorations = this.editor.getLineDecorations(line)
    } else {
      decorations = this.editor.getAllDecorations()
    }
    for (let decoration of decorations) {
      if (decoration.options.linesDecorationsClassName === 'breakpoints') {
        ids.push(decoration.id)
      }
    }
    if (ids && ids.length) {
      model.deltaDecorations(ids, [])
    }
  }

  hasBreakPoint(line) {
    let decorations = this.editor.getLineDecorations(line)
    for (let decoration of decorations) {
      if (decoration.options.linesDecorationsClassName === 'breakpoints') {
        return true
      }
    }
    return false
  }

  render() {
    //const code = this.state.code;
    const options = {
      selectOnLineNumbers: true
    };
    return (
      <MonacoEditor
        className="monacoEditorWrapper"
        height="95vh"
        width= "100%"
        language="c"
        theme="vs-dark"
        value={this.props.fileData}
        options={options}
        onChange={this.onChange}
        editorDidMount={this.editorDidMount}
        editorWillMount={this.editorWillMount}
        borderRadius = "15px"
        fontSize = "20px"
      />
    );
  }
}
