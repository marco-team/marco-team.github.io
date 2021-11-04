# JavaScript Test

Some JS below:

<script type="text/javascript" src="https://d3js.org/d3.v5.min.js"></script>
<script type="text/javascript">
<!--    import * as d3 from "d3"; -->
   document.write(5.6);
   
   var svg = d3.select("svg")
      .attr("width", 300)
      .attr("height", 300);
   svg.append("text")
      .attr("transform", "translate(100,0)")
      .attr("x", 50)
      .attr("y", 50)
      .attr("font-size", "20px")
      .attr("class", "title")
      .text("Population bar chart");
</script>

The Javascript should be above
