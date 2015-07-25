d3.json("flare.json", function(error, data) {
  if (error) throw error;

  markmap(d3.select("body"), data);
});
