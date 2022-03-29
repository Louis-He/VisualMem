const Application = require("spectron").Application;
const electronPath = require("electron");
const assert = require("assert");
const path = require("path");
var GDBManager = require('./../../electron/gdbEntry.js');
import MemGraphClass from './../../src/components/MemGraph/MemGraphClass.js';

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

  // it ("Start GDB", async() => {
  //   GDBManager.startGDB();

  //   assert(GDBManager.gdbLog.calledOnce)
  //   assert.equal(
  //     "startGDB",
  //     GDBManager.gdbLog.getCall(0).args[0]
  //   );
  // }); 

  it("Window title", async() => {
    const title = await app.client.getTitle();
    assert.equal(title, "VisualMem");
  });
});

describe("Memgraph Test", () => {
  beforeEach(function () {
    sandbox.spy(GDBManager, "gdbLog");
  });

  afterEach(function () {
    sandbox.restore();
  });

  it("Single Integer Test", async() => {
    let memgraph = new MemGraphClass();

    memgraph.init({'0x78017ff7f4': {'name': 'b', 'type': 'int', 'value': '2'}});
    memgraph.constructGraph()

    expect(memgraph.graphObjMap.length).toBe(1);
    expect(memgraph.graphObjMap[0].elementMap['0x78017ff7f4'].addr).toBe('0x78017ff7f4');
    expect(memgraph.graphObjMap[0].elementMap['0x78017ff7f4'].name).toBe('b');
    expect(memgraph.graphObjMap[0].elementMap['0x78017ff7f4'].type).toBe('int');
    expect(memgraph.graphObjMap[0].elementMap['0x78017ff7f4'].value).toBe('2');
  });
});