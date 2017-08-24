var parse = require('../parse.markdown');

it('parses headings', () => {
  expect(parse("# a\n## b")).toEqual([
    {
      "depth": 1,
      "line": 0,
      "name": "a"
    }, {
      "depth": 2,
      "line": 1,
      "name": "b"
    }
  ]);
});

it('parses lists', () => {
  expect(parse("- a\n  - a 1\n  - a 2\n- b")).toEqual([
    {
      "autoCollapse": true,
      "depth": 1,
      "line": 0,
      "name": ""
    }, {
      "depth": 2,
      "line": 0,
      "name": "a"
    }, {
      "autoCollapse": true,
      "depth": 3,
      "line": 1,
      "name": ""
    }, {
      "depth": 4,
      "line": 1,
      "name": "a 1"
    }, {
      "depth": 4,
      "line": 2,
      "name": "a 2"
    }, {
      "depth": 2,
      "line": 3,
      "name": "b"
    }
  ]);
});

it('parses asterisk lists', () => {
  expect(parse("* a\n  * a 1\n  * a 2\n* b")).toEqual([
    {
      "autoCollapse": true,
      "depth": 1,
      "line": 0,
      "name": ""
    }, {
      "depth": 2,
      "line": 0,
      "name": "a"
    }, {
      "autoCollapse": true,
      "depth": 3,
      "line": 1,
      "name": ""
    }, {
      "depth": 4,
      "line": 1,
      "name": "a 1"
    }, {
      "depth": 4,
      "line": 2,
      "name": "a 2"
    }, {
      "depth": 2,
      "line": 3,
      "name": "b"
    }
  ]);
});

it('does not parse lists when options is passed', () => {
  expect(parse("* a\n  * a 1\n  * a 2", {lists: false})).toEqual([]);
});

it('parses lists under headings', () => {
  expect(parse("# h1\n- a\n  - a 1")).toEqual([
    {
      "depth": 1,
      "line": 0,
      "name": "h1"
    }, {
      "autoCollapse": true,
      "depth": 2,
      "line": 1,
      "name": ""
    }, {
      "depth": 3,
      "line": 1,
      "name": "a"
    }, {
      "autoCollapse": true,
      "depth": 4,
      "line": 2,
      "name": ""
    }, {
      "depth": 5,
      "line": 2,
      "name": "a 1"
    }
  ]);
});

it('parses definition lists', () => {
  expect(parse("a\n: text")).toEqual([
    {
      "autoCollapse": true,
      "depth": 1,
      "line": 0,
      "name": ""
    }, {
      "depth": 2,
      "line": 0,
      "name": "a"
    }
  ]);
});
