---
permalink: /node-graph/
---

# Node Graph

<form action="" class="legend">
    <label for="connectionlimit">
        Connection Limit 
        <i class="material-icons" id="connectionlimit-info">info_outline</i> 
        <span style="width: 0px"></span> 
        = 
        <span id="connectionlimit-value" class="threedigit"></span>
    </label>
    <input type="range" id="connectionlimit" name="connectionlimit" min=0 max=10 step=1 class="slider">
    <br>
    <label for="explicitlimit">
        Node Limit
        <i class="material-icons" id="explicitlimit-info">info_outline</i>
        <span style="width: 42px"></span> 
        = 
        <span id="explicitlimit-value" class="threedigit"></span>
    </label>
    <input type="range" id="explicitlimit" name="explicitlimit" min=2 max=100 step=1 class="slider">
    <br>
    <br>
    <label for="chargestrength">
        Charge Strength 
        <i class="material-icons" id="chargestrength-info">info_outline</i>
        <span style="width: 1px"></span> 
        = 
        <span id="chargestrength-value" class="threedigit"></span>
    </label>
    <input type="range" id="chargestrength" name="chargestrength" min=0 max=999 step=1 class="slider">
    <br>
    <label for="alpha">
        Alpha 
        <i class="material-icons" id="alpha-info">info_outline</i>
        <span style="width: 78px"></span> 
        = 
        <span id="alpha-value" class="threedigit"></span>
    </label>
    <input type="range" id="alpha" name="alpha" min=0 max=1 step=0.05 class="slider">
    <br>
    <label for="pincandidates">
        Pin Candidates
        <i class="material-icons" id="pincandidates-info">info_outline</i>
    </label>
    <span style="width: 50px"></span> 
    <input type="checkbox" id="pincandidates" name="pincandidates" checked>
    <br>
    <button type="button" id="pinall">Pin All Nodes</button>
    <button type="button" id="unpinall">Unpin All Nodes</button>
    <br>
    <br>
    <button type="button" id="submit">Refresh</button>
</form>

<script type="text/javascript" src="https://d3js.org/d3.v6.min.js"></script>
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/d3-legend/2.25.6/d3-legend.min.js"></script>
<link type="text/css" rel="stylesheet" href="./node.css" media="screen" />
<script type="text/javascript" src="./node.js"></script>
<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
