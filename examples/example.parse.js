
var fs = require('fs');
var parse = require('../parse.markdown');
var transform = require('../transform.headings');

var text = fs.readFileSync('gtor.md', 'utf-8');

var headings = parse(text);
var root = transform(headings);

// var text = fs.readFileSync('MindMapping.mup', 'utf-8');
// var json = JSON.parse(text);
// var transformMindmup = require('../transform.mindmup');
// var root = transformMindmup(json);

console.log(root);

fs.writeFileSync('gtor.json', JSON.stringify(root));

// var parse = require('../parse.pandoc');
// parse.async(text, 'markdown', function(err, headings) {
//   var root = transform(headings);
//
//   //console.log(root);
//
//   fs.writeFileSync('gtor.json', JSON.stringify(root));
// });
