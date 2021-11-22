---
permalink: /node-graph/
---

# Node Graph

<form action="">
    <label for="connectionlimit">Connection Limit = <span id="connectionlimit-value"></span></label>
    <input type="range" id="connectionlimit" name="connectionlimit" min=0 max=100 step=1>
    <button type="button" id="submit">Refresh</button><br>
    <button type="button" id="pinall">Pin All Nodes</button>
    <button type="button" id="unpinall">Unpin All Nodes</button>
</form>

<script type="text/javascript" src="https://d3js.org/d3.v6.min.js"></script>
<link type="text/css" rel="stylesheet" href="./node.css" media="screen" />
<script type="text/javascript" src="./node.js"></script>
