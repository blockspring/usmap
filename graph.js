var graph = {
  svg: null,
  chart: null,
  gradient: null,
  selectors: {
    chart: '#chart',
    dropdown: '#dropdowns',
    tooltip_div: '#tooltip',
    tooltip_title: '#tooltitlevalue',
    tooltip_text: '#tooltextvalue'
  },
  draw: function(){
    
      var svgInput = graph.selectors.chart;

      $(svgInput).empty();

      var width = $(window).width();
      var height = $(window).height();

      if (Block.vars.csv.columnRoleMap.grafly_dropdowns.length != 0){
        height = height - 50;
      }

      graph.svg = d3.select(svgInput)
        .append("svg:svg")
          .attr("width", width)
          .attr("height", height)
          .attr('id', 'map')
        .append('svg:g');

      var trans = null;
      var scale = null;
      if (Block.vars.zoom == true){
        graph.svg = graph.svg.call(d3.behavior.zoom()
          .scaleExtent([1, 8])
          .on("zoom", zoomable))
          .on("dblclick.zoom", null);

        function zoomable() {
          trans=d3.event.translate;
          scale=d3.event.scale;

          graph.svg.attr("transform",
              "translate(" + trans + ")"
              + " scale(" + scale + ")");
        }
      }

      graph.svg = graph.svg
        .append('svg:g');

      var transitionDelay = function (d, i) {
        return Block.vars.transition_delay;
      };

      var transitionDuration = Block.vars.transition_duration;

      //set height/width.delay(transitionDelay).duration(transitionDuration).ease('cubic-in-out')
      var w = $(svgInput).width();
      var h = $(svgInput).height();

      var minLength = Math.min(w, h);

      var scaleVar;
      
      if (Block.vars.scale) {
        scaleVar = Block.vars.scale;
      } else {
        if (minLength == w){
         scaleVar=700*(h/700); 
        } else {
          scaleVar=700*(h/500); 
        }
      }

      var projection = d3.geo.albersUsa()
        .translate([w / 2, h / 2])
        .scale(scaleVar);

      var path = d3.geo.path()
        .projection(projection);

      var color = d3.scale.quantize()
        .domain([
          d3.min(Block.vars.csv.data, function (d) {
            return d[Block.vars.csv.columnRoleMap.value[0]];
          }),
          d3.max(Block.vars.csv.data, function (d) {
            return d[Block.vars.csv.columnRoleMap.value[0]];
          })
        ])
        .range(Block.vars.colors);

      d3.json("us-states.json", function (json) {
        for (var i = 0; i < Block.vars.csv.data.length; i++) {
          var dataState = Block.vars.csv.data[i][Block.vars.csv.columnRoleMap.state[0]];
          var dataValue = parseFloat(Block.vars.csv.data[i][Block.vars.csv.columnRoleMap.value[0]]);
          for (var j = 0; j < json.features.length; j++) {
            var jsonState = json.features[j].properties.name;
            if (dataState == jsonState) {
              json.features[j].properties.value = dataValue;
              break;
            }
          }
        }

        graph.svg.selectAll("path")
          .data(json.features)
          .enter()
          .append("path")
          .attr("d", path)
          .transition().delay(transitionDelay).duration(transitionDuration).ease('cubic-in-out')
          .style('fill', function (d) {
            var value = d.properties.value;
            if (value) {
              return color(value);
            } else {
              return Block.vars.undefined_color;
            }
          })
          .style('stroke', Block.vars.border_color);
        
        var all_paths = graph.svg.selectAll("path")

        var coordinates = [0,0];

        graph.svg.on('mousemove', function () {
           coordinates = d3.mouse(this);
        });

          all_paths
          .on('mouseover', function (d) {
            if (Block.vars.tooltips) {
              var xPushPosition = parseFloat(d3.select(svgInput)[0][0].offsetLeft);
              var yPushPosition = parseFloat(d3.select(svgInput)[0][0].offsetTop);
              var xCentroid = path.centroid(d)[0];
              var yCentroid = path.centroid(d)[1];
              var xPosition = parseFloat(xCentroid) * (scale ? scale : 1) + (trans ? trans[0] : 0);
              var yPosition = parseFloat(yCentroid) * (scale ? scale : 1) + (trans ? trans[1] : 0);

              d3.select(graph.selectors.tooltip_div)
                .style("left", xPosition + "px")
                .style("top", yPosition + "px");
              d3.select(graph.selectors.tooltip_title)
                .text(d.properties.name);
              d3.select(graph.selectors.tooltip_text)
                .text(Block.vars.csv.columnRoleMap.value[0] + ' : ' + d3.format(Block.vars.tooltip_format)(d.properties.value));

              d3.select(graph.selectors.tooltip_div).classed("hidden", false);
            }

            if (Block.vars.highlight){
              d3.select(this).style('opacity','0.3')
            }
          })

        .on("mouseout", function () {
          //Hide the tooltip
          if (Block.vars.tooltips) {
            d3.select(graph.selectors.tooltip_div).classed("hidden", true);
          }
          
          if (Block.vars.highlight){
            d3.select(this).style('opacity','1')
          }
        })
      });
    },
    redraw: function(){    
      graph.draw();
    }
}