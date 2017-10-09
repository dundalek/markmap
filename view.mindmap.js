(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['d3'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('d3'));
    } else {
        // Browser globals (root is window)
        root.markmap = factory(root.d3);
    }
}(this, function (d3) {

var assign = Object.assign || function(dst, src) {
  // poor man's Object.assign()
  for (var k in src) {
    if (src.hasOwnProperty(k)) {
      dst[k] = src[k];
    }
  }
  return dst;
};

function getTextWidth(text, font) {
  // re-use canvas object for better performance
  var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
  var context = canvas.getContext("2d");
  context.font = font;
  var metrics = context.measureText(text);
  return metrics.width;
}

function traverseBranchId(node, branch, state) {
  node.branch = branch;
  if (node.children) {
    node.children.forEach(function(d) {
      traverseBranchId(d, branch, state);
    });
  }
}

function traverseDummyNodes(node) {
  if (node.children) {
    node.children.forEach(traverseDummyNodes);

    node.children = [{
      name: '',
      dummy: true,
      children: node.children
    }];
  }
}

function traverseTruncateLabels(node, length) {
  if (node.name.length > length) {
    node.name = node.name.slice(0, length - 1) + '\u2026';
  }
  if (node.children) {
    node.children.forEach(function(n) {
      traverseTruncateLabels(n, length);
    });
  }
}

function Markmap(svg, data, options) {
  if (!(this instanceof Markmap)) return new Markmap(svg, data, options);
  this.init(svg, data, options);
}

var defaultPreset = {
  nodeHeight: 20,
  nodeWidth: 180,
  nodePadding: 12,
  spacingVertical: 5,
  spacingHorizontal: 60,
  truncateLabels: 0,
  duration: 750,
  layout: 'tree',
  color: 'gray',
  linkShape: 'diagonal',
  renderer: 'boxed'
};

assign(Markmap.prototype, {
  getInitialState: function() {
    return {
      zoomScale: 1,
      zoomTranslate: [0, 0],
      autoFit: true,
      depthMaxSize: {},
      yByDepth: {},
      nodeFont: '10px sans-serif'
    };
  },
  presets: {
    'default': defaultPreset,
    'colorful': assign(assign({}, defaultPreset), {
      nodeHeight: 10,
      renderer: 'basic',
      color: 'category20',
      nodePadding: 6
    })
  },
  helperNames: ['layout', 'linkShape', 'color'],
  layouts: {
    tree: function(self) {
      return d3.layout.flextree()
        .setNodeSizes(true)
        .nodeSize(function(d) {
          var width = d.dummy ? self.state.spacingHorizontal : getTextWidth(d.name, self.state.nodeFont);
          if (!d.dummy && width > 0) {
            // Add padding non-empty nodes
            width += 2 * self.state.nodePadding;
          }
          return [self.state.nodeHeight, width];
        })
        .spacing(function(a, b) {
          return a.parent == b.parent ? self.state.spacingVertical : self.state.spacingVertical*2;
        })
    }
  },
  linkShapes: {
    diagonal: function() {
      return d3.svg.diagonal()
        .projection(function(d) { return [d.y, d.x]; });
    },
    bracket: function() {
      return function(d) {
        return "M" + d.source.y + "," + d.source.x
            + "V" + d.target.x + "H" + d.target.y;
      };
    }
  },
  colors: assign(
    {gray: function() {return function() {return '#929292';}}},
    d3.scale
  ),
  init: function(svg, data, options) {
    options = options || {};

    svg = svg.datum ? svg : d3.select(svg);

    this.helpers = {};
    this.i = 0;
    var state = this.state = this.getInitialState();
    this.set(this.presets[options.preset || 'default']);
    state.height = svg.node().getBoundingClientRect().height;
    state.width = svg.node().getBoundingClientRect().width;
    this.set(options);

    // disable panning using right mouse button
    svg.on("mousedown", function() {
      var ev = d3.event;
      if (ev.button === 2) {
        ev.stopImmediatePropagation();
      }
    });

    var zoom = this.zoom = d3.behavior.zoom()
       .on("zoom", function() {
         this.updateZoom(d3.event.translate, d3.event.scale);
       }.bind(this));

    this.svg = svg
      .call(zoom)
      .append("g");

    this.updateZoom(state.zoomTranslate, state.zoomScale);

    this.setData(data);
    this.update(state.root);

    if (options.autoFit === undefined || options.autoFit === null) {
      state.autoFit = false;
    }
  },
  updateZoom: function(translate, scale) {
    var state = this.state;
    state.zoomTranslate = translate;
    state.zoomScale = scale;
    this.zoom.translate(state.zoomTranslate)
        .scale(state.zoomScale);
    this.svg.attr("transform", "translate(" + state.zoomTranslate + ")" + " scale(" + state.zoomScale + ")")
  },
  set: function(values) {
    if (values.preset) {
      this.set(this.presets[values.preset]);
    }
    var state = this.state;
    var helpers = this.helpers;
    this.helperNames.forEach(function(h) {
      if (!helpers[h] || (values[h] && values[h] !== state[h])) {
        helpers[h] = this[h+'s'][values[h] || state[h]](this);
      }
    }.bind(this));
    assign(state, values || {});
    return this;
  },
  setData: function(data) {
    var state = this.state;

    if (state.truncateLabels) {
      traverseTruncateLabels(data, state.truncateLabels);
    }

    if (data.children) {
      data.children.forEach(function(d, i) {
        traverseBranchId(d, i, state);
      });
    }

    var state = this.state;
    state.root = data;
    state.root.x0 = state.height / 2;
    state.root.y0 = 0;

    return this;
  },
  update: function(source) {
    var state = this.state;
    source = source || state.root;
    var res = this.layout(state);
    if (state.autoFit) {
      var minX = d3.min(res.nodes, function(d) {return d.x;});
      var minY = d3.min(res.nodes, function(d) {return d.y;});
      var maxX = d3.max(res.nodes, function(d) {return d.x;});
      var maxY = d3.max(res.nodes, function(d) {return d.y + d.y_size;});
      var realHeight = maxX - minX;
      var realWidth = maxY - minY;
      var scale = Math.min(state.height / realHeight, state.width / realWidth, 1);
      var translate = [
        (state.width-realWidth*scale)/2-minY*scale,
        (state.height-realHeight*scale)/2-minX*scale
      ];
      this.updateZoom(translate, scale);
    }
    this.render(source, res.nodes, res.links);
    return this;
  },
  layout: function(state) {
    var layout = this.helpers.layout;

    if (state.linkShape !== 'bracket') {
      // Fill in with dummy nodes to handle spacing for layout algorithm
      traverseDummyNodes(state.root);
    }

    // Compute the new tree layout.
    var nodes = layout.nodes(state.root).reverse();

    // Remove dummy nodes after layout is computed
    nodes = nodes.filter(function(n) { return !n.dummy; });
    nodes.forEach(function(n) {
      if (n.children && n.children.length === 1 && n.children[0].dummy) {
        n.children = n.children[0].children;
      }
      if (n.parent && n.parent.dummy) {
        n.parent = n.parent.parent;
      }
    });

    if (state.linkShape === 'bracket') {
      nodes.forEach(function(n) {
        n.y += n.depth * state.spacingHorizontal;
      });
    }

    var links = layout.links(nodes);

    return {
      nodes: nodes,
      links: links
    };
  },
  render: function(source, nodes, links) {
    this.renderers[this.state.renderer].call(this, source, nodes, links);
  },
  renderers: {
    boxed: function(source, nodes, links) {
      var svg = this.svg;
      var state = this.state;
      var color = this.helpers.color;
      this.renderers.basic.call(this, source, nodes, links);
      var node = svg.selectAll("g.markmap-node");

      node.select('rect')
        .attr("y", -state.nodeHeight/2)
        .attr('rx', 10)
        .attr('ry', 10)
        .attr('height', state.nodeHeight)
        .attr('fill', function(d) { return d3.rgb(color(d.branch)).brighter(1.2); })
        .attr('stroke', function(d) { return color(d.branch); })
        .attr('stroke-width', 1);

      node.select('text')
       .attr("dy", "3")

      svg.selectAll("path.markmap-link")
        .attr('stroke-width', 1);
    },
    basic: function(source, nodes, links) {
      var svg = this.svg;
      var state = this.state;
      var color = this.helpers.color;
      var linkShape = this.helpers.linkShape;

      function linkWidth(d) {
        var depth = d.depth;
        if (d.name !== '' && d.children && d.children.length === 1 && d.children[0].name === '') {
          depth += 1;
        }
        return Math.max(6 - 2*depth, 1.5);
      }

      // Update the nodes…
      var node = svg.selectAll("g.markmap-node")
          .data(nodes, function(d) { return d.id || (d.id = ++this.i); }.bind(this));

      // Enter any new nodes at the parent's previous position.
      var nodeEnter = node.enter().append("g")
          .attr("class", "markmap-node")
          .attr("transform", function(d) { return "translate(" + (source.y0 + source.y_size - d.y_size) + "," + source.x0 + ")"; })
          .on("click", this.click.bind(this));

      nodeEnter.append('rect')
        .attr('class', 'markmap-node-rect')
        .attr("y", function(d) { return -linkWidth(d) / 2 })
        .attr('x', function(d) { return d.y_size; })
        .attr('width', 0)
        .attr('height', linkWidth)
        .attr('fill', function(d) { return color(d.branch); });

      nodeEnter.append("circle")
          .attr('class', 'markmap-node-circle')
          .attr('cx', function(d) { return d.y_size; })
          .attr('stroke', function(d) { return color(d.branch); })
          .attr("r", 1e-6)
          .style("fill", function(d) { return d._children ? color(d.branch) : ''; });

      nodeEnter.append("text")
          .attr('class', 'markmap-node-text')
          .attr("x", function(d) { return d.y_size; })
          .attr("dy", "-5")
          .attr("text-anchor", function(d) { return "start"; })
          .text(function(d) { return d.name; })
          .style("fill-opacity", 1e-6);

      // Transition nodes to their new position.
      var nodeUpdate = node.transition()
          .duration(state.duration)
          .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

      nodeUpdate.select('rect')
        .attr('x', -1)
        .attr('width', function(d) { return d.y_size + 2; });

      nodeUpdate.select("circle")
          .attr("r", 4.5)
          .style("fill", function(d) { return d._children ? color(d.branch) : ''; })
          .style('display', function(d) {
            var hasChildren = d.children || d._children;
            return hasChildren ?  'inline' : 'none';
          });

      nodeUpdate.select("text")
          .attr("x", 10)
          .style("fill-opacity", 1);

      // Transition exiting nodes to the parent's new position.
      var nodeExit = node.exit().transition()
          .duration(state.duration)
          .attr("transform", function(d) { return "translate(" + (source.y + source.y_size - d.y_size) + "," + source.x + ")"; })
          .remove();

      nodeExit.select('rect')
        .attr('x', function(d) { return d.y_size; })
        .attr('width', 0);

      nodeExit.select("circle")
          .attr("r", 1e-6);

      nodeExit.select("text")
          .style("fill-opacity", 1e-6)
          .attr("x", function(d) { return d.y_size; });


      // Update the links…
      var link = svg.selectAll("path.markmap-link")
          .data(links, function(d) { return d.target.id; });

      // Enter any new links at the parent's previous position.
      link.enter().insert("path", "g")
          .attr("class", "markmap-link")
          .attr('stroke', function(d) { return color(d.target.branch); })
          .attr('stroke-width', function(l) {return linkWidth(l.target);})
          .attr("d", function(d) {
            var o = {x: source.x0, y: source.y0 + source.y_size};
            return linkShape({source: o, target: o});
          });

      // Transition links to their new position.
      link.transition()
          .duration(state.duration)
          .attr("d", function(d) {
            var s = {x: d.source.x, y: d.source.y + d.source.y_size};
            var t = {x: d.target.x, y: d.target.y};
            return linkShape({source: s, target: t});
          });

      // Transition exiting nodes to the parent's new position.
      link.exit().transition()
          .duration(state.duration)
          .attr("d", function(d) {
            var o = {x: source.x, y: source.y + source.y_size};
            return linkShape({source: o, target: o});
          })
          .remove();

      // Stash the old positions for transition.
      nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }
  },
  // Toggle children on click.
  click: function(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    this.update(d);
  }

});

return Markmap;

}));
