d3.json("gtor.json", function(error, data) {
  if (error) throw error;

  markmap('svg#mindmap', data);
});
