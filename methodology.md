---
permalink: /methodology/
---

# Methodology

Continue reading to learn more about our approach and techniques to each aspect of the project.

## Data Collection

The vast majority of our data was collected from the [openFEC API](https://api.open.fec.gov/developers/), which is free and open to the public. To aid in our process of gathering the data, we authored the now open-sourced [opynfec](https://github.com/marco-team/opynfec) package: a Python wrapper for the openFEC API. Feel free to use this for your own use cases, although not all endpoints have been implemented. Pull requests are always welcome!

## Node Graph

The node graph was implemented primarily using [D3.js](https://d3js.org/) (specifically a [force simulation](https://github.com/d3/d3/blob/main/API.md#forces-d3-force)). Although we have a lot more data collected than we allow a user to view, it is just not practical to draw that hundreds of thousands of nodes and still learn anything from it. This is why there are user-configurable controls that limit the amount of data that is shown. The data is limited using a standard tree search algorithm where the smaller quantity transactions are pruned off. It can also be truncated by limiting the total number of nodes per candidate.

## Map

The map was also implemented with [D3.js](https://d3js.org/), primarily a [projection](https://github.com/d3/d3/blob/main/API.md#projections).

## Clustering

Clustering on the committees and organizations combined data from the FEC as well as some industry data from [SOURCE??](). Principal Component Analysis was done on the data to reduce the dimensionality, and then it was clustered with a standard $k$-means algorithm.

The results of the clustering are displayed when you hover over a node in the node graph. Displayed with other information is all of the similar committees to the one you have selected.