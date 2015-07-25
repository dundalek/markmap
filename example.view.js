d3.json("flare.json", function(error, data) {
  if (error) throw error;

  markmap(d3.select("body"), data, {
    width: document.body.scrollWidth,
    height: document.body.scrollHeight
  });
});
