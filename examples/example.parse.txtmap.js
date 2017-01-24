
var fs = require('fs');
var parse = require('../parse.txtmap');
var transform = require('../transform.headings');

var text = fs.readFileSync('example.txtmap', 'utf-8');

var headings = parse(text);
var root = transform(headings);

console.log(root);

fs.writeFileSync('gtor.json', JSON.stringify(root));
