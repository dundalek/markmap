const d3 = require('d3');
require('../../lib/d3-flextree');
const markmap = require('../../lib/view.mindmap');
const parse = require('../../lib/parse.org');
const transform = require('../../lib/transform.headings');

d3.text("data/example.org", function(error, text) {
  if (error) throw error;
  const ast = parse(text);
  const data = transform(ast);

  markmap('svg#mindmap', data, {
    preset: 'colorful', // or default
    linkShape: 'diagonal' // or bracket
  });
});
