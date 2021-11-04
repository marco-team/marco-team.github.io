---
permalink: /jstest/
---

# JavaScript Test

> Some JS below:

<script type="text/javascript" src="https://d3js.org/d3.v5.min.js"></script>
<script type="text/javascript">
   
   document.write(5.6);
   
   var svg = d3.select("body")
        .append("svg")
      .attr("width", 500)
      .attr("height", 100);
   
   svg.append("text")
      .attr("transform", "translate(100,0)")
      .attr("x", 50)
      .attr("y", 50)
      .attr("font-size", "20px")
      .attr("class", "title")
      .text("Population bar chart");
</script>

The Javascript should be above
