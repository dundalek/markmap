d3.json("data/flare.json", function(error, data) {
  if (error) throw error;

  markmap('svg#mindmap', data, {
    preset: 'colorful', // or colorful
    linkShape: 'diagonal' // or bracket
  });
});
