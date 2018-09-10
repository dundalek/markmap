var fs = require('fs');
var parse = require('../../src/parse.txtmap');
var transform = require('../../src/transform.headings');

var text = fs.readFileSync('../data/example.txtmap', 'utf-8');

var headings = parse(text);
var root = transform(headings);

console.log(root);

fs.writeFileSync('../data/tree.json', JSON.stringify(root, null, 2));
