---
permalink: /methodology/
---

# Methodology

Continue reading to learn more about our approach and techniques to each aspect of the project.

## Data Collection

The vast majority of our data was collected from the <a href="https://api.open.fec.gov/developers/" target="_blank">openFEC API</a>, which is free and open to the public. To aid in our process of gathering the data, we authored the now open-sourced <a href="https://pypi.org/project/opynfec/" target="_blank">opynfec</a> package: a Python wrapper for the openFEC API. Feel free to use this for your own use cases, although not all endpoints have been implemented. Pull requests are always welcome!

## Node Graph

The node graph was implemented primarily using <a href="https://d3js.org/" target="_blank">D3.js</a> (specifically a <a href="https://github.com/d3/d3/blob/main/API.md#forces-d3-force" target="_blank">force simulation</a>. Although we have a lot more data collected than we allow a user to view, it is just not practical to draw that hundreds of thousands of nodes and still learn anything from it. This is why there are user-configurable controls that limit the amount of data that is shown. The data is limited using a standard tree search algorithm where the smaller quantity transactions are pruned off. It can also be truncated by limiting the total number of nodes per candidate.

## Map

The map was also implemented with <a href="https://d3js.org/" target="_blank">D3.js</a>, primarily a <a href="https://github.com/d3/d3/blob/main/API.md#projections" target="_blank">projection</a>.

## Clustering

Clustering on the committees and organizations combined data from the FEC as well as some industry data from <a href="#" target="_blank">SOURCE??</a>. Principal Component Analysis was done on the data to reduce the dimensionality, and then it was clustered with a standard $k$-means algorithm.

The results of the clustering are displayed when you hover over a node in the node graph. Displayed with other information is all of the similar committees to the one you have selected.
