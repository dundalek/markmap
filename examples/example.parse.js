
var fs = require('fs');
var parse = require('../parse.markdown');

var text = fs.readFileSync('gtor.md', 'utf-8');

var root = parse(text);

console.log(root);

fs.writeFileSync('gtor.json', JSON.stringify(root));
