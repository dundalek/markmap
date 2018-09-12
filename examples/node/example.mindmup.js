var fs = require('fs');
var transform = require('../../lib/transform.mindmup');

var text = fs.readFileSync('../data/MindMapping.mup', 'utf-8');

var json = JSON.parse(text);
var root = transform(json);

console.log(root);

fs.writeFileSync('../data/tree.json', JSON.stringify(root, null, 2));
