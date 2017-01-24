module.exports = function(text) {
  var lines = text.split('\n');

  var entries = [];
  for (var i = 0; i < lines.length; i++) {
    var match = /^(\s*)(.+)$/.exec(lines[i]);
    if (!match) {
      continue;
    }
    var isSpaces = match[1].length > 0 && match[1][0] === ' ';
    var depth = match[1].length;
    if (isSpaces) {
      depth /= 2;
    }
    depth += 1; // ensure depth is min 1

    entries.push({
      depth: depth,
      line: i + 1,
      name: match[2]
    });
  }

  return entries;
};
