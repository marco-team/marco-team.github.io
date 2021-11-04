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
