const Application = require("spectron").Application;
const electronPath = require("electron");
const assert = require("assert");
const path = require("path");
var GDBManager = require('./../../electron/gdbEntry.js');

const chai = require("chai");
const sinon = require("sinon");
const chaiExpect = chai.expect;
// require('mocha-sinon');

let app;

const sandbox = sinon.createSandbox();
beforeAll(() => {
  app = new Application({
    path: electronPath,

    args: [path.join(__dirname, "../../")],
  });

  return app.start();
}, 15000);

afterAll(function () {
  if (app && app.isRunning()) {
    return app.stop();
  }
});


describe("Basic Test", () => {
  

  beforeEach(function () {
    sandbox.spy(GDBManager, "gdbLog");
  });

  afterEach(function () {
    sandbox.restore();
  });

  it("Opens a window", async() => {
    let windowCount = await app.client.getWindowCount();
    expect(windowCount).toBe(1);
  });

  it ("Start GDB", async() => {
    GDBManager.startGDB();

    assert(GDBManager.gdbLog.calledOnce)
    assert.equal(
      "startGDB",
      GDBManager.gdbLog.getCall(0).args[0]
    );
  }); 

  it("Window title", async() => {
    const title = await app.client.getTitle();
    assert.equal(title, "VisualMem");
  });


});