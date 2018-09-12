const d3 = require('d3');
require('../../lib/d3-flextree');
const markmap = require('../../lib/view.mindmap');
// const parse = require('../../lib/parse.markdown');
const parse = require('../../lib/parse.txtmap');
const transform = require('../../lib/transform.headings');

// d3.json("data/tree.json", function(error, data) {
//   if (error) throw error;
//
//   markmap('svg#mindmap', data, {
//     preset: 'colorful', // or default
//     linkShape: 'diagonal' // or bracket
//   });
// });


d3.text("data/example.txtmap", function(error, text) {
  if (error) throw error;
  const data = transform(parse(text));

  markmap('svg#mindmap', data, {
    preset: 'colorful', // or default
    linkShape: 'diagonal' // or bracket
  });
});
