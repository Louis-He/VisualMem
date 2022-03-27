import React from "react";
import AceEditor from "react-ace";
// import brace from "brace";

//import "brace/mode/typescript";
//import "brace/theme/tomorrow_night";
import 'ace-builds/src-noconflict/mode-c_cpp'
import 'ace-builds/src-noconflict/theme-monokai'
/*
function onChange(newValue) {
  console.log("change", newValue);
}
*/

var IntegrationTests = `import unmock, { Service } from 'unmock';

describe("Integration tests with Unmock", () => {
  // Intercept all HTTP traffic
  beforeAll(() => unmock.on());

  test("should be awesome for mocking a service ", async () => {
    const userEmail = await fetchGitHubUserEmail("meeshkan");
    expect(typeof userEmail).toBe("string");
  });

  test("should be awesome for modifying fake data", async () => {
    const github: Service = unmock.services.github;
    const testUser = "meeshkan";
    github.state(\`/users/\${testUser}\`, { email: "dev@meeshkan.com" });
    const userEmail = await fetchGitHubUserEmail(testUser);
    expect(userEmail).toEqual("dev@meeshkan.com");
  });

  test("should be awesome for expressive asserts", async () => {
    const github: Service = unmock.services.github;
    await codeThatShouldCallGitHubAPI();
    expect(github).beCalledOnce(); // PROFIT!
  });
});
`;

IntegrationTests = `int main(){
    printf("hello world");
    return 0;
}`

const markers = [
  {
    startRow: 3,
    endRow: 4,
    startCol: 2,
    type: "text",
    className: "test-marker"
  }
];

const annotations = [
  {
    row: 3, // must be 0 based
    column: 4, // must be 0 based
    text: "error.message", // text to show in tooltip
    type: "warning"
  }
];

function getDelay() {
  return Math.round(Math.random() * 0) + 1;
}

const Editor = (props, { useDelay } = { useDelay: false }) => {
  const [textValue, setTextValue] = React.useState("");
  const { source_code } = props
  IntegrationTests = source_code;

  React.useEffect(() => {
    if (useDelay) {
      let counter = 0;
      let timeout;

      function updateTextAndCounter() {
        setTextValue(IntegrationTests.slice(0, counter));
        counter++;
        if (counter < IntegrationTests.length) {
          timeout = setTimeout(updateTextAndCounter, getDelay());
        }
      }

      timeout = setTimeout(updateTextAndCounter, getDelay());
      return () => {
        if (typeof timeout !== "undefined") {
          clearTimeout(timeout);
        }
      };
    } else {
      setTextValue(IntegrationTests.slice(0, IntegrationTests.length));
    }
  }, [useDelay]);

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
        width="100%"
        name="ace-editor"
        editorProps={{ $blockScrolling: false }}
        fontSize={18}
        value={textValue}
        showGutter={true}
        setOptions={{
          enableBasicAutocompletion: false,
          enableLiveAutocompletion: false,
          enableSnippets: false,
          showLineNumbers: true,
          tabSize: 2
        }}
        markers={markers}
        annotations={annotations}
      />
    </div>
  );
};

export default Editor;
