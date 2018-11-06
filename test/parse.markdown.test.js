var parse = require('../lib/parse.markdown');

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

it('handles empty list items', () => {
  expect(parse("- a\n-\n- c")).toEqual([
    {
      "autoCollapse": true,
      "depth": 1,
      "line": 0,
      "name": "",
    },
    {
      "depth": 2,
      "line": 0,
      "name": "a",
    },
    {
      "depth": 2,
      "line": 1,
      "name": "",
    },
    {
      "depth": 2,
      "line": 2,
      "name": "c",
    },
  ]);
});

it('handles nested text', () => {
  expect(parse("- a\n  abc")).toEqual([
    {
      "autoCollapse": true,
      "depth": 1,
      "line": 0,
      "name": "",
    },
    {
      "depth": 2,
      "line": 0,
      "name": "a",
    },
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

it('parses numbered lists', () => {
  expect(parse("# h1\n1. a\n2. b")).toEqual([
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
      "depth": 3,
      "line": 2,
      "name": "b"
    }
  ]);
});

it('parses links', () => {
  expect(parse("# h1\nx [x1](./a.md) y [x2](./b.md) [x3](./c.md)", { links: true })).toEqual([
    {
      "depth": 1,
      "line": 0,
      "name": "h1"
    }, {
      "depth": 2,
      "line": 1,
      "name": "x1",
      "href": "./a.md"
    }, {
      "depth": 2,
      "line": 1,
      "name": "x2",
      "href": "./b.md"
    }, {
      "depth": 2,
      "line": 1,
      "name": "x3",
      "href": "./c.md"
    }
  ]);
});

it('parses links inside lists', () => {
  expect(parse("# h1\n- x\n- [aaa](./a.md)\n- x [bbb](./b.md) y", { links: true })).toEqual([
    {
      "depth": 1,
      "line": 0,
      "name": "h1"
    },
    {
      "autoCollapse": true,
      "depth": 2,
      "line": 1,
      "name": ""
    },
    {
      "depth": 3,
      "line": 1,
      "name": "x",
    },
    {
      "depth": 3,
      "line": 2,
      "name": "aaa",
      "href": "./a.md"
    },
    {
      "depth": 3,
      "line": 3,
      "name": "x bbb y",
      "href": "./b.md"
    },
  ]);
});

it('doest not parse links inside lists when disabled by default', () => {
  expect(parse("# h1\n- x\n- [aaa](./a.md)\n- x [bbb](./b.md) y")).toEqual([
    {
      "depth": 1,
      "line": 0,
      "name": "h1"
    },
    {
      "autoCollapse": true,
      "depth": 2,
      "line": 1,
      "name": ""
    },
    {
      "depth": 3,
      "line": 1,
      "name": "x",
    },
    {
      "depth": 3,
      "line": 2,
      "name": "aaa",
    },
    {
      "depth": 3,
      "line": 3,
      "name": "x bbb y",
    },
  ]);
});
