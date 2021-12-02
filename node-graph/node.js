// Screen sizing -----------------------------------------------------------------------
const MIN_WIDTH = 300;
const MIN_HEIGHT = 800;
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
const HEIGHT = d3.max([_height - MARGINS.top - MARGINS.bottom - 130, MIN_HEIGHT]);

const verticalConstraints = [MARGINS.top + 30, HEIGHT - MARGINS.bottom - 30];
const horizontalConstraints = [MARGINS.left + 10, WIDTH - MARGINS.right - 30];

const CANDIDATE_IDS = Array.from(["P80000722", "P80001571"]); // hard-code biden & trump IDs to not get extraneous candidates

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

// Initialize info hovers --------------------------------------------------------------
// Connection limit
var connectionlimitinfo = d3.select("body")
    .append("div")
    .append("foreignObject")
    .attr("class", "info")
    .html((
        "<h3>Connection Limit</h3>" +
        "Controls the maximum number of incoming edges for each node. Think of this " +
        "as a proxy for controlling the branching factor of the graph.<br><br>" +
        "When there are more edges than this limit allows for, the top ones are " +
        "displaed, sorted by the user selection of \"Quantity\" or \"PageRank\"."
    ));

d3.select("#connectionlimit-info")
    .on("mouseover", event => show_info_hover(event, connectionlimitinfo))
    .on("mouseout", _ => hide_info_hover(connectionlimitinfo));

// Order by
var orderbyinfo = d3.select("body")
    .append("div")
    .append("foreignObject")
    .attr("class", "info")
    .html((
        "<h3>Order By</h3>" +
        "Controls how to rank the nodes when only showing a subset. Can either sort " +
        "by largest disbursement/receipt quantity or by the node's PageRank.<br><br>" +
        "<b>Warning</b>: Sorting by page rank can be slow, and often yields very " +
        "similar results to sorting by quantity."
    ));

d3.select("#connectionorderby-info")
    .on("mouseover", event => show_info_hover(event, orderbyinfo))
    .on("mouseout", _ => hide_info_hover(orderbyinfo));

// Node limit
var explicitlimitinfo = d3.select("body")
    .append("div")
    .append("foreignObject")
    .attr("class", "info")
    .html((
        "<h3>Node Limit</h3>" +
        "Controls the approximate maximum number of nodes attached to each candidate " +
        "node. Think of this as a proxy for controlling the depth of the graph.<br><br>" +
        "When there are more nodes than this limit allows for, the ones closest to " +
        "the candidate are displayed."
    ));

d3.select("#explicitlimit-info")
    .on("mouseover", event => show_info_hover(event, explicitlimitinfo))
    .on("mouseout", _ => hide_info_hover(explicitlimitinfo));

// Charge strength
var chargestrengthinfo = d3.select("body")
    .append("div")
    .append("foreignObject")
    .attr("class", "info")
    .html((
        "<h3>Charge Strength</h3>" +
        "Controls the magnitude of the node graph charge force strength. Think of this " +
        " as the size of the mini \"explosion\" that gets all of the nodes moving to start.<br><br>" +
        "This may need to be adjusted as you increase/decrease the number of nodes to " +
        "get a good looking layout."
    ));

d3.select("#chargestrength-info")
    .on("mouseover", event => show_info_hover(event, chargestrengthinfo))
    .on("mouseout", _ => hide_info_hover(chargestrengthinfo));

// Alpha
var alphainfo = d3.select("body")
    .append("div")
    .append("foreignObject")
    .attr("class", "info")
    .html((
        "<h3>Alpha</h3>" +
        "The alpha parameter can be thought of as a way to subdue the movement in " +
        "the graph. Set it to 0 to have no movement.<br><br>A higher alpha will " +
        "cause the nodes to \"float around\" for longer, but will generally yield a " +
        "better visual solution."
    ));

d3.select("#chargealpha-info")
    .on("mouseover", event => show_info_hover(event, alphainfo))
    .on("mouseout", _ => hide_info_hover(alphainfo));

// Pin candidates
var pincandidatesinfo = d3.select("body")
    .append("div")
    .append("foreignObject")
    .attr("class", "info")
    .html((
        "<h3>Pin Candidates</h3>" +
        "Whether to pin candidates to the top of the screen for easier viewing."
    ));

d3.select("#pincandidates-info")
    .on("mouseover", event => show_info_hover(event, pincandidatesinfo))
    .on("mouseout", _ => hide_info_hover(pincandidatesinfo));

// Make sure they are initially hidden
hide_info_hover(connectionlimitinfo);
hide_info_hover(orderbyinfo);
hide_info_hover(explicitlimitinfo);
hide_info_hover(chargestrengthinfo);
hide_info_hover(alphainfo);
hide_info_hover(pincandidatesinfo);

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

// Legends -----------------------------------------------------------------------------
var legend = d3.select("#main_content")
    .append("svg")
    .attr("width", WIDTH)
    .attr("height", 90)
    .attr("id", "legend")
    .append("g")
    .attr("transform", "translate(20, 20)");

// Node legend
var nodeKeys = ["Candidate", "Committee/Organization", "Individual"];

var nodeColorScale = d3.scaleOrdinal()
    .domain(nodeKeys)
    .range(["orange", "mediumpurple", "teal"]);

var nodeSymbolScale = d3.scaleOrdinal()
    .domain(nodeKeys)
    .range([
        d3.symbol().type(d3.symbolSquare)(),
        d3.symbol().type(d3.symbolCircle)(),
        ( // Custom ellipse symbol
            "M4.51351666838205,0" + // Move to right edge
            "A4.51351666838205,2.256758334,0,1,1,-4.51351666838205,0" + // half arc
            "A4.51351666838205,2.256758334,0,1,1,4.51351666838205,0" // other half arc
        )
    ]);

var nodeLegend = d3.legendSymbol()
    .scale(nodeSymbolScale)
    .orient("vertical")
    .title("Node Legend")

legend.append("g")
    .attr("id", "node-legend")
    .call(nodeLegend)
    .selectAll(".swatch")
    .attr("fill", d => nodeColorScale(d));

// Highlight legend
var highlightKeys = ["Highlighted", "Target", "Source"];

var highlightColorScale = d3.scaleOrdinal()
    .domain(nodeKeys)
    .range(["tomato", "black", "black"]);

var highlightSymbolScale = d3.scaleOrdinal()
    .domain(highlightKeys)
    .range([
        "M0,-2.5 H20 V2.5 H0 V-2.5",
        "M0,-1.5 H8 V1.5 H0 V-1.5 M12,-2 H20 V1.5 H12 V-1.5",
        "M0,-1 H20 V1 H0 V-1"
    ]);

var highlightLegend = d3.legendSymbol()
    .scale(highlightSymbolScale)
    .orient("vertical")
    .title("Highlight Legend")

legend.append("g")
    .attr("transform", "translate(300, 0)")
    .attr("id", "highlight-legend")
    .call(highlightLegend)
    .selectAll(".swatch")
    .attr("fill", d => highlightColorScale(d));

// Load in data ------------------------------------------------------------------------
console.log("loading data", new Date().toLocaleTimeString("en-US"))
show_loading();

Promise.all([
    d3.json("../data/nodes.json"),
    d3.json("../data/edges.json")
]).then(function (data) {
    dismiss_loading();
    console.log("data loaded!", new Date().toLocaleTimeString("en-US"))
    let [raw_nodes, raw_edges] = data;

    let nodes = new Array();
    let edges = new Array();

    // User settings -------------------------------------------------------------------
    // Update values as you interact
    d3.select("#connectionlimit").on("input", function () {
        d3.select("#connectionlimit-value").node().textContent = this.value;
    });

    d3.select("#explicitlimit").on("input", function () {
        d3.select("#explicitlimit-value").node().textContent = this.value;
    });

    d3.select("#chargestrength").on("input", function () {
        d3.select("#chargestrength-value").node().textContent = this.value;
    });

    d3.select("#chargealpha").on("input", function () {
        d3.select("#chargealpha-value").node().textContent = Number(this.value).toFixed(2);
    });

    // Redraw when you hit button
    d3.select("#submit").on("click", function () {
        // Redraw the graph on button click
        show_loading();
        unpin_all_nodes();
        update_connection_limit_redraw(
            connection_limit = d3.select("#connectionlimit").node().value,
            explicit_limit = d3.select("#explicitlimit").node().value,
            charge_strength = d3.select("#chargestrength").node().value,
            alpha = d3.select("#chargealpha").node().value,
            pin_candidates = (d3.select("#pincandidates").node().checked),
            sort_by_pagerank = d3.select("#pagerank").node().checked,
        );
        dismiss_loading();
    });

    // Make the force graph ------------------------------------------------------------
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(edges).distance(standardLinkForceDistance).id(d => d.id))
        .force("center", d3.forceCenter(WIDTH / 2, HEIGHT / 2))
        .force("y", d3.forceY())
        .force("collision", d3.forceCollide().radius(15))
        .velocityDecay(.3)
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
    update_connection_limit_redraw(
        max_connections = 1,
        explicit_limit = 5,
        charge_strength = 800,
        alpha = "0.70",
        pin_candidates = (d3.select("#pincandidates").node().checked),
        sort_by_pagerank = d3.select("#pagerank").node().checked,
    ); // This is the default values for the user settings

    // Node & Edge limiters ------------------------------------------------------------
    function update_connection_limit_redraw(max_connections, explicit_limit, charge_strength, alpha, pin_candidates, sort_by_pagerank) {
        console.log("filtering through for connection limit", new Date().toLocaleTimeString("en-US"))

        // Initialize all user values
        d3.select("#connectionlimit-value").text(max_connections);
        d3.select("#connectionlimit").property("value", max_connections);

        d3.select("#explicitlimit-value").text(explicit_limit);
        d3.select("#explicitlimit").property("value", explicit_limit);

        d3.select("#chargestrength-value").text(charge_strength);
        d3.select("#chargestrength").property("value", charge_strength);

        d3.select("#chargealpha-value").text(alpha);
        d3.select("#chargealpha").property("value", alpha);

        // Filter through based on what user selected
        let limited_nodes = new Array();
        let limited_edges = new Array();

        CANDIDATE_IDS.forEach((candidate, index) => {
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
                    .sort((a, b) => {
                        if (sort_by_pagerank) {
                            var page_rank_a = 0;
                            if (a.target.constructor === ({}).constructor) {
                                page_rank_a = a.target.page_rank;
                            } else {
                                page_rank_a = raw_nodes.filter(n => n.id == a.target)[0].page_rank;
                            }

                            var page_rank_b = 0;
                            if (b.target.constructor === ({}).constructor) {
                                page_rank_b = b.target.page_rank;
                            } else {
                                page_rank_b = raw_nodes.filter(n => n.id == b.target)[0].page_rank;
                            }
                            return page_rank_b - page_rank_a;
                        } else {
                            return b.quantity - a.quantity;
                        }
                    })
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
                limited_nodes.push(
                    ...raw_nodes.filter(n => n.id == current_node_id)
                        .map(n => {
                            n.associated_candidate = index;
                            return n;
                        })
                );
            }
        });

        // // Need to make sure you also capture the nodes for the leaf endpoints
        limited_nodes.push(
            ...raw_nodes
                .filter(n => limited_edges.map(e => {
                    if (e.source.constructor === ({}).constructor) {
                        return e.source.id;
                    } else {
                        return e.source;
                    }
                }).includes(n.id))
                .map(n => {
                    n.associated_candidate = CANDIDATE_IDS.length;
                    return n;
                })
        );

        nodes = unique(limited_nodes, ["id"]);
        edges = limited_edges;

        console.log("connection limiting filtering complete (", nodes.length, " nodes, ", edges.length, " edges)", new Date().toLocaleTimeString("en-US"))

        console.log("redrawing", new Date().toLocaleTimeString("en-US"))
        redraw(charge_strength, alpha, pin_candidates);
        console.log("redraw complete", new Date().toLocaleTimeString("en-US"))
    }

    function redraw(charge_strength, alpha, pin_candidates) {
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
            .on("dblclick", unpin_node);
        // .on("contextmenu", function (event, node) {
        //     event.preventDefault();
        //     hide_tooltip();
        //     display_context_menu(event);
        // })

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
        if (pin_candidates) {
            pin_candidates_to_top();
        }

        simulation.nodes(nodes);
        simulation.force("link").links(edges);

        let horizontal_spacing = WIDTH / (CANDIDATE_IDS.length + 1);
        simulation
            .force("charge", d3.forceManyBody().strength(Number(-charge_strength)))
            .force("x", d3.forceX().x(n => horizontal_spacing * (n.associated_candidate + 1)))
            .alpha(Number(alpha))
            .restart();
    }

    // Tick function -------------------------------------------------------------------
    function ticked() {
        nodes = nodes.map(n => {
            n.x = constrain(n.x, horizontalConstraints);
            n.y = constrain(n.y, verticalConstraints);
            return n;
        });

        link.attr("d", function (d) {
            return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;

            // var dx = d.target.x - d.source.x,
            //     dy = d.target.y - d.source.y,
            //     dr = Math.sqrt(dx * dx + dy * dy);
            // return "M" +
            //     d.source.x + "," +
            //     d.source.y + "A" +
            //     dr + "," + dr + " 0 0,1 " +
            //     d.target.x + "," +
            //     d.target.y;
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
        redraw(
            charge_strength = d3.select("#chargestrength").node().value,
            alpha = d3.select("#chargealpha").node().value,
            pin_candidates = false,
        );
    }

    function pin_candidates_to_top() {
        let horizontal_spacing = WIDTH / (CANDIDATE_IDS.length + 1);

        nodes.filter(n => CANDIDATE_IDS.includes(n.id))
            .forEach((node, index) => {
                svg.select("#shape-" + node.id)
                    .classed("pinned", true);

                node.fx = horizontal_spacing * (index + 1);
                node.fy = 10;
            })
    }

    // Node interaction controllers ----------------------------------------------------
    function dragstarted(event, node) {
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
        simulation
            .alpha(.05)
            .restart();
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
        simulation
            .alpha(.05)
            .restart()
    };

    // To dislpay tooltip
    function display_node_tooltip(event, data) {
        // Baseline display
        var display_str = (
            "<h3>" + data.name + "</h3>" +
            "Type: " + data.type + "<br>" +
            "ID: " + data.id + "<br>"
        );

        // Show total reciepts & disbursements
        if (data.type != "CAN" && data.type != "IND") {
            let receipts = currencyFormatter(data.receipts);
            let disbursements = currencyFormatter(data.disbursements);
            display_str = display_str + "Total Receipts: " + receipts + "<br>" + "Total Disbursements: " + disbursements + "<br>";
        }

        // Show related committees
        let related_ids = data.similar_committees;
        if (related_ids != undefined) {
            let related = raw_nodes
                .filter(n => related_ids.includes(n.id) && n.id != data.id)
                .sort((a, b) => related_ids.indexOf(a.id) - related_ids.indexOf(b.id))
                .slice(0, 5)
                .map((n, index) => (index + 1) + ". " + n.name + " (" + n.id + ")")
                .join("<br>&emsp;");

            let related_info = (
                "<b>* Based primarily on occupactional makeup of donors (as well as " +
                "total number & quantity of contributions, age of committee, and " +
                "percent funded by individuals)</b>"
            );

            display_str = (
                display_str + "<br><h4>Top 5 Similar Committees*</h4>&emsp;" +
                related + "<br><br>" + related_info
            );
        }

        // Show page rank
        if (data.type != "CAN" && data.type != "IND") {
            display_str = display_str + "<br><br>PageRank: " + scientificNotationFormatter(data.page_rank);
        }

        // Display the tooltip
        tooltip
            .style("transition-delay", "0s")
            .style("opacity", 1)
            .html(display_str);

        tooltipTimer.restart(tooltipTimeout)
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
    if (elapsed > 10_000) { // ms
        hide_tooltip();
        tooltipTimer.stop();
    };
}

const tooltipTimer = d3.timer(tooltipTimeout);

function hide_tooltip() {
    tooltip
        .style("transition-delay", "0.5s")
        .style("opacity", 0)
        .style("left", -10000 + "px") // Move tooltip way out of way
        .style("top", -10000 + "px");
    tooltipTimer.stop();
};

function move_tooltip(event) {
    tooltip
        .style("opacity", 1)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px");
    tooltipTimer.restart(tooltipTimeout);
}

// Edge tooltip controllers
const dateParser = d3.timeParse("%Y-%m-%dT%H:%M:%S.%L%L%Z");
const dateFormatter = d3.timeFormat("%B %-e, %Y %I:%M %p");
const currencyFormatter = d3.format("$,.2f");
const scientificNotationFormatter = d3.format(".1e")

function disbursements_info(data) {
    return (
        "Source: " + data.source.name + "<br>" +
        "Target: " + data.target.name + "<br>" +
        "Type: Disbursements<br>" +
        "Total: " + currencyFormatter(data.total) + "<br>" +
        "Count: " + data.count + "<br>" +
        "Memo Total: " + currencyFormatter(data.memo_total) + "<br>" +
        "Memo Count: " + data.memo_count
    )
}

function receipt_info(data) {
    // if (data.date === null) {
    //     dateString = "null";
    // } else if (dateParser(data.date) === null) {
    //     dateString = "<parse error>";
    // } else {
    //     dateString = dateFormatter(dateParser(data.date));
    // }

    return (
        "Source: " + data.source.name + "<br>" +
        "Target: " + data.target.name + "<br>" +
        "Type: Receipt<br>" +
        "Quantity: " + currencyFormatter(data.quantity) + "<br>" +
        "Date: " + dateFormatter(dateParser(data.date))
    )
}

function principal_committee_info(data) {
    return (
        "Source: " + data.source.name + "<br>" +
        "Target: " + data.target.name + "<br>" +
        "Type: Principal Committee"
    )
}

function display_edge_tooltip(event, data) {
    var html = "error: unrecognized edge type";
    if (data.type == "DISBURSEMENTS") {
        html = disbursements_info(data);
    } else if (data.type == "RECEIPT") {
        html = receipt_info(data);
    } else if (data.type == "PRINCIPAL_COMMITTEE") {
        html = principal_committee_info(data);
    } else {
        console.log("Unrecognized edge type: ", data);
    }

    tooltip.style("transition-delay", "0s")
        .style("opacity", 1)
        .html(html);
};

// Context menu controllers ------------------------------------------------------------
// function display_context_menu(event) {
//     contextMenu
//         .style("opacity", 1)
//         .style("left", (event.pageX) + "px")
//         .style("top", (event.pageY) + "px")
//         .html(
//             "context menu<br>context menu"
//         );
// };

// function dismiss_context_menu() {
//     contextMenu
//         .style("left", -10000 + "px")
//         .style("top", -10000 + "px")
//         .style("opacity", 0);
// }

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
        .style("top", (_height - HEIGHT / 2) + "px")
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
