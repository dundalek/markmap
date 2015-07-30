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

var layouts = {
  tree: function() {
    return d3.layout.tree();
  }
};

var linkShapes = {
  diagonal: function() {
    return d3.svg.diagonal()
      .projection(function(d) { return [d.y, d.x]; });
  }
};

return function init(svg, data, options) {

svg = svg.datum ? svg : d3.select(svg);

var i = 0;
var state = {};

state.height = svg.node().offsetHeight;
state.width = svg.node().offsetWidth;
state.autoFit = true;
state.duration = 750;
state.zoomScale = 1;
state.zoomTranslate = [0, 0];
state.color = d3.scale['category20']();
state.layout = layouts['tree']().size([state.height, state.width]);
state.linkShape = linkShapes['diagonal']();

function updateZoom(translate, scale) {
  state.zoomTranslate = translate;
  state.zoomScale = scale;
  zoom.translate(state.zoomTranslate)
      .scale(state.zoomScale);
  svg.attr("transform", "translate(" + state.zoomTranslate + ")" + " scale(" + state.zoomScale + ")")
}

var zoom = d3.behavior.zoom()
   .on("zoom", function() {
     updateZoom(d3.event.translate, d3.event.scale);
   });

svg = svg
  .call(zoom)
  .append("g");

updateZoom(state.zoomTranslate, state.zoomScale);

traverseHelperNodes(data);
data.children[0].children.forEach(function(d, i) {
  traverseBranchId(d, i);
});

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

update(state.root);

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

function update(source) {

  var offset = state.root.x !== undefined ? state.root.x : state.root.x0;

  // Compute the new tree layout.
  var nodes = state.layout.nodes(state.root).reverse(),
      links = state.layout.links(nodes);

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
    updateZoom(translate, scale);
  }

  //traverseLabelWidth(root, 0);

  // Update the nodes…
  var node = svg.selectAll("g.markmap-node")
      .data(nodes, function(d) { return d.id || (d.id = ++i); });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("g")
      .attr("class", "markmap-node")
      .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
      .on("click", click);

  nodeEnter.append("circle")
      .attr('class', 'markmap-node-circle')
      .attr('stroke', function(d) { return state.color(d.branch); })
      .attr("r", 1e-6)
      .style("fill", function(d) { return d._children ? state.color(d.branch) : "#fff"; });

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
         return d._children ? state.color(d.branch) : "#fff"
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
      .attr('stroke', function(d) { return state.color(d.target.branch); })
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
        return state.linkShape({source: o, target: o});
      });

  // Transition links to their new position.
  link.transition()
      .duration(state.duration)
      .attr("d", state.linkShape);

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
      .duration(state.duration)
      .attr("d", function(d) {
        var o = {x: source.x, y: source.y};
        return state.linkShape({source: o, target: o});
      })
      .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

// Toggle children on click.
function click(d) {
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
  update(d);
}

}
 
}));
