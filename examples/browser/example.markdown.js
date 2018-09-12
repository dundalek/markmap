const d3 = require('d3');
require('../../src/d3-flextree');
const markmap = require('../../src/view.mindmap');
const parse = require('../../src/parse.markdown');
const transform = require('../../src/transform.headings');

d3.text("data/gtor.md", function(error, text) {
  if (error) throw error;
  const data = transform(parse(text));

  markmap('svg#mindmap', data, {
    preset: 'colorful', // or default
    linkShape: 'diagonal' // or bracket
  });
});
