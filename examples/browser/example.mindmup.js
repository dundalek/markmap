const d3 = require('d3');
require('../../lib/d3-flextree');
const markmap = require('../../lib/view.mindmap');
const transform = require('../../lib/transform.mindmup');

d3.json("data/MindMapping.mup", function(error, data) {
  if (error) throw error;
  data = transform(data);

  markmap('svg#mindmap', data, {
    preset: 'colorful', // or default
    linkShape: 'diagonal' // or bracket
  });
});
