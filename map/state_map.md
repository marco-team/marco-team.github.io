---
permalink: /map/
---

# State Map

<!-- <!DOCTYPE html> -->
<meta charset="utf-8">
<script type="text/javascript" src="https://d3js.org/d3.v5.min.js"></script>
<style>

</style>
<head>
<title></title></head>
<body>
    <button onclick=showModal()>?</button>
    <select id="dropdown">
      <option value="candidate" selected>Contributions to presidential candidates</option>
      <option value="party">Contributions to political parties</option>
    </select>
    <div style="width:1930px">
      <svg id="choropleth"></svg>
      <svg id="info"></svg>
    </div>
    
    <div id="myModal" class="modal">
      <div class="modal-content">
        <span class="close">&times;</span>
        <p class="bold">Welcome to Team Marco's 2020 State Political Contribution Map</p>
        <p>You can click on a state to pin it and keep its information open in the comparison section</p>
        <p>Click on a selected state again to un-pin it to continue browsing</p>
        <p>You can have up to 2 states open in the comparison section at a time</p>
      </div>
    </div>
    <script>

          // enter code to define margin and dimensions for svg
          var margin = {top: 0, right: 200, bottom: 50, left: 0}
                        , width = 860 - margin.left - margin.right
                        , height = 700 - margin.top - margin.bottom;
          var modal = document.getElementById('myModal');
          let linearScale = d3.scaleLinear()
                      .domain([-1, 0, 1])
                      .range(['red', '#ddd', 'blue']);
                      //.range(['#FF4136', '#ddd', '#0074D9']);
          var selectedStates = [];
          var lockedIn = [false, false];
          var showModal = function(){
            modal.style.display = "block";
          }
          var closeModal = document.getElementsByClassName("close")[0];
          closeModal.onclick = function() {
              modal.style.display = "none";
          }
          window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
          }
        // enter code to create svg
        const map_svg = d3.select("#choropleth")
        .attr("id", "choropleth")
        .attr("width", 960)
        .attr("height", 700)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .on("dblclick", dblclicked);

        const info_svg = d3.select("#info")
        .attr("id", "info")
        .attr("class", "info")
        .attr("width", 860)
        .attr("height", 700)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .on("dblclick", dblclicked);
        

        var projection = d3.geoAlbersUsa().scale(1200).translate([487.5, 305])
        var path = d3.geoPath().projection(projection);

      
        function dblclicked() {
            selectedStates.map(function(d) {
                d3.select(`#${d}`).attr("stroke", "black").attr("stroke-width", "1");
            })
            //fixInfo = false;
            lockedIn = [false, false];
            selectedStates = [];
        }

        Promise.all([d3.json('../data/individual_to_committee.json'), d3.json('../data/united_states.json'), d3.json('../data/code_to_state.json'), d3.json('../data/presidential_bystate.json')]).then(function(values) {
          var stateCodes = []
          var stateNames = []
          values[2].map(function(d) {
            stateCodes.push(d["Code"]);
            stateNames.push(d["State"])
          })

          var codeToState = d3.scaleOrdinal()
                        .domain(stateCodes)
                        .range(stateNames);

          var stateInfo = values[3].map(function(d) {
            return {
              state: codeToState(d["state"]),
              total: d["All_candidates"],
              biden: d["Biden"],
              trump: d["Trump"],
              democrat: d["Democrats"],
              republican: d["Republicans"]
            }
          })
          d3.select("#dropdown").on("change", function() { 
                var selectedVersion = d3.event.target.value;
                d3.select("choropleth").selectAll("*").remove();
                createMap(values[1], stateInfo, selectedVersion)
            });


          createMap(values[1], stateInfo, "candidate");

          function createMap(america, stateInfo, selectedVersion) {
            var states = map_svg
                            .append("g")
                            .attr("id", "states")
                            .selectAll("path")
                            .data(america.features)
                            .enter()
            states.append("path")
                .attr("class","country_paths")
                .attr("stroke", "black")
                .attr("fill", function(d) {
                  var result = stateInfo.filter(obj => {
                                    return obj.state == d.properties.NAME
                                })
                  if (result.length == 1) result = result[0]
                  if (selectedVersion == "candidate") return linearScale((result.biden - result.trump) / (result.biden + result.trump));
                  return linearScale((result.democrat - result.republican) / (result.democrat + result.republican));
                })
                .attr("d", path)
                .attr("id", function(d) {
                  var result = stateInfo.filter(obj => {
                                    return obj.state == d.properties.NAME
                                })
                  if (result.length > 0) result = result[0]
                  return result.state;
                })
                .on("click", function(d) {
                  const index = selectedStates.indexOf(event.target.id);
                  const lockIndex = lockedIn.findIndex((element) => !element);
                  if (index >= 0 && lockedIn[index] == true) d3.select(event.target).attr("stroke", "black").attr("stroke-width", "1");
                  lockedIn[index] = !(index >= 0 && lockedIn[index] == true)
                  
                  displayData(selectedStates)
                })
                .on("dblclick", () => {
                  dblclicked();
                  displayData(selectedStates);
                })
                .on("mouseover", function(d) {
                    const lockIndex = lockedIn.findIndex((element) => !element);
                    if (lockIndex >= 0) {
                      selectedStates.length < lockIndex ? selectedStates.push(event.target.id) : selectedStates[lockIndex] = event.target.id;
                      d3.select(this).style("cursor", "pointer"); 
                      d3.select(event.target).attr("stroke", "red").attr("stroke-width", "3.5");
                    }
                    displayData(selectedStates);
                })
                .on("mouseout", function(d) { 
                  const index = selectedStates.indexOf(event.target.id);
                  if (!lockedIn[index]) {
                    d3.select(event.target).attr("stroke", "black").attr("stroke-width", "1");
                  }
                  d3.select(this).style("cursor", "default"); 
                   });

            var info = info_svg.append("g").attr("id", "information").style("display", "none");
            




          function displayData(selectedStates) {
              var result = stateInfo.filter(obj => {
                                    return obj.state == selectedStates[0]
                                })  
              if (result.length == 1) result = result[0]
              var party_difference;
              if (selectedVersion == "candidate") party_difference = (result.biden - result.trump) / (result.biden + result.trump);
              else party_difference = (result.democrat - result.republican) / (result.democrat + result.republican)
              selectedStates.length > 0 ? info.style("display", "inline") : info.style("display", "none")
              var comparisons = info.selectAll("comparisons").data(selectedStates).enter();
                                
              function getResult(d) {
                var result = stateInfo.filter(obj => {
                                    return obj.state == d
                                })  
                if (result.length == 1) return result[0];
                return null;
              }

              comparisons.append('rect')
                          .attr('width', 250)
                          .attr('height', 250)
                          .attr('x', function(d, i) {
                           return 300 * i + 10;})
                          .attr('y', 110)
                          .attr('stroke', 'black')
                          .attr('stroke-width', '3')
                          .attr('rx', 12)
                          .attr('ry', 12)
                          .attr('fill', function(d) {
                              const result = getResult(d);
                              if (selectedVersion == "candidate") party_difference = (result.biden - result.trump) / (result.biden + result.trump);
                              else party_difference = (result.democrat - result.republican) / (result.democrat + result.republican)
                              return linearScale(party_difference);
                          })
              comparisons.append("text").text(function(d) {return d})
                            .attr("x", function(d, i) {
                              return 135 + 300 * i;
                            })
                            .attr("y", "145px")
                            .style("text-anchor", "middle")
                            .style("font-size", "25px")
                            .style("font-weight", "bold")
              comparisons.append("text").text(function(d) {
                                const result = getResult(d);
                                return "Total: " + d3.format("($,")(result.total);
                            })
                            .attr("x", function(d, i) {
                              return 135 + 300 * i;
                            })
                            .attr("y", "175px")
                            .style("text-anchor", "middle")
                            .style("font-size", "20px")
              comparisons.append("text").text(function(d) {
                                const result = getResult(d);
                                return "Democrat: " + d3.format("($,")(result.democrat);
                            })
                            .attr("x", function(d, i) {
                              return 135 + 300 * i;
                            })
                            .attr("y", "205px")
                            .style("text-anchor", "middle")
                            .style("font-size", "20px")
              comparisons.append("text").text(function(d) {
                                const result = getResult(d);
                                return "Republican: " + d3.format("($,")(result.republican)
                            })
                            .attr("x", function(d, i) {
                              return 135 + 300 * i;
                            })
                            .attr("y", "235px")
                            .style("text-anchor", "middle")
                            .style("font-size", "20px")
              comparisons.append("text").text(function(d) {
                                const result = getResult(d);
                                return "To Biden: " + d3.format("($,")(result.biden);
                            })
                            .attr("x", function(d, i) {
                              return 135 + 300 * i;
                            })
                            .attr("y", "265px")
                            .style("text-anchor", "middle")
                            .style("font-size", "20px")
              comparisons.append("text").text(function(d) {
                                const result = getResult(d);
                                return "To Trump: " + d3.format("($,")(result.trump);
                            })
                            .attr("x", function(d, i) {
                              return 135 + 300 * i;
                            })
                            .attr("y", "295px")
                            .style("text-anchor", "middle")
                            .style("font-size", "20px")
              

          }
          function hideData(d) {
            info.selectAll("*").remove();
            info.style("display", "none");
          }
          }
        })

    </script>
</body>
<!-- </html> -->
