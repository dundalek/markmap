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

function traverseMinDistance(node) {
  var val = Infinity;
  if (node.children) {
    val = Math.min.apply(null, node.children.map(traverseMinDistance));
    if (node.children.length > 1) {
      val = Math.min(val, Math.abs(node.children[0].x - node.children[1].x));
    }
  }
  return val;
}

function getLabelWidth(d) {
  // constant ratio for now, needs to be measured based on font
  return d.name.length * 5;
}

function traverseLabelWidth(d, offset) {
  d.y += offset;
  if (d.name !== '' && d.children && d.children.length === 1 && d.children[0].name === '') {
    var child = d.children[0];
    offset += d.y + getLabelWidth(d) - child.y;
    child.y += offset;
    if (child.children) {
      child.children.forEach(function(c) {
        traverseLabelWidth(c, offset);
      });
    }
  }
}

function traverseBranchId(node, branch) {
  node.branch = branch;
  if (node.children) {
    node.children.forEach(function(d) {
      traverseBranchId(d, branch);
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
  spacingVertical: 10,
  spacingHorizontal: 120,
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
      autoFit: true
    };
  },
  presets: {
    'default': defaultPreset,
    'colorful': assign(assign({}, defaultPreset), {
      nodeHeight: 10,
      renderer: 'basic',
      color: 'category20'
    })
  },
  helperNames: ['layout', 'linkShape', 'color'],
  layouts: {
    tree: function() {
      return d3.layout.tree();
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
        helpers[h] = this[h+'s'][values[h] || state[h]]();
      }
    }.bind(this));
    assign(state, values || {});
    return this;
  },
  setData: function(data) {
    if (data.children) {
      data.children.forEach(function(d, i) {
        traverseBranchId(d, i);
      });
    }

    var state = this.state;
    state.root = data;
    state.root.x0 = state.height / 2;
    state.root.y0 = 0;

    // function collapse(d) {
    //   if (d.children) {
    //     d._children = d.children;
    //     d._children.forEach(collapse);
    //     d.children = null;
    //   }
    // }
    //root.children.forEach(collapse);
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
      var maxY = d3.max(res.nodes, function(d) {return d.y;});
      var realHeight = maxX - minX;
      var realWidth = maxY - minY + state.nodeWidth;
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

    var offset = state.root.x !== undefined ? state.root.x : state.root.x0;

    // Compute the new tree layout.
    var nodes = layout.nodes(state.root).reverse(),
        links = layout.links(nodes);

    // Normalize
    var ratio = (state.nodeHeight + state.spacingVertical) / traverseMinDistance(state.root);
    offset -= state.root.x * ratio;

    nodes.forEach(function(d) {
      d.y = d.depth * (state.nodeWidth + state.spacingHorizontal);
      d.x = d.x * ratio + offset;
    });

    //traverseLabelWidth(root, 0);

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
          .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
          .on("click", this.click.bind(this));

      nodeEnter.append('rect')
        .attr('class', 'markmap-node-rect')
        .attr("y", function(d) { return -linkWidth(d) / 2 })
        .attr('x', state.nodeWidth)
        .attr('width', 0)
        .attr('height', linkWidth)
        .attr('fill', function(d) { return color(d.branch); });

      nodeEnter.append("circle")
          .attr('class', 'markmap-node-circle')
          .attr('cx', state.nodeWidth)
          .attr('stroke', function(d) { return color(d.branch); })
          .attr("r", 1e-6)
          .style("fill", function(d) { return d._children ? color(d.branch) : ''; });

      nodeEnter.append("text")
          .attr('class', 'markmap-node-text')
          .attr("x", state.nodeWidth)
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
        .attr('width', state.nodeWidth + 2);

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
          .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
          .remove();

      nodeExit.select('rect')
        .attr('x', state.nodeWidth)
        .attr('width', 0);

      nodeExit.select("circle")
          .attr("r", 1e-6);

      nodeExit.select("text")
          .style("fill-opacity", 1e-6)
          .attr("x", state.nodeWidth);


      // Update the links…
      var link = svg.selectAll("path.markmap-link")
          .data(links, function(d) { return d.target.id; });

      // Enter any new links at the parent's previous position.
      link.enter().insert("path", "g")
          .attr("class", "markmap-link")
          .attr('stroke', function(d) { return color(d.target.branch); })
          .attr('stroke-width', function(l) {return linkWidth(l.target);})
          .attr("d", function(d) {
            var o = {x: source.x0, y: source.y0 + state.nodeWidth};
            return linkShape({source: o, target: o});
          });

      // Transition links to their new position.
      link.transition()
          .duration(state.duration)
          .attr("d", function(d) {
            var s = {x: d.source.x, y: d.source.y + state.nodeWidth};
            var t = {x: d.target.x, y: d.target.y};
            return linkShape({source: s, target: t});
          });

      // Transition exiting nodes to the parent's new position.
      link.exit().transition()
          .duration(state.duration)
          .attr("d", function(d) {
            var o = {x: source.x, y: source.y + state.nodeWidth};
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
