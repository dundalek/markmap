module.exports = function transformMindmup(node) {
  var ret = {
    name: node.title
  };
  if (node.ideas) {
    ret.children = [];
    for (var c in node.ideas) {
      ret.children.push(transformMindmup(node.ideas[c]));
    }
  }
  return ret;
};
