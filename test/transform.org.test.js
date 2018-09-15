var parse = require('../lib/parse.org');
var transform = require('../lib/transform.org');

describe('auto collapse', () => {

  it('auto-collapses single element root', () => {
    expect(transform(parse('* a'))).toEqual({"line": 0, "name": "a"});
  });

  it('auto-collapses single element root list', () => {
    expect(transform(parse('- a'))).toEqual({"line": 0, "name": "a"});
  });

  it('auto-collapses single list under heading', () => {
    expect(transform(parse('* h1\n- a\n- b'))).toEqual({
      "line": 0,
      "name": "h1",
      "children": [
        {
          "line": 1,
          "name": "a"
        }, {
          "line": 2,
          "name": "b"
        }
      ],
    });
  });

  it('preserves list node when there are siblings', () => {
    expect(transform(parse('* h1\n- a\n- b\n** h2'))).toEqual({
      "line": 0,
      "name": "h1",
      "children": [
        {
          "line": 1,
          "name": "",
          "children": [
            {
              "line": 1,
              "name": "a"
            }, {
              "line": 2,
              "name": "b"
            }
          ],
        }, {
          "line": 3,
          "name": "h2"
        }
      ],
    });
  });

  it('auto-collapses list node when there are siblings but single child', () => {
    expect(transform(parse('* h1\n- a\n  - b\n** h2'))).toEqual({
      "line": 0,
      "name": "h1",
      "children": [
        {
          "line": 1,
          "name": "a",
          "children": [
            {
              "line": 2,
              "name": "b"
            }
          ],
        }, {
          "line": 3,
          "name": "h2"
        }
      ],
    });
  });

});

describe('transform', () => {

  it('parses headings', () => {
    expect(transform(parse("* a\n** b"))).toEqual({
      name: 'a',
      line: 0,
      children: [
        { name: 'b', line: 1 }
      ]
    });
  });

  it('parses lists', () => {
    expect(transform(parse("- a\n  - a 1\n  - a 2\n- b"))).toEqual({
      name: 'root',
      children: [
        {
          name: 'a',
          line: 0,
          children: [
            { name: 'a 1', line: 1 },
            { name: 'a 2', line: 2 }
          ]
        },
        { name: 'b', line: 3 }
      ]
    });
  });

  it('parses pluses lists', () => {
    expect(transform(parse("+ a\n  + a 1\n  + a 2\n+ b"))).toEqual({
      name: 'root',
      children: [
        {
          name: 'a',
          line: 0,
          children: [
            { name: 'a 1', line: 1 },
            { name: 'a 2', line: 2 }
          ]
        },
        { name: 'b', line: 3 }
      ]
    });
  });

  it('parses lists under headings', () => {
    expect(transform(parse("* h1\n- a\n  - a 1"))).toEqual({
      name: 'h1',
      line: 0,
      children: [
        {
          name: 'a',
          line: 1,
          children: [
            { name: 'a 1', line: 2 },
          ]
        }
      ]
    });
  });

  it('handles empty list items', () => {
    expect(transform(parse("- a\n-\n- c"))).toEqual({
      name: 'root',
      children: [
        { name: 'a', line: 0 },
        { name: '', line: 1 },
        { name: 'c', line: 2 },
      ]
    });
  });

  it('parses numbered lists', () => {
    expect(transform(parse("* h1\n1. a\n2. b"))).toEqual({
      name: 'h1',
      line: 0,
      children: [
        { name: 'a', line: 1 },
        { name: 'b', line: 2 }
      ]
    });
  });

  it('parses links', () => {
    expect(transform(parse("* h1\nx [[./a.md][x1]] y [[./b.md][x2]] [[./c.md][x3]]"))).toEqual({
      line: 0,
      name: 'h1',
      children: [
        { name: 'x1', href: './a.md' },
        { name: 'x2', href: './b.md' },
        { name: 'x3', href: './c.md' },
      ]
    });
  });

  it('parses links inside lists', () => {
    expect(transform(parse("* h1\n- x\n- [[./a.md][aaa]]\n- x [[./b.md][bbb]] y"))).toEqual({
      line: 0,
      name: 'h1',
      children: [
        { line: 1, name: 'x' },
        { line: 2, name: 'aaa', href: './a.md' },
        { line: 3, name: 'x bbb y', href: './b.md' },
      ]
    });
  });

});
