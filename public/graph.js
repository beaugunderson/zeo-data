/*globals d3:true nv:true*/

function setupGraph(night) {
  nv.addGraph(function() {
    var chart = nv.models.stackedAreaChart()
      .x(function(d, i) { return i; })
      .y(function(d) { return d[1]; });

    chart.xAxis
      .showMaxMin(false)
      .axisLabel('Hours from sleep onset')
      //.ticks(d3.time.minutes, 5)
      .tickFormat(function(d) { return (Math.round(((d * 5) / 60) * 10) / 10) + ' hours'; });

    chart.yAxis
      .axisLabel('Probability')
      .tickFormat(d3.format('.0%'));

    d3.select('#chart svg')
      .datum(night)
      .transition().duration(500)
      .call(chart);

    nv.utils.windowResize(chart.update);

    return chart;
  });
}

/*
function setupOldGraph(night) {
  var m = [80, 80, 80, 80];

  var w = 1000 - m[1] - m[3];
  var h = 350 - m[0] - m[2];

  var graph = d3.select("#graph").append("svg:svg")
      .attr("width", w + m[1] + m[3])
      .attr("height", h + m[0] + m[2])
    .append("svg:g")
      .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

  var x = d3.scale.linear()
    .domain([0, night.length])
    .range([0, w]);

  var y = d3.scale.linear().domain([0, 4]).range([h, 0]);

  // create yAxis
  var xAxis = d3.svg.axis().scale(x).tickSize(-h).tickSubdivide(1);

  // Add the x-axis.
  graph.append("svg:g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + h + ")")
    .call(xAxis);

  // create left yAxis
  var yAxisLeft = d3.svg.axis().scale(y).ticks(6).orient("left");

  // Add the y-axis to the left
  graph.append("svg:g")
    .attr("class", "y axis")
    .attr("transform", "translate(-10,0)")
    .call(yAxisLeft);

  var line = d3.svg.line()
    .x(function(d, i) {
      return x(i);
    })
    .y(function(d) {
      return y(d);
    });

  graph.append("svg:path")
    .attr("d", line(night))
    .attr("class", "data1");
}
*/
