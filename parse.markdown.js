module.exports = function parseMarkdown(text, options) {
  options = options || {};
  parseLists = options.lists !== false;

  var Remarkable = require('remarkable');
  var md = new Remarkable();
  md.block.ruler.enable([
    'deflist'
  ]);

  var tokens = md.parse(text, {})
  var headings = [];
  var depth = 0;
  for (var i = 0; i < tokens.length; i += 1) {
    if (tokens[i].type === 'heading_open') {
      depth = tokens[i].hLevel;
      headings.push({
        depth: depth,
        line: tokens[i].lines[0],
        name: tokens[i+1].content || ''
      });
      i += 1;
    } else if (parseLists) {
      switch (tokens[i].type) {
        case 'bullet_list_open':
        case 'dl_open':
        case 'ordered_list_open':
          headings.push({
            depth: depth + 1,
            line: tokens[i].lines[0],
            name: '',
            autoCollapse: true
          });
          depth += 2;
          break;
        case 'bullet_list_close':
        case 'dl_close':
        case 'ordered_list_close':
          depth -= 2;
          break;
        case 'list_item_open':
          headings.push({
            depth: depth,
            line: tokens[i].lines[0],
            name: (tokens[i+2].content || '').split('\n')[0]
          });
          i += 2;
          break;
        case 'dt_open':
          headings.push({
            depth: depth,
            line: tokens[i].lines[0],
            name: tokens[i+1].content || ''
          });
          i += 1;
          break;
      }
    }
  }

  return headings;
};
