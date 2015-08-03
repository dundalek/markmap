module.exports = function transformHeadings(headings) {
  var root = {
    name: 'root',
    depth: 0,
    children: []
  };
  var node = root;
  var stack = [];
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
      stack.push(node);
      node = node.children[node.children.length-1];
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
