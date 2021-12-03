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
    
  // enter code to create svg
  const map_svg = d3.select("#choropleth")
  .attr("id", "choropleth")
  .attr("width", 960)
  .attr("height", 700)
  .attr("transform", "translate(" + -250 + "," + margin.top + ")")
  .on("dblclick", dblclicked);
  const info_svg = d3.select("#info")
  .attr("id", "info")
  .attr("class", "info")
  .attr("width", 860)
  .attr("height", 700)
  .attr("transform", "translate(" + -250 + "," + margin.top + ")")
  .on("dblclick", dblclicked);
  
  var tooltip = d3.select("#tooltip")
              .attr("class", "tooltip");
  var info_tooltip = d3.select("#tooltip2")
              .attr("class", "tooltip2");
          
  var projection = d3.geoAlbersUsa().scale(1200).translate([487.5, 305])
  var path = d3.geoPath().projection(projection);
  info_button = map_svg.append("circle")
                        .style('fill', '#001166')
                        .attr('r', 20)
                        .attr('cx', 25)
                        .attr('cy', 25)
                        .on('mouseover', showInfoToolTip)
                        .on('mouseout', hideInfoToolTip)
  map_svg.append("text").text('?').style('fill', 'white').attr('x', 25)
                      .attr('y', 35)
                      .style("text-anchor", "middle")
                      .style("font-size", "25px")
                      .style("font-weight", "bold")
  function showInfoToolTip() {
          info_tooltip.style("display", "inline");
          info_tooltip.text("Welcome to Team Marco's State Political Contribution Map")
                      .style("left", (d3.event.pageX - 600) + "px")     
                      .style("top", (d3.event.pageY - 400 + 30) + "px")
                      .append('div')
                      .html("\nHover over a state to view its contributions to political parties or candidates in the 2020 presidential election")
                      .append('div')
                      .html("Click on a state to pin it to view the cities that contributed the most to explicitly Republican or Democratic committees")
                      .append('div')
                      .html("Click on a pinned state to un-pin and swap out its information with a different state"); 
  }
  function hideInfoToolTip() {
          info_tooltip.style("display", "none");
  }

  function dblclicked() {
      selectedStates.map(function(d) {
          d3.select(`#${d}`).attr("stroke", "black").attr("stroke-width", "1");
      })
      lockedIn = [false, false];
      selectedStates = [];
  }
  Promise.all([d3.json('../data/individual_to_committee.json'), d3.json('../data/united_states.json'), d3.json('../data/code_to_state.json'), d3.json('../data/presidential_bystate.json'), d3.csv('../data/individual0.csv'), d3.json('../data/us_cities.json'), d3.csv('../data/individual1.csv')]).then(function(values) {
    var stateCodes = []
    var stateNames = []
    var individual_values = [...values[4], ...values[6]];
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
      selectedStates = [];
      lockedIn = [false, false];
      var info = info_svg.append("g").attr("id", "information").style("display", "none");
      displayData(selectedStates);
      var dcResult = stateInfo.filter(obj => {
                              return obj.state == "District of Columbia"
                          })[0]
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
            if (lockedIn[1] == false && selectedStates.length > 1) selectedStates.splice(-1)
            if (lockedIn[0] == false && lockedIn[1] == 0) selectedStates = [];
            showCities(selectedStates, lockedIn)
          })
          .on("dblclick", () => {
            dblclicked();
            displayData(selectedStates);
          })
          .on("mouseover", function(d) {
              const lockIndex = lockedIn.findIndex((element) => !element);
              if (lockIndex >= 0 && selectedStates.indexOf(event.target.id) < 0) {
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
      
      states.append("rect")
           .attr('id', "District of Columbia")
           .attr('x', 850)
           .attr('y', 275)
           .attr('width', 60)
           .attr('height', 50)
           .attr('stroke', 'black')
           .attr('rx', 12)
           .attr('ry', 12)
           .attr('fill', () => {
            if (selectedVersion == "candidate") return linearScale((dcResult.biden - dcResult.trump) / (dcResult.biden + dcResult.trump));
            return linearScale((dcResult.democrat - dcResult.republican) / (dcResult.democrat + dcResult.republican));
          })
           .on("mouseover", () => {
            const lockIndex = lockedIn.findIndex((element) => !element);
            if (lockIndex >= 0 && selectedStates.indexOf(event.target.id) < 0) {
              selectedStates.length < lockIndex ? selectedStates.push(event.target.id) : selectedStates[lockIndex] = event.target.id;
              d3.select(event.target).style("cursor", "pointer"); 
              d3.select(event.target).attr("stroke", "red").attr("stroke-width", "3.5");
            }
            displayData(selectedStates);
            })
           .on("mouseout", () => {
            const index = selectedStates.indexOf(event.target.id);
            if (!lockedIn[index]) {
              d3.select(event.target).attr("stroke", "black").attr("stroke-width", "1");
            }
            d3.select(event.target).style("cursor", "default"); 
            })
           .on("click", () => {
            const index = selectedStates.indexOf(event.target.id);
            const lockIndex = lockedIn.findIndex((element) => !element);
            
            if (index >= 0 && lockedIn[index] == true) d3.select(event.target).attr("stroke", "black").attr("stroke-width", "1");
            lockedIn[index] = !(index >= 0 && lockedIn[index] == true)
            if (lockedIn[1]== false && selectedStates.length > 1) selectedStates.splice(-1)
            displayData(selectedStates)
           })
           .on("dblclick", () => {
            dblclicked();
            displayData(selectedStates);
           })
    states.append("text").text("D.C.")
            .attr('x', 880)
            .attr('y', 305)
            .style('fill', 'black')
            .style('font-size', "18px")
            .style("text-anchor", "middle")
    function showCities(selectedStates, lockedIn) {
        map_svg.selectAll('#cities').remove();
        var statesToShow = [];
        if (lockedIn[0]) statesToShow.push(selectedStates[0])
        if (lockedIn[1]) statesToShow.push(selectedStates[1])
        let citiesToShow = [];
        var city = map_svg.append('g').attr('id', 'cities').selectAll("city").data(statesToShow).enter();
        
        function groupByCity(stateName) {
          var contributions = individual_values.filter(obj => {
                              return codeToState(obj.contributor_state) == stateName
          })
          var contribution_values = d3.flatRollup(contributions, v => d3.sum(v, d => d.contribution_amount), d => d.committee_party, d => d.contributor_state, d => d.contributor_city)
          sorted_city = contribution_values.slice().sort((a, b) => d3.descending(a[3], b[3]))
          all_cities = sorted_city.filter(function(d) {
            return d[0] == 'DEM'
          }).slice(0, 3)
          rep_cities = sorted_city.filter(function(d) {
            return d[0] == 'REP'
          }).slice(0, 3)
          all_cities.push(...rep_cities)
          sorted = all_cities.slice().sort((a, b) => d3.ascending(a[3], b[3]))
          citiesToShow = sorted;
          return sorted;
        }
        var cities = city.selectAll('cities').data(groupByCity).enter()
        var locations = cities.selectAll('locations').data(
          function(d) {
            city_features = values[5].features.filter(obj => {
                            return (obj.properties.name == d[2] && obj.properties.state_id == d[1])
                          })
            if (city_features.length) city_features[0].properties.committee = d[0]
            return city_features
          }
        ).enter()
        locations.append('path').attr('d', path).attr('fill', function(d) {
          if (d.properties.committee == 'DEM') return 'blue';
          return 'red'
        }).attr('stroke', 'black').on('mouseover', showToolTip).on('mouseout', hideToolTip)
        function showToolTip(d) {
          tooltip.style("display", "inline");
          tooltip.text("City: " + d.properties.name)
                      .style("left", (d3.event.pageX - 600 + 20) + "px")     
                      .style("top", (d3.event.pageY - 400) + "px")
        }
        function hideToolTip(d) {
          tooltip.style("display", "none");
        }
    }
    function displayData(selectedStates) {
        var party_difference;
        selectedStates.length > 0 ? info.style("display", "inline") : info.style("display", "none")
        var comparisons = info.selectAll("comparisons").data(selectedStates).enter();
        
                          
        function getResult(stateName) {
          var result = stateInfo.filter(obj => {
                              return obj.state == stateName
                          })  
          if (result.length == 1) return result[0];
          return null;
        }
        
        function groupByCity(stateName, iter) {
          var contributions = individual_values.filter(obj => {
                              return codeToState(obj.contributor_state) == stateName
          })
          var contribution_values = d3.flatRollup(contributions, v => d3.sum(v, d => d.contribution_amount), d => d.committee_party, d => d.contributor_city)
          sorted_city = contribution_values.slice().sort((a, b) => d3.descending(a[2], b[2]))
          all_cities = sorted_city.filter(function(d) {
            return d[0] == 'DEM'
          }).slice(0, 3)
          rep_cities = sorted_city.filter(function(d) {
            return d[0] == 'REP'
          }).slice(0, 3)
          all_cities.push(...rep_cities)
          sorted = all_cities.slice().sort((a, b) => d3.descending(a[2], b[2]))
          sorted.map((element) => element.push(iter));
          return sorted;
        }
        
        comparisons.selectAll('*').remove();
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
        
        comparisons.append('rect')
                      .attr('width', 250)
                      .attr('height', 200)
                      .attr('x', function(d, i) {
                              return 300 * i + 10;})
                      .attr('y', 360)
                      .attr('stroke', 'black')
                      .attr('stroke-width', '3')
                      .attr('rx', 12)
                      .attr('ry', 12)
                      .attr('fill', 'white')
        comparisons.append("text").text('Top 3 D/R Cities by Donation')
                      .attr('x', function(d, i) {return 135 + 300 * i;})
                      .attr('y', 400).style("text-anchor", "middle")
                      .style("font-size", "18px")
        var cities = comparisons.selectAll('city_info').data(function(d, i) {
          return groupByCity(d, i)}).enter()
        
        cities.append("text").text(function(d) {
                          return d[1] + ': ' + d3.format("($,.2f")(d[2] / 1000000) + 'M';
                      })
                      .attr("x", function(d, i) {
                        return 135 + 300 * d[3]
                      })
                      .attr("y", function(d, i) {
                        return 440 + i * 20;
                      })
                      .style("text-anchor", "middle")
                      .style("font-size", "18px")
                      .style('fill', function(d) {
                        if (d[0] == 'DEM') return 'blue';
                        return 'red';
                      })
        
    }
    function hideData(d) {
      info.selectAll("*").remove();
      info.style("display", "none");
    }
    }
  })