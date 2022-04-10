const Application = require("spectron").Application;
const electronPath = require("electron");
const assert = require("assert");
const path = require("path");
import MemGraphClass from './../../src/components/MemGraph/MemGraphClass.js';

const chai = require("chai");
const sinon = require("sinon");
const chaiExpect = chai.expect;

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
  afterEach(function () {
    sandbox.restore();
  });

  it("Window title", async() => {
    const title = await app.client.getTitle();
    assert.equal(title, "VisualMem");
  });
});

describe("Memgraph Test", () => {
  // beforeEach(function () {
  //   sandbox.spy(GDBManager, "gdbLog");
  // });

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

  it("Primitive types Test", async() => {
    let memgraph = new MemGraphClass();

    memgraph.init({
      '0x78017ff7f4': {'name': 'a', 'type': 'int', 'value': '2'},
      '0x78017ff7f8': {'name': 'b', 'type': 'double', 'value': '2.1'},
      '0x78017ff7fc': {'name': 'c', 'type': 'char', 'value': 'c'}
    });
    memgraph.constructGraph()

    expect(memgraph.graphObjMap.length).toBe(3);
    expect(memgraph.graphObjMap[0].elementMap['0x78017ff7f4'].addr).toBe('0x78017ff7f4');
    expect(memgraph.graphObjMap[0].elementMap['0x78017ff7f4'].name).toBe('a');
    expect(memgraph.graphObjMap[0].elementMap['0x78017ff7f4'].type).toBe('int');
    expect(memgraph.graphObjMap[0].elementMap['0x78017ff7f4'].value).toBe('2');

    expect(memgraph.graphObjMap[1].elementMap['0x78017ff7f8'].addr).toBe('0x78017ff7f8');
    expect(memgraph.graphObjMap[1].elementMap['0x78017ff7f8'].name).toBe('b');
    expect(memgraph.graphObjMap[1].elementMap['0x78017ff7f8'].type).toBe('double');
    expect(memgraph.graphObjMap[1].elementMap['0x78017ff7f8'].value).toBe('2.1');

    expect(memgraph.graphObjMap[2].elementMap['0x78017ff7fc'].addr).toBe('0x78017ff7fc');
    expect(memgraph.graphObjMap[2].elementMap['0x78017ff7fc'].name).toBe('c');
    expect(memgraph.graphObjMap[2].elementMap['0x78017ff7fc'].type).toBe('char');
    expect(memgraph.graphObjMap[2].elementMap['0x78017ff7fc'].value).toBe('c');
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

  it("Two Linked List Nodes and its head pointer", async() => {
    let memgraph = new MemGraphClass();

    memgraph.init({
      '0x7c25fffce0': {'name': 'head',
                  'ptrTarget': true,
                  'type': 'Node *',
                  'value': '0x7ff7fdad0000'},
      '0x7ff7fdad0000': {'isLL': true,
                  'isRefered': true,
                  'linkedMember': 'next',
                  'members': ['val'],
                  'name': '(*((Node*)(0x7ff7fdad0000)))',
                  'type': 'Node',
                  'value': {'next': {'type': 'struct node *',
                                     'value': '0x7ff7fdad0004'},
                            'val': {'type': 'int', 'value': '9460301'}},
      },
      '0x7ff7fdad0004': {'isLL': true,
                  'isRefered': false,
                  'linkedMember': 'next',
                  'members': ['val'],
                  'name': '(*((Node*)(0x7ff7fdad0004)))',
                  'type': 'Node',
                  'value': {'next': {'type': 'struct node *',
                                     'value': '0x0'},
                            'val': {'type': 'int', 'value': '123456789'}},
      }
    })
    memgraph.constructGraph()

    expect(memgraph.graphObjMap.length).toBe(1);
    expect(Object.keys(memgraph.graphObjMap[0].elementMap).length).toBe(3);
    expect(memgraph.graphObjMap[0].elementMap['0x7c25fffce0'].addr).toBe('0x7c25fffce0');
    expect(memgraph.graphObjMap[0].elementMap['0x7c25fffce0'].getAfterAddr().size).toBe(1);
    expect(memgraph.graphObjMap[0].elementMap['0x7ff7fdad0000'].getPrevAddr().size).toBe(1);
    expect(memgraph.graphObjMap[0].elementMap['0x7ff7fdad0000'].getAfterAddr().size).toBe(1);
    expect(memgraph.graphObjMap[0].elementMap['0x7ff7fdad0000'].isLL).toBe(true);
    expect(memgraph.graphObjMap[0].elementMap['0x7ff7fdad0000'].value.next.value).toBe('0x7ff7fdad0004');
    expect(memgraph.graphObjMap[0].elementMap['0x7ff7fdad0004'].getPrevAddr().size).toBe(1);
    expect(memgraph.graphObjMap[0].elementMap['0x7ff7fdad0004'].getAfterAddr().size).toBe(0);
  });


  it("Double pointers points to an integer", async() => {
    let memgraph = new MemGraphClass();

    memgraph.init({
      '0x8c00dffc88': {
        'name': 'ptr1',
        'ptrTarget': true,
        'type': 'Node *',
        'value': '0x78017ff7f4'
      },
      '0x8c00dffc8c': {
        'name': 'ptr2',
        'ptrTarget': true,
        'type': 'Node *',
        'value': '0x78017ff7f4'
      },
      '0x78017ff7f4': {
        'name': 'b', 'type': 'int', 'value': '2'
      }
    });
    memgraph.constructGraph()

    expect(memgraph.graphObjMap.length).toBe(1);
    expect(Object.keys(memgraph.graphObjMap[0].elementMap).length).toBe(3);
    expect(memgraph.graphObjMap[0].elementMap['0x8c00dffc88'].addr).toBe('0x8c00dffc88');
    expect(memgraph.graphObjMap[0].elementMap['0x8c00dffc88'].getAfterAddr().size).toBe(1);
    expect(memgraph.graphObjMap[0].elementMap['0x8c00dffc8c'].getAfterAddr().size).toBe(1);
    expect(memgraph.graphObjMap[0].elementMap['0x78017ff7f4'].getPrevAddr().size).toBe(2);
  });

  it("Simple array", async() => {
    let memgraph = new MemGraphClass();

    memgraph.init({
      '0xd3edff8c0': {'isArray': true,
                 'name': 'array_1',
                 'type': 'int [5]',
                 'value': ['11', '22', '33', '44', '55']}
    });
    memgraph.constructGraph()

    expect(memgraph.graphObjMap.length).toBe(1);
    expect(Object.keys(memgraph.graphObjMap[0].elementMap).length).toBe(1);
    expect(memgraph.graphObjMap[0].elementMap['0xd3edff8c0'].addr).toBe('0xd3edff8c0');
    expect(memgraph.graphObjMap[0].elementMap['0xd3edff8c0'].value.length).toBe(5);
    expect(memgraph.graphObjMap[0].elementMap['0xd3edff8c0'].getAfterAddr().size).toBe(0);
    expect(memgraph.graphObjMap[0].elementMap['0xd3edff8c0'].getPrevAddr().size).toBe(0);
  });

  it("A pointer and an array", async() => {
    let memgraph = new MemGraphClass();

    memgraph.init({
      '0x8c00dffc88': {
        'name': 'ptr1',
        'ptrTarget': true,
        'type': 'int **',
        'value': '0xd3edff8c0'
      },
      '0xd3edff8c0': {'isArray': true,
                 'name': 'array_1',
                 'type': 'int [5]',
                 'value': ['11', '22', '33', '44', '55']}
    });
    memgraph.constructGraph()

    expect(memgraph.graphObjMap.length).toBe(1);
    expect(Object.keys(memgraph.graphObjMap[0].elementMap).length).toBe(2);
    expect(memgraph.graphObjMap[0].elementMap['0x8c00dffc88'].addr).toBe('0x8c00dffc88');
    expect(memgraph.graphObjMap[0].elementMap['0x8c00dffc88'].getAfterAddr().size).toBe(1);
    expect(memgraph.graphObjMap[0].elementMap['0xd3edff8c0'].addr).toBe('0xd3edff8c0');
    expect(memgraph.graphObjMap[0].elementMap['0xd3edff8c0'].value.length).toBe(5);
    expect(memgraph.graphObjMap[0].elementMap['0xd3edff8c0'].getAfterAddr().size).toBe(0);
    expect(memgraph.graphObjMap[0].elementMap['0xd3edff8c0'].getPrevAddr().size).toBe(1);
  });


  it("100 pointers points to an integer", async() => {
    let memgraph = new MemGraphClass();

    var datas = {}


    for (var i = 0; i < 100; i++) {
      datas["0x80" + i.toString(8)] = {
        'name': 'ptr' + i,
        'ptrTarget': true,
        'type': 'int *',
        'value': '0x78017ff7f4'
      }
    }
    datas["0x78017ff7f4"] = {'name': 'b', 'type': 'int', 'value': '2'}

    memgraph.init(datas);
    memgraph.constructGraph()

    expect(memgraph.graphObjMap.length).toBe(1);
    expect(Object.keys(memgraph.graphObjMap[0].elementMap).length).toBe(101);
    expect(memgraph.graphObjMap[0].elementMap['0x78017ff7f4'].getPrevAddr().size).toBe(100);
  });

  it("4 100 pointers points to an integer", async() => {
    let memgraph = new MemGraphClass();

    var datas = {}


    for (var i = 0; i < 100; i++) {
      datas["0x80" + i.toString(8)] = {
        'name': 'ptr' + i,
        'ptrTarget': true,
        'type': 'int *',
        'value': '0x78017ff7f4'
      }

      datas["0x81" + i.toString(8)] = {
        'name': 'ptr' + i,
        'ptrTarget': true,
        'type': 'int *',
        'value': '0x78017ff7f8'
      }

      datas["0x82" + i.toString(8)] = {
        'name': 'ptr' + i,
        'ptrTarget': true,
        'type': 'int *',
        'value': '0x78017ff7fc'
      }

      datas["0x83" + i.toString(8)] = {
        'name': 'ptr' + i,
        'ptrTarget': true,
        'type': 'int *',
        'value': '0x78017ff800'
      }
    }
    datas["0x78017ff7f4"] = {'name': 'b', 'type': 'int', 'value': '2'}
    datas["0x78017ff7f8"] = {'name': 'c', 'type': 'int', 'value': '3'}
    datas["0x78017ff7fc"] = {'name': 'd', 'type': 'int', 'value': '4'}
    datas["0x78017ff800"] = {'name': 'e', 'type': 'int', 'value': '5'}

    memgraph.init(datas);
    memgraph.constructGraph()

    expect(memgraph.graphObjMap.length).toBe(4);
    expect(Object.keys(memgraph.graphObjMap[0].elementMap).length).toBe(101);
    expect(Object.keys(memgraph.graphObjMap[1].elementMap).length).toBe(101);
    expect(Object.keys(memgraph.graphObjMap[2].elementMap).length).toBe(101);
    expect(Object.keys(memgraph.graphObjMap[3].elementMap).length).toBe(101);
    expect(memgraph.graphObjMap[0].elementMap['0x78017ff7f4'].getPrevAddr().size).toBe(100);
    expect(memgraph.graphObjMap[1].elementMap['0x78017ff7f8'].getPrevAddr().size).toBe(100);
    expect(memgraph.graphObjMap[2].elementMap['0x78017ff7fc'].getPrevAddr().size).toBe(100);
    expect(memgraph.graphObjMap[3].elementMap['0x78017ff800'].getPrevAddr().size).toBe(100);
  });
  
});