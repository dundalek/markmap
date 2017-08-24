module.exports = function parseMarkdown(text, options) {
  options = options || {};
  parseLists = options.lists !== false;

  var Remarkable = require('remarkable');
  var md = new Remarkable();

  var tokens = md.parse(text, {})
  var headings = [];
  var depth = 0;
  for (var i = 0; i < tokens.length; i += 1) {
    if (tokens[i].type === 'heading_open') {
      depth = tokens[i].hLevel;
      headings.push({
        depth: depth,
        line: tokens[i].lines[0],
        name: tokens[i+1].content
      });
      i += 1;
    } else if (parseLists) {
      switch (tokens[i].type) {
        case 'bullet_list_open': depth += 1; break;
        case 'bullet_list_close': depth -= 1; break;
        case 'list_item_open':
          headings.push({
            depth: depth,
            line: tokens[i].lines[0],
            name: tokens[i+2].content
          });
          i += 2;
          break;
      }
    }
  }

  return headings;
};
