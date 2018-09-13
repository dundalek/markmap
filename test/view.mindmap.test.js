const markmap = require('../lib/view.mindmap');

describe('diffTreeState', () => {

  it('stays the same when unchanged', () => {
    expect(markmap.prototype.diffTreeState({
      name: "root",
      children: [
        { name: "a" },
        { name: "b", children: [ { name: "b1" }, { name: "b2" } ] },
        { name: "c" },
      ]
    }, {
      name: "root",
      children: [
        { name: "a" },
        { name: "b", children: [ { name: "b1" }, { name: "b2" } ] },
        { name: "c" },
      ]
    })).toEqual({
      name: "root",
      children: [
        { name: "a" },
        { name: "b", children: [ { name: "b1" }, { name: "b2" } ] },
        { name: "c" },
      ]
    });
  });

  it('preserves nested folded state', () => {
    expect(markmap.prototype.diffTreeState({
      name: "root",
      children: [
        { name: "a" },
        { name: "b", children: [ { name: "b1" }, { name: "b2" } ] },
        { name: "c" },
      ]
    }, {
      name: "root",
      children: [
        { name: "a" },
        { name: "b", _children: [ { name: "b1" }, { name: "b2" } ] },
        { name: "c" },
      ]
    })).toEqual({
      name: "root",
      children: [
        { name: "a" },
        { name: "b", _children: [ { name: "b1" }, { name: "b2" } ] },
        { name: "c" },
      ]
    });
  });

  it('preserves state when neighbor node is removed', () => {
    expect(markmap.prototype.diffTreeState({
      name: "root",
      children: [
        { name: "b", children: [ { name: "b1" }, { name: "b2" } ] },
        { name: "c" },
      ]
    }, {
      name: "root",
      children: [
        { name: "a" },
        { name: "b", _children: [ { name: "b1" }, { name: "b2" } ] },
        { name: "c" },
      ]
    })).toEqual({
      name: "root",
      children: [
        { name: "b", _children: [ { name: "b1" }, { name: "b2" } ] },
        { name: "c" },
      ]
    });
  });

  it('preserves state when neighbor node is added', () => {
    expect(markmap.prototype.diffTreeState({
      name: "root",
      children: [
        { name: "a" },
        { name: "aa" },
        { name: "b", children: [ { name: "b1" }, { name: "b2" } ] },
        { name: "c" },
      ]
    }, {
      name: "root",
      children: [
        { name: "a" },
        { name: "b", _children: [ { name: "b1" }, { name: "b2" } ] },
        { name: "c" },
      ]
    })).toEqual({
      name: "root",
      children: [
        { name: "a" },
        { name: "aa" },
        { name: "b", _children: [ { name: "b1" }, { name: "b2" } ] },
        { name: "c" },
      ]
    });
  });

  it('preserves state when node is renamed', () => {
    expect(markmap.prototype.diffTreeState({
      name: "root",
      children: [
        { name: "a" },
        { name: "bbb", children: [ { name: "b1" }, { name: "b2" } ] },
        { name: "c" },
      ]
    }, {
      name: "root",
      children: [
        { name: "a" },
        { name: "b", _children: [ { name: "b1" }, { name: "b2" } ] },
        { name: "c" },
      ]
    })).toEqual({
      name: "root",
      children: [
        { name: "a" },
        { name: "bbb", _children: [ { name: "b1" }, { name: "b2" } ] },
        { name: "c" },
      ]
    });
  });

  it('preserves with nodes of the same name', () => {
    expect(markmap.prototype.diffTreeState({
      name: "root",
      children: [
        { name: "a" },
        { name: "aa" },
        { name: "b", children: [ { name: "bx" } ] },
        { name: "b", children: [ { name: "b1" }, { name: "b2" } ] },
        { name: "c" },
      ]
    }, {
      name: "root",
      children: [
        { name: "a" },
        { name: "b", children: [ { name: "bx" } ] },
        { name: "b", _children: [ { name: "b1" }, { name: "b2" } ] },
        { name: "c" },
      ]
    })).toEqual({
      name: "root",
      children: [
        { name: "a" },
        { name: "aa" },
        { name: "b", children: [ { name: "bx" } ] },
        { name: "b", _children: [ { name: "b1" }, { name: "b2" } ] },
        { name: "c" },
      ]
    });
  });

});
