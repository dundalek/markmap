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

function traverseHelperNodes(node) {
  var children = node.children;
  if (children && children.length > 0) {
    var tmp = {
      name: '',
      children: children
    };
    node.children = [tmp];
  } else {
    node.children = [{
      name: ''
    }];
  }
  if (children) {
    children.forEach(traverseHelperNodes);
  }
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

assign(Markmap.prototype, {
  defaults: function() {
    return {
      autoFit: true,
      duration: 750,
      zoomScale: 1,
      zoomTranslate: [0, 0],
      layout: 'tree',
      color: 'category20',
      linkShape: 'diagonal'
    };
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
  colors: d3.scale,
  init: function(svg, data, options) {
    options = options || {};

    svg = svg.datum ? svg : d3.select(svg);

    this.helpers = {};
    this.i = 0;
    var state = this.state = {};
    this.set(this.defaults());
    state.height = svg.node().offsetHeight;
    state.width = svg.node().offsetWidth;
    this.set(options);

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
    traverseHelperNodes(data);
    if (data.children && data.children[0] && data.children[0].children) {
      data.children[0].children.forEach(function(d, i) {
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
    source = source || this.state.root;
    var res = this.layout(source);
    this.render(source, res.nodes, res.links);
    return this;
  },
  layout: function(source) {
    var state = this.state;
    var layout = this.helpers.layout;

    var offset = state.root.x !== undefined ? state.root.x : state.root.x0;

    // Compute the new tree layout.
    var nodes = layout.nodes(state.root).reverse(),
        links = layout.links(nodes);

    // Normalize
    var ratio = 20 / traverseMinDistance(state.root);
    offset -= state.root.x * ratio;

    nodes.forEach(function(d) {
      d.y = d.depth * 180;
      d.x = d.x * ratio + offset;
    });

    if (state.autoFit) {
      var minX = d3.min(nodes, function(d) {return d.x;});
      var minY = d3.min(nodes, function(d) {return d.y;});
      var maxX = d3.max(nodes, function(d) {return d.x;});
      var maxY = d3.max(nodes, function(d) {return d.y;});
      var realHeight = maxX - minX;
      var realWidth = maxY - minY;
      var scale = Math.min(state.height / realHeight, state.width / realWidth, 1);
      var translate = [(state.width-realWidth*scale)/2-minY*scale, (state.height-realHeight*scale)/2-minX*scale];
      this.updateZoom(translate, scale);
    }

    //traverseLabelWidth(root, 0);

    return {
      nodes: nodes,
      links: links
    };
  },
  render: function(source, nodes, links) {
    var svg = this.svg;
    var state = this.state;
    var color = this.helpers.color;
    var linkShape = this.helpers.linkShape;
    
    // Update the nodes…
    var node = svg.selectAll("g.markmap-node")
        .data(nodes, function(d) { return d.id || (d.id = ++this.i); }.bind(this));

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
        .attr("class", "markmap-node")
        .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
        .on("click", this.click.bind(this));

    nodeEnter.append("circle")
        .attr('class', 'markmap-node-circle')
        .attr('stroke', function(d) { return color(d.branch); })
        .attr("r", 1e-6)
        .style("fill", function(d) { return d._children ? color(d.branch) : "#fff"; });

    nodeEnter.append("text")
        .attr('class', 'markmap-node-text')
        .attr("x", function(d) { return  10; })
        .attr("dy", "-0.5em")
        .attr("text-anchor", function(d) { return "start"; })
        .text(function(d) { return d.name; })
        .style("fill-opacity", 1e-6);

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(state.duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

    nodeUpdate.select("circle")
        .attr("r", 4.5)
        .style("fill", function(d) {
           return d._children ? color(d.branch) : "#fff"
        })
        .style('display', function(d) {
          var isLabelNode = d.name !== '' && d.children && d.children.length === 1 && d.children[0].name === '';
          var hasChildren = d.children || d._children;
          return isLabelNode || !hasChildren ? 'none' : 'inline';
        });

    nodeUpdate.select("text")
        .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(state.duration)
        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
        .remove();

    nodeExit.select("circle")
        .attr("r", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    // Update the links…
    var link = svg.selectAll("path.markmap-link")
        .data(links, function(d) { return d.target.id; });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "markmap-link")
        .attr('stroke', function(d) { return color(d.target.branch); })
        .attr('stroke-width', function(l) {
          var d = l.target;
          var depth = d.depth;
          if (d.name !== '' && d.children && d.children.length === 1 && d.children[0].name === '') {
            depth += 1;
          }
          return Math.max(8 - depth, 1.5);
        })
        .attr("d", function(d) {
          var o = {x: source.x0, y: source.y0};
          return linkShape({source: o, target: o});
        });

    // Transition links to their new position.
    link.transition()
        .duration(state.duration)
        .attr("d", linkShape);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(state.duration)
        .attr("d", function(d) {
          var o = {x: source.x, y: source.y};
          return linkShape({source: o, target: o});
        })
        .remove();

    // Stash the old positions for transition.
    nodes.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  },
  // Toggle children on click.
  click: function(d) {
    if (d.name !== '' && d.children && d.children.length === 1 && d.children[0].name === '') {
      d = d.children[0];
    }
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
