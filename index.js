
var marked = require('marked');
var fs = require('fs');
var _ = require('lodash');

var options = {};
var text = fs.readFileSync('gtor.md', 'utf-8');

var tokens = marked.lexer(text, options);

var headings = _.filter(tokens, 'type', 'heading');

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

  tmp = {
    name: h.text,
    depth: node.depth + 1
  };
  node.children = node.children || [];
  node.children.push(tmp);
});

if (root.children.length === 1) {
  // there is only one child - it is the title, make it root
  root = root.children[0];
}

console.log(root);
//fs.writeFileSync('gtor.json', JSON.stringify(root));
