var fs = require('fs');
var parse = require('../../lib/parse.org');
var transform = require('../../lib/transform.org');

var text = fs.readFileSync('../data/example.org', 'utf-8');

var ast = parse(text);
var root = transform(ast);

console.log(root);

fs.writeFileSync('../data/tree.json', JSON.stringify(root, null, 2));
