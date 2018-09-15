
function processChildren(node) {
  var children = (node.children || []).map(transformOrg).filter(function(node) { return node });
  if (children.length === 1 && children[0].autoCollapse) {
    return children[0].children;
  }
  return children;
}

function assignChildren(node, children) {
  if (node.autoCollapse && children && children.length === 1 && children[0]) {
    return children[0];
  }
  children.forEach(function(node) { delete node.autoCollapse });
  if (children && children.length > 0) {
    node.children = children;
  }
  return node;
}

function extractText(node) {
  if (node.type === 'text') {
    return node.value;
  }
  if (node.type === 'link') {
    return node.desc;
  }
  if (node.children) {
    return node.children
      .filter(function(node) { return node.type !== 'list' })
      .map(extractText)
      .join('');
  }
  return '';
}

function transformOrg(node) {
  var children;
  switch (node.type) {
    case 'root':
      children = processChildren(node);
      if (children.length === 1) {
        return children[0];
      }
      return assignChildren({
        name: 'root',
      }, children);
    case 'section':
      var headline = node.children[0];
      return assignChildren({
        name: extractText(headline),
        line: headline.line,
      }, processChildren(headline).concat(processChildren(node)));
    case 'paragraph':
    case 'list':
      return assignChildren({
        name: '',
        line: node.line,
        autoCollapse: true,
      }, processChildren(node));
    case 'list.item':
      children = processChildren(node);
      var item = {
        name: extractText(node),
        line: node.line,
      };
      if (children.length === 1 && children[0].href) {
        item.href = children[0].href;
        return item;
      }
      return assignChildren(item, children);
    case 'link':
      return {
        name: node.desc,
        href: node.uri.raw
      };
  }
  return null;
};

module.exports = transformOrg;
