// Screen sizing -----------------------------------------------------------------------
const MIN_WIDTH = 300;
const MIN_HEIGHT = 300;
const MARGINS = {
    'top': 10, 'bottom': 10, 'left': 10, 'right': 10
};

const _width = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;

const _height = window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight;

const WIDTH = d3.max([_width - MARGINS.left - MARGINS.right, MIN_WIDTH]);
const HEIGHT = d3.max([_height - MARGINS.top - MARGINS.bottom - 40, MIN_HEIGHT]);

const verticalConstraints = [2 * MARGINS.top, HEIGHT - 4 * MARGINS.bottom];
const horizontalConstraints = [2 * MARGINS.left, WIDTH - 3 * MARGINS.right];

// Create SVG & DOM structure ----------------------------------------------------------
var svg = d3.select("#main_content_wrap")
    .append("svg")
    .attr('width', WIDTH - MARGINS.right - MARGINS.left)
    .attr('height', HEIGHT - MARGINS.top - MARGINS.bottom)
    .attr('transform', 'translate(' + MARGINS.left + ', ' + MARGINS.top + ')');

// Initialize tooltip
var tooltip = d3.select("body")
    .append("div")
    .append("foreignObject")
    .attr("id", "tooltip");

// Initialize context menu
// var contextMenu = d3.select("body")
//     .append("div")
//     .append("foreignObject")
//     .attr("id", "contextmenu");

// svg.on("click", dismiss_context_menu);

// Initialize Loading screen
var loadingScreen = d3.select("body")
    .append("div")
    .append("foreignObject")
    .attr("id", "loading");

// Initialize info hovers
var connectionlimitinfo = d3.select("body")
    .append("div")
    .append("foreignObject")
    .attr("class", "info")
    .style("text-transform", "none")
    .style("opacity", 1)
    .html((
        "<h3>Connection Limit</h3>" +
        "Controls the maximum number of incoming edges for each node. Think of this " +
        "as a proxy for controlling the branching factor of the graph.<br><br>" +
        "When there are more edges than this limit allows for, the ones with the " +
        "largest disbursement/receipt quantity are displayed."
    ));

d3.select("#connectionlimit-info")
    .on("mouseover", event => show_info_hover(event, connectionlimitinfo))
    .on("mouseout", _ => hide_info_hover(connectionlimitinfo));

var explicitlimitinfo = d3.select("body")
    .append("div")
    .append("foreignObject")
    .attr("class", "info")
    .style("text-transform", "none")
    .style("opacity", 1)
    .html((
        "<h3>Candidate Limit</h3>" +
        "Controls the approximate maximum number of nodes attached to each candidate " +
        "node. Think of this as a proxy for controlling the depth of the graph.<br><br>" +
        "When there are more nodes than this limit allows for, the ones closest to " +
        "the candidate are displayed."
    ));

d3.select("#explicitlimit-info")
    .on("mouseover", event => show_info_hover(event, explicitlimitinfo))
    .on("mouseout", _ => hide_info_hover(explicitlimitinfo));


// Shape sizes -------------------------------------------------------------------------
// Circle nodes
const circleRadius = 10;

// Rect nodes
const rectWidth = 20;
const rectHeight = 20;
const rectX = -10; /* Make x & y -1/2 of width & height so rects are centered */
const rectY = -10;

// Ellipse nodes
const ellipseRx = 14;
const ellipseRy = 7;

// Zoom factors
const primaryHighlightedFactor = 2;
const secondaryHighlightedFactor = 1.5;

// Calculated zoom sizes
let standardNodeSizes = {
    "circle": { "r": circleRadius },
    "rect": { "width": rectWidth, "height": rectHeight, "x": rectX, "y": rectY },
    "ellipse": { "rx": ellipseRx, "ry": ellipseRy }
};
let primaryZoomNodeSizes = {
    "circle": { "r": circleRadius * primaryHighlightedFactor },
    "rect": {
        "width": rectWidth * primaryHighlightedFactor,
        "height": rectHeight * primaryHighlightedFactor,
        "x": rectX * primaryHighlightedFactor,
        "y": rectY * primaryHighlightedFactor
    },
    "ellipse": {
        "rx": ellipseRx * primaryHighlightedFactor,
        "ry": ellipseRy * primaryHighlightedFactor
    }
};
let secondaryZoomNodeSizes = {
    "circle": { "r": circleRadius * secondaryHighlightedFactor },
    "rect": {
        "width": rectWidth * secondaryHighlightedFactor,
        "height": rectHeight * secondaryHighlightedFactor,
        "x": rectX * secondaryHighlightedFactor,
        "y": rectY * secondaryHighlightedFactor
    },
    "ellipse": {
        "rx": ellipseRx * secondaryHighlightedFactor,
        "ry": ellipseRy * secondaryHighlightedFactor
    }
};

// Forces ------------------------------------------------------------------------------
const standardLinkForceDistance = 200;
const zoomLinkForceDistance = 350;

console.log("loading data", new Date().toLocaleTimeString("en-US"))
show_loading();
// Load in data ------------------------------------------------------------------------
Promise.all([
    d3.json("../data/nodes.json"),
    d3.json("../data/edges.json")
]).then(function (data) {
    dismiss_loading();
    console.log("data loaded!", new Date().toLocaleTimeString("en-US"))
    let [raw_nodes, raw_edges] = data;

    let nodes = new Array();
    let edges = new Array();

    d3.select("#connectionlimit").on("input", function () {
        // Update the "Connection Limit = " text on slide
        d3.select("#connectionlimit-value").node().textContent = this.value;
    });

    d3.select("#explicitlimit").on("input", function () {
        // Update the "Explicit Limit = " text on slide
        d3.select("#explicitlimit-value").node().textContent = this.value;
    });

    d3.select("#submit").on("click", function () {
        // Redraw the graph on button click
        show_loading();
        unpin_all_nodes();
        update_connection_limit_redraw(
            d3.select("#connectionlimit").node().value,
            d3.select("#explicitlimit").node().value
        );
        dismiss_loading();
    });

    // Make the force graph ------------------------------------------------------------
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(edges).distance(standardLinkForceDistance).id(d => d.id))
        .force("center", d3.forceCenter(WIDTH / 2, HEIGHT / 2))
        .force("x", d3.forceX())
        .force("y", d3.forceY())
        .force("charge", d3.forceManyBody().strength(-100))
        .force("collision", d3.forceCollide().radius(15))
        // .alphaTarget(1)
        .velocityDecay(.3)
        // .alphaDecay(.1)
        .on("tick", ticked);

    // Define the arrowhead
    svg.append('defs')
        .append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '-0 -5 10 10')
        .attr('refX', 13)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 25)
        .attr('markerHeight', 25)
        .attr('xoverflow', 'visible')
        .append('svg:path')
        .attr('d', 'M -7,-5 L 3 ,0 L -7,5');

    // Edges
    var link = svg.append("g")
        .attr("class", "edges")
        .selectAll("path")

    // Nodes
    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll(".node")

    // Pin & unpin all nodes -----------------------------------------------------------
    d3.select("#pinall").on("click", pin_all_nodes);
    d3.select("#unpinall").on("click", unpin_all_nodes);

    // Draw the node graph -------------------------------------------------------------
    update_connection_limit_redraw(1, 5); // This is the default value for the connection & explicit limit

    // Node & Edge limiters ------------------------------------------------------------
    function update_connection_limit_redraw(max_connections, explicit_limit) {
        console.log("filtering through for connection limit", new Date().toLocaleTimeString("en-US"))
        d3.select("#connectionlimit-value").text(max_connections);
        d3.select("#connectionlimit").property("value", max_connections);

        d3.select("#explicitlimit-value").text(explicit_limit);
        d3.select("#explicitlimit").property("value", explicit_limit);

        let limited_nodes = new Array();
        let limited_edges = new Array();

        candidates = Array.from(["P80000722", "P80001571"]); // hard-code biden & trump IDs to not get extraneous candidates
        candidates.forEach(candidate => {
            let frontier_nodes = new Array();
            frontier_nodes.push(candidate);
            let explored_nodes = new Set();
            while ((frontier_nodes.length > 0) && (explored_nodes.size <= explicit_limit)) {
                var current_node_id = frontier_nodes.pop();
                explored_nodes.add(current_node_id);

                var top_connections = raw_edges
                    .filter(e => {
                        if (e.target.constructor === ({}).constructor) {
                            return e.target.id == current_node_id;
                        } else {
                            return e.target == current_node_id;
                        }
                    })
                    .sort((a, b) => b.quantity - a.quantity)
                    .slice(0, max_connections);

                frontier_nodes.push(
                    ...top_connections.map(e => {
                        if (e.source.constructor === ({}).constructor) {
                            return e.source.id;
                        } else {
                            return e.source;
                        }
                    })
                        .filter(nid => !explored_nodes.has(nid) && !frontier_nodes.includes(nid))
                );

                limited_edges.push(...top_connections);
                limited_nodes.push(...raw_nodes.filter(n => n.id == current_node_id));
            }
        });

        // // Need to make sure you also capture the nodes for the leaf endpoints
        limited_nodes.push(...raw_nodes.filter(n => limited_edges.map(e => {
            if (e.source.constructor === ({}).constructor) {
                return e.source.id;
            } else {
                return e.source;
            }
        }).includes(n.id)));

        nodes = unique(limited_nodes, ["id"]);
        edges = limited_edges;

        console.log("connection limiting filtering complete (", nodes.length, " nodes, ", edges.length, " edges)", new Date().toLocaleTimeString("en-US"))
        // console.log("nodes", nodes);
        // console.log("edges", edges)

        console.log("redrawing", new Date().toLocaleTimeString("en-US"))
        redraw();
        console.log("redraw complete", new Date().toLocaleTimeString("en-US"))
    }

    function redraw() {
        // Remove/add nodes
        node = node.data(nodes, function (d) { return d.id });
        node.exit().remove();
        node.selectAll("*").remove();
        node = node.enter()
            .append("g")
            .attr("class", d => {
                cls = "viznode ";
                if (d.type == "CAN") {
                    return cls + "candidate";
                } else if (d.type == "IND") {
                    return cls + "individual";
                } else {
                    return cls + "committee";
                }
            })
            .attr("id", d => d.id)
            .merge(node);

        // Candidate node shapes
        svg.selectAll(".viznode.candidate")
            .append("rect")
            .attr("id", d => ("shape-" + d.id))
            .attr("class", "candidate")
            .attr("x", rectX)
            .attr("y", rectY)
            .attr("width", rectWidth)
            .attr("height", rectHeight);

        // Committee node shapes
        svg.selectAll(".viznode.committee")
            .append("circle")
            .attr("id", d => ("shape-" + d.id))
            .attr("class", "committee")
            .attr("r", circleRadius);

        // Individual node shapes
        svg.selectAll(".viznode.individual")
            .append("ellipse")
            .attr("id", d => ("shape-" + d.id))
            .attr("class", "individual")
            .attr("rx", ellipseRx)
            .attr("ry", ellipseRy);

        // Node interactions
        svg.selectAll(".viznode")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended)
            )
            .on("mouseover", function (event, node) {
                display_node_tooltip(event, node);
                highlight_node(node, edges);
            })
            .on("mouseout", function (event, node) {
                hide_tooltip(event, node);
                unhighlight_node(node, edges);
            })
            .on("mousemove", move_tooltip)
            .on("dblclick", unpin_node)
            .on("contextmenu", function (event, node) {
                event.preventDefault();
                hide_tooltip();
                display_context_menu(event);
            })

        // Remove/add edges
        link = link.data(edges, function (d) { return d.source.id + "-" + d.target.id; });
        link.exit().remove();
        link = link.enter()
            .append("path")
            .attr('stroke', '#666666')
            .attr('fill', 'transparent')
            .attr("marker-end", "url(#arrowhead)")
            .merge(link);

        // Edge interactions
        svg.selectAll(".edges path")
            .on("mouseover", display_edge_tooltip)
            .on("mouseout", hide_tooltip)
            .on("mousemove", move_tooltip);

        // Update and restart the simulation.
        simulation.nodes(nodes);
        simulation.force("link").links(edges);
        simulation.alpha(0.3).restart();
    }

    // Tick function -------------------------------------------------------------------
    function ticked() {
        nodes = nodes.map(n => {
            n.x = constrain(n.x, horizontalConstraints);
            n.y = constrain(n.y, verticalConstraints);
            return n;
        });

        link.attr("d", function (d) {
            // console.log(d.source, d.target)
            return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y
        })
        node.attr("transform", d => "translate(" + d.x + ", " + d.y + ")");
    };

    // Pin & Unpin All Nodes -----------------------------------------------------------
    function pin_all_nodes() {
        console.log("pin all")
        nodes.map(n => {
            n.fx = n.x;
            n.fy = n.y;
            svg.select("#shape-" + n.id)
                .classed("pinned", true);
        })
    }

    function unpin_all_nodes() {
        console.log("unpin all")
        svg.selectAll(".viznode")
            .classed("pinned", false);
        nodes.map(n => {
            n.fx = null;
            n.fy = null;
        })
        redraw();
    }

    // Node interaction controllers ----------------------------------------------------
    function dragstarted(event, node) {
        // console.log("dragstarted", event.detail)
        if (!event.active) simulation.alphaTarget(0.3).restart();
        node.fx = node.x;
        node.fy = node.y;
    };

    function dragged(event, node) {
        node.fx = constrain(event.x, horizontalConstraints);
        node.fy = constrain(event.y, verticalConstraints);

        move_tooltip(event.sourceEvent);
    };

    function dragended(event, node) {
        // console.log("dragended", event.detail)
        if (!event.active) simulation.alphaTarget(0);
        if (node.fixed == true) {
            node.fx = node.x;
            node.fy = node.y;
        }
        else {
            node.fx = node.x;
            node.fy = node.y;
        }

        d3.select("#shape-" + node.id)
            .classed("pinned", true);
    };

    function unpin_node(event, node) {
        node.fx = null
        node.fy = null

        svg.select("#shape-" + node.id)
            .classed("pinned", false);
    };

    // Node highlighter controllers ----------------------------------------------------
    function highlight_node(node, edges) {
        // Change sizes
        change_node_size(node.id, primaryZoomNodeSizes);
        let neighbors = get_neighboring_node_ids(node.id, edges);
        let neighborIds = neighbors.map(d => d.id);
        neighborIds.forEach(neighborId => change_node_size(neighborId, secondaryZoomNodeSizes));

        // Change classes
        svg.select("#shape-" + node.id)
            .classed("primaryHighlighted", true);

        let groupedNeighbors = d3.group(neighbors, d => d.direction);
        let downstream = groupedNeighbors.get("downstream");
        let upstream = groupedNeighbors.get("upstream");
        if (downstream) {
            svg.selectAll("#shape-" + downstream.map(d => d.id).join(",#shape-"))
                .classed("secondaryHighlighted downstream", true);
        };
        if (upstream) {
            svg.selectAll("#shape-" + upstream.map(d => d.id).join(",#shape-"))
                .classed("secondaryHighlighted upstream", true);
        };

        // Fix location of highlighted node
        node.fx = node.x;
        node.fy = node.y;


        // Update force link distance
        simulation.force("link").distance(d => {
            let containsPrimary = (node.id == d.source.id || node.id == d.target.id);
            let containsNeighbor = (neighborIds.includes(d.source.id) || neighborIds.includes(d.target.id));

            if (containsPrimary && containsNeighbor) {
                return zoomLinkForceDistance
            } else return standardLinkForceDistance;
        });
        simulation.alpha(.2).restart();
    };

    function unhighlight_node(node, edges) {
        // Change sizes
        change_node_size(node.id, standardNodeSizes);
        let neighborIds = get_neighboring_node_ids(node.id, edges);
        neighborIds.map(d => d.id)
            .forEach(neighborId => change_node_size(neighborId, standardNodeSizes))

        // Change classes
        svg.select("#shape-" + node.id)
            .classed("primaryHighlighted", false);

        let groupedNeighborIds = d3.group(neighborIds, d => d.direction);
        let downstream = groupedNeighborIds.get("downstream");
        let upstream = groupedNeighborIds.get("upstream");
        if (downstream) {
            svg.selectAll("#shape-" + downstream.map(d => d.id).join(",#shape-"))
                .classed("secondaryHighlighted downstream", false);
        }
        if (upstream) {
            svg.selectAll("#shape-" + upstream.map(d => d.id).join(",#shape-"))
                .classed("secondaryHighlighted upstream", false);
        }

        // Unfix location if wasn't previously pinned
        if (!svg.select("#shape-" + node.id).classed("pinned")) {
            node.fx = null;
            node.fy = null;
        };

        // Reset force link distance
        simulation.force("link").distance(standardLinkForceDistance);
        simulation.alpha(.2).restart()
    };
}).catch(function (error) {
    console.log(error);
});

function unique(array, attributes) {
    // Get unique objecs in `array` based on comparison of all `attributes`
    var uniques = []
    array.filter(function (item) {
        var idx = uniques.findIndex(i => attributes.every(a => i[a] == item[a]));

        if (idx <= -1) {
            uniques.push(item);
        }
        return null;
    });
    return uniques;
};

function constrain(x, limits) {
    let [min, max] = limits;
    return d3.max([d3.min([x, max]), min])
}

// Tooltip controllers -----------------------------------------------------------------
function tooltipTimeout(elapsed) {
    if (elapsed > 3500) {
        hide_tooltip();
        tooltipTimer.stop();
    };
}

const tooltipTimer = d3.timer(tooltipTimeout);

function display_node_tooltip(event, data) {
    tooltip
        .style("transition-delay", "0s")
        .style("opacity", 1)
        .html((
            "<h3>" + data.name + "</h3>" +
            "Type: " + data.type + "<br>" +
            "ID: " + data.id + "<br>"
        ));

    tooltipTimer.restart(tooltipTimeout)
};

function hide_tooltip() {
    // console.log("mouseout", event.detail)
    tooltip
        .style("transition-delay", "0.5s")
        .style("opacity", 0)
        .style("left", -10000 + "px") // Move tooltip way out of way
        .style("top", -10000 + "px");
    tooltipTimer.stop();
};

function move_tooltip(event) {
    // console.log("mousemove", event.detail)
    tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px");
    tooltipTimer.restart(tooltipTimeout);
}

// Edge tooltip controllers
const dateParser = d3.timeParse("%Y-%m-%dT%H:%M:%S.%L%L%Z");
const dateFormatter = d3.timeFormat("%B %-e, %Y %I:%M %p");
const currencyFormatter = d3.format("$,.2f")

function display_edge_tooltip(event, data) {
    if (data.date === null) {
        dateString = "null";
    } else if (dateParser(data.date) === null) {
        dateString = "<parse error>";
    } else {
        dateString = dateFormatter(dateParser(data.date));
    }

    tooltip.style("transition-delay", "0s")
        .style("opacity", 1)
        .html((
            "Source: " + data.source.name + "<br>" +
            "Target: " + data.target.name + "<br>" +
            "Quantity: " + currencyFormatter(data.quantity) + "<br>" +
            "Date: " + dateString
        ));
};

// Context menu controllers ------------------------------------------------------------
function display_context_menu(event) {
    contextMenu
        .style("opacity", 1)
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY) + "px")
        .html(
            "context menu<br>context menu"
        );
};

function dismiss_context_menu() {
    contextMenu
        .style("left", -10000 + "px")
        .style("top", -10000 + "px")
        .style("opacity", 0);
}

// Node highlighter helpers ------------------------------------------------------------
function get_neighboring_node_ids(nodeId, edges) {
    let neighborEdges = edges.filter(e => (e.source.id == nodeId || e.target.id == nodeId));
    let neighborIds = d3.map(neighborEdges, function (edge) {
        if ((edge.source.id == nodeId) && (edge.target.id != nodeId)) {
            return { "id": edge.target.id, "direction": "downstream" };
        } else if ((edge.source.id != nodeId) && (edge.target.id == nodeId)) {
            return { "id": edge.source.id, "direction": "upstream" };
        } else {
            throw Error("Something weird going on with getting neighboring node IDs");
        }
    });
    return neighborIds;
};

function change_node_size(nodeId, sizes) {
    let nodeShape = svg.select("#shape-" + nodeId);
    let constructor = nodeShape.node().constructor;

    if (constructor === SVGCircleElement) {
        nodeShape
            .attr("r", sizes.circle.r);
    } else if (constructor === SVGEllipseElement) {
        nodeShape
            .attr("rx", sizes.ellipse.rx)
            .attr("ry", sizes.ellipse.ry);
    } else if (constructor === SVGRectElement) {
        nodeShape
            .attr("x", sizes.rect.x)
            .attr("y", sizes.rect.y)
            .attr("width", sizes.rect.width)
            .attr("height", sizes.rect.height);
    } else {
        throw Error("Unknown shape constructor: " + constructor.name);
    }
};

// Loading screen ----------------------------------------------------------------------
function show_loading() {
    console.log("show loading")
    loadingScreen
        .style("opacity", 1)
        .style("left", WIDTH / 2 + "px")
        .style("top", HEIGHT / 2 + "px")
        .html("Loading...");
}

function dismiss_loading() {
    console.log("dismiss loading")
    loadingScreen
        .style("opacity", 0);
}

// Information about sliders -----------------------------------------------------------
function show_info_hover(event, element) {
    element
        .style("left", (event.pageX + 30) + "px")
        .style("top", (event.pageY) + "px")
        .style("transition-delay", "0s");
}

function hide_info_hover(element) {
    element
        .style("transition-delay", "0.5s")
        .style("left", -10000 + "px") // Move way out of way
        .style("top", -10000 + "px");
}