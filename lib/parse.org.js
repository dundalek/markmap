var org = require('org');

module.exports = function parseOrg(input) {
  var tokens = (new org.Parser()).parse(input, { toc:false }).nodes;
  var headings = [];
  var depth = 0;

  for (var i = 0; i < tokens.length; i += 1) {
    var token = tokens[i];
    switch (token.type) {
      case 'header':
        depth = token.level;
        headings.push({
          name: token.children[0].children[0].value,
          depth: depth,
          line: token.fromLineNumber - 1,
        });
        break;
      case 'unorderedList':
        headings.push({
          depth: depth + 1,
          line: token.fromLineNumber - 1,
          name: '',
          autoCollapse: true,
          children: token.children.map(x => x.children[0].children[0].value)
        });
      // case 'definitionList':

    }
  }

  return headings;
};
