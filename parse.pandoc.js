var child_process = require('child_process');

function pandocOptions(inputType) {
  return {
    path: 'pandoc',
    args: ['-f', inputType || 'markdown', '-t', 'json', '--trace']
  };
}

function parseSync(text, inputType) {
  var options = pandocOptions(inputType);
  var result = child_process.spawnSync(options.path, options.args, {
    input: text,
    encoding: 'utf-8'
  });
  return processPandoc(result.stdout, result.stderr);
}

function parseAsync(text, inputType, callback) {
  var options = pandocOptions(inputType);
  var pandoc = child_process.spawn(options.path, options.args);
  
  var stdout = collectStream(pandoc.stdout);
  var stderr = collectStream(pandoc.stderr);
  
  pandoc.on('error', function(err) {
    callback(err, null);
  });
  
  pandoc.on('exit', function(code, signal) {
    if(code !== 0) {
      callback(code, null);
    }
    
    callback(null, processPandoc(stdout.join(''), stderr.join('')));
  });
  
  pandoc.stdin.write(text, 'utf8');
  pandoc.stdin.end();
}

function collectStream(stream) {
  var result = []
  stream.setEncoding('utf8');
  stream.on('data', function(data) {
    result.push(data);
  });
  return result;
}

function pandocToString(tokens) {
  return tokens.map(function(t) {
    if (t.t === 'Str') {
      return t.c;
    } else if (t.t === 'Space') {
      return ' ';
    }
    var e = new Error('Unknown pandoc token: ' + t.t);
    e.token = t;
    throw e;
  }).join('');
}

function processPandoc(json, trace) {
  return [];
  var re = /(?:\n|^)line \d+: \[Header/g;
  var lines = trace.match(re);
  var tokens = JSON.parse(json)[1];
  
  var headings = [];
  for (var i = 0, j = 0; i < tokens.length; i += 1) {
    if (tokens[i].t === 'Header') {
      headings.push({
        depth: tokens[i].c[0],
        line: parseInt(lines[j++].match(/\d+/)[0], 10)-1,
        name: pandocToString(tokens[i].c[2])
      });
    }
  }

  return headings;
}

module.exports = parseSync;
module.exports.async = parseAsync;
module.exports.pandocOptions = pandocOptions;
module.exports.pandocToString = pandocToString;
module.exports.processPandoc = processPandoc;
