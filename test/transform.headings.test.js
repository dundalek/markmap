var parse = require('../lib/parse.markdown');
var transform = require('../lib/transform.headings');

it('auto-collapses single element root', () => {
  expect(transform(parse('# a'))).toEqual({"depth": 1, "line": 0, "name": "a"});
});

it('auto-collapses single element root list', () => {
  expect(transform(parse('- a'))).toEqual({"depth": 1, "line": 0, "name": "a"});
});

it('auto-collapses single list under heading', () => {
  expect(transform(parse('# h1\n- a\n- b'))).toEqual({
    "depth": 1,
    "line": 0,
    "name": "h1",
    "children": [
      {
        "depth": 2,
        "line": 1,
        "name": "a"
      }, {
        "depth": 2,
        "line": 2,
        "name": "b"
      }
    ],
  });
});

it('preserves list node when there are siblings', () => {
  expect(transform(parse('# h1\n- a\n- b\n## h2'))).toEqual({
    "depth": 1,
    "line": 0,
    "name": "h1",
    "children": [
      {
        "depth": 2,
        "line": 1,
        "name": "",
        "children": [
          {
            "depth": 3,
            "line": 1,
            "name": "a"
          }, {
            "depth": 3,
            "line": 2,
            "name": "b"
          }
        ],
      }, {
        "depth": 2,
        "line": 3,
        "name": "h2"
      }
    ],
  });
});

it('auto-collapses list node when there are siblings but single child', () => {
  expect(transform(parse('# h1\n- a\n  - b\n## h2'))).toEqual({
    "depth": 1,
    "line": 0,
    "name": "h1",
    "children": [
      {
        "depth": 2,
        "line": 1,
        "name": "a",
        "children": [
          {
            "depth": 3,
            "line": 2,
            "name": "b"
          }
        ],
      }, {
        "depth": 2,
        "line": 3,
        "name": "h2"
      }
    ],
  });
});
