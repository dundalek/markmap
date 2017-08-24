var parse = require('../parse.markdown');

it('parses headings', () => {
  expect(parse("# a\n## b")).toEqual([
    {"depth": 1, "line": 0, "name": "a"},
    {"depth": 2, "line": 1, "name": "b"}
  ]);
});

it('parses lists', () => {
  expect(parse("- a\n  - a 1\n  - a 2\n- b")).toEqual([
    {"depth": 1, "line": 0, "name": "a"},
    {"depth": 2, "line": 1, "name": "a 1"},
    {"depth": 2, "line": 2, "name": "a 2"},
    {"depth": 1, "line": 3, "name": "b"},
  ]);
});

it('parses asterisk lists', () => {
  expect(parse("* a\n  * a 1\n  * a 2\n* b")).toEqual([
    {"depth": 1, "line": 0, "name": "a"},
    {"depth": 2, "line": 1, "name": "a 1"},
    {"depth": 2, "line": 2, "name": "a 2"},
    {"depth": 1, "line": 3, "name": "b"},
  ]);
});

it('does not parse lists when options is passed', () => {
  expect(parse("* a\n  * a 1\n  * a 2", { lists: false })).toEqual([]);
});

it('parses lists under headings', () => {
  expect(parse("# h1\n- a\n  - a 1")).toEqual([
    {"depth": 1, "line": 0, "name": "h1"},
    {"depth": 2, "line": 1, "name": "a"},
    {"depth": 3, "line": 2, "name": "a 1"},
  ]);
});
