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
      lines: tokens[i].lines,
      name: tokens[i+1].content
    });
    i += 1;
  }
}

var root = {
  name: 'root',
  depth: 0,
  children: []
};
var node = root;
var stack = [root];
var tmp;

headings.forEach(function(h) {

  while (h.depth < node.depth + 1) {
    node = stack.pop();
  }

  while (h.depth > node.depth + 1) {
    if (!node.children || node.children.length === 0) {
      tmp = {
        name: '',
        depth: node.depth + 1
      };
      node.children = node.children || [];
      node.children.push(tmp);
    }
    node = node.children[node.children.length-1];
    stack.push(node);
  }

  node.children = node.children || [];
  node.children.push(h);
});

if (root.children.length === 1) {
  // there is only one child - it is the title, make it root
  root = root.children[0];
}

return root;
};