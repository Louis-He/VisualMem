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

  // it("Opens a window", async() => {
  //   let windowCount = await app.client.getWindowCount();
  //   expect(windowCount).toBe(1);
  // });

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

  it("Single Pointer Test", async() => {
    let memgraph = new MemGraphClass();

    memgraph.init({'0x8c00dffc88': {'name': 'prev_ptr',
                  'ptrTarget': false,
                  'type': 'Node *',
                  'value': '0x0'}});
    memgraph.constructGraph()

    expect(memgraph.graphObjMap.length).toBe(1);
    expect(memgraph.graphObjMap[0].elementMap['0x8c00dffc88'].addr).toBe('0x8c00dffc88');
    expect(memgraph.graphObjMap[0].elementMap['0x8c00dffc88'].name).toBe('prev_ptr');
    expect(memgraph.graphObjMap[0].elementMap['0x8c00dffc88'].type).toBe('Node *');
    expect(memgraph.graphObjMap[0].elementMap['0x8c00dffc88'].value).toBe('0x0');
    expect(memgraph.graphObjMap[0].elementMap['0x8c00dffc88'].getAfterAddr().size).toBe(0);
  });

  it("Single Pointer and an integer Test", async() => {
    let memgraph = new MemGraphClass();

    memgraph.init({'0x8c00dffc88': {'name': 'prev_ptr',
                  'ptrTarget': true,
                  'type': 'int *',
                  'value': '0x78017ff7f4'},
                  '0x78017ff7f4': {'name': 'b', 'type': 'int', 'value': '2'}});
    memgraph.constructGraph()

    expect(memgraph.graphObjMap.length).toBe(1);
    expect(Object.keys(memgraph.graphObjMap[0].elementMap).length).toBe(2);
    expect(memgraph.graphObjMap[0].elementMap['0x8c00dffc88'].addr).toBe('0x8c00dffc88');
    expect(memgraph.graphObjMap[0].elementMap['0x8c00dffc88'].name).toBe('prev_ptr');
    expect(memgraph.graphObjMap[0].elementMap['0x8c00dffc88'].type).toBe('int *');
    expect(memgraph.graphObjMap[0].elementMap['0x8c00dffc88'].value).toBe('0x78017ff7f4');
    expect(memgraph.graphObjMap[0].elementMap['0x8c00dffc88'].getAfterAddr().size).toBe(1);

    expect(memgraph.graphObjMap[0].elementMap['0x78017ff7f4'].getPrevAddr().size).toBe(1);
  });

  it("Single Linked List Node and its head pointer", async() => {
    let memgraph = new MemGraphClass();

    memgraph.init({
      '0x7c25fffce0': {'name': 'head',
                  'ptrTarget': true,
                  'type': 'Node *',
                  'value': '0x7ff7fdad0000'},
      '0x7ff7fdad0000': {'isLL': true,
                  'isRefered': false,
                  'linkedMember': 'next',
                  'members': ['val'],
                  'name': '(*((Node*)(0x7ff7fdad0000)))',
                  'type': 'Node',
                  'value': {'next': {'type': 'struct node *',
                                     'value': '0xffff00000004'},
                            'val': {'type': 'int', 'value': '9460301'}}}
    })
    memgraph.constructGraph()

    expect(memgraph.graphObjMap.length).toBe(1);
    expect(Object.keys(memgraph.graphObjMap[0].elementMap).length).toBe(2);
    expect(memgraph.graphObjMap[0].elementMap['0x7c25fffce0'].addr).toBe('0x7c25fffce0');
    expect(memgraph.graphObjMap[0].elementMap['0x7c25fffce0'].getAfterAddr().size).toBe(1);
    expect(memgraph.graphObjMap[0].elementMap['0x7ff7fdad0000'].getPrevAddr().size).toBe(1);
    expect(memgraph.graphObjMap[0].elementMap['0x7ff7fdad0000'].isLL).toBe(true);
    expect(memgraph.graphObjMap[0].elementMap['0x7ff7fdad0000'].value.next.value).toBe('0xffff00000004');
  });
  
});