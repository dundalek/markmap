module.exports = function parseMarkdown(text) {

  // var marked = require('marked');
  // var _ = require('lodash');
  // var options = {};
  // var tokens = marked.lexer(text, options);
  // var headings = _.filter(tokens, 'type', 'heading');

  var Remarkable = require('remarkable');
  var md = new Remarkable();

  var tokens = md.parse(text, {})
  var headings = [];
  for (var i = 0; i < tokens.length; i += 1) {
    if (tokens[i].type === 'heading_open') {
      headings.push({
        depth: tokens[i].hLevel,
        line: tokens[i].lines[0],
        name: tokens[i+1].content
      });
      i += 1;
    }
  }

  return headings;
};
