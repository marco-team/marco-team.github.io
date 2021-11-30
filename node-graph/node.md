---
permalink: /node-graph/
---

# Node Graph

<form action="" class="legend">
    <label for="connectionlimit">Connection Limit = <span id="connectionlimit-value" class="twodigit"></span></label>
    <input type="range" id="connectionlimit" name="connectionlimit" min=0 max=10 step=1 class="slider">
    <i class="material-icons" id="connectionlimit-info">info_outline</i><br>
    <label for="explicitlimit">Candidate Limit = <span id="explicitlimit-value" class="threedigit"></span></label>
    <input type="range" id="explicitlimit" name="explicitlimit" min=2 max=100 step=1 class="slider">
    <i class="material-icons" id="explicitlimit-info">info_outline</i><br>
    <button type="button" id="submit">Refresh</button>
    <button type="button" id="pinall">Pin All Nodes</button>
    <button type="button" id="unpinall">Unpin All Nodes</button>
</form>

<script type="text/javascript" src="https://d3js.org/d3.v6.min.js"></script>
<link type="text/css" rel="stylesheet" href="./node.css" media="screen" />
<script type="text/javascript" src="./node.js"></script>
<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
