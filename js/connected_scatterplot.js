// Ensure the script runs after the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function() {

    // Function to calculate the length of the path for animation
    function length(path) {
      return d3.create("svg:path").attr("d", path).node().getTotalLength();
    }
  
    // Fetch the data from the external JSON file
    d3.json('data/fdi_data.json').then(data => {
  
      // Set up chart dimensions and margins
      const width = 928;
      const height = 720;
      const marginTop = 20;
      const marginRight = 30;
      const marginBottom = 30;
      const marginLeft = 60;
  
      // Create scales
      const x = d3.scaleLinear()
          .domain(d3.extent(data, d => d.net)).nice()
          .range([marginLeft, width - marginRight]);
  
      const y = d3.scaleLinear()
          .domain(d3.extent(data, d => d.gdp_capita)).nice()
          .range([height - marginBottom, marginTop]);
  
      // Line generator
      const line = d3.line()
          .curve(d3.curveCatmullRom)
          .x(d => x(d.net))
          .y(d => y(d.gdp_capita));
  
      // Create SVG container
      const svg = d3.select("#connected_scatterplot_chart").append("svg")
          .attr("width", width)
          .attr("height", height)
          .attr("viewBox", [0, 0, width, height])
          .style("max-width", "100%")
          .style("height", "auto");
  
      // Tooltip div
      const tooltip = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("visibility", "hidden");
  
      // Function to render the chart (used for replay)
      function renderChart() {
        svg.selectAll("*").remove();
        const l = length(line(data));
  
        // Add X-axis
        svg.append("g")
            .attr("transform", `translate(0,${height - marginBottom})`)
            .call(d3.axisBottom(x).ticks(width / 80))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll(".tick line").clone()
                .attr("y2", -height)
                .attr("stroke-opacity", 0.1))
            .call(g => g.append("text")
                .attr("x", width - 4)
                .attr("y", -4)
                .attr("font-weight", "bold")
                .attr("text-anchor", "end")
                .attr("fill", "currentColor")
                .attr("font-size", "18px")  // Consistent font size for axis label
                .text("Net Foreign Direct Investment (FDI) Flows"));
  
        // Add Y-axis
        svg.append("g")
          .attr("transform", `translate(${marginLeft},0)`)
          .call(d3.axisLeft(y).ticks(null, "~s"))
          .call(g => g.select(".domain").remove())
          .call(g => g.selectAll(".tick line").clone()
              .attr("x2", width)
              .attr("stroke-opacity", 0.1))
          .call(g => g.select(".tick:last-of-type text").clone()
              .attr("x", 4)
              .attr("text-anchor", "start")
              .attr("font-weight", "bold")
              .attr("fill", "currentColor")
              .attr("font-size", "18px")  // Consistent font size for axis label
              .text("Gross Domestic Product (GDP) per Capita"));
  
        // Increase the font size of tick values on both axes
        svg.selectAll(".tick text")
          .attr("font-size", "18px");  // Bigger font for tick values
  
        // Draw the line with animation
        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 2.5)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-dasharray", `0,${l}`)
            .attr("d", line)
          .transition()
            .duration(5000)
            .ease(d3.easeLinear)
            .attr("stroke-dasharray", `${l},${l}`);
  
        // Add data points with tooltip functionality
        svg.append("g")
            .attr("fill", "white")
            .attr("stroke", "black")
            .attr("stroke-width", 2)
          .selectAll("circle")
          .data(data)
          .join("circle")
            .attr("cx", d => x(d.net))
            .attr("cy", d => y(d.gdp_capita))
            .attr("r", 3)
            .on("mouseover", function(event, d) {
              tooltip.style("visibility", "visible")
                .html(`<strong>Year:</strong> ${d.year}<br><strong>Net FDI Flows:</strong> ${d.net}<br><strong>GDP per Capita:</strong> ${d.gdp_capita}`)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 28) + "px");
            })
            .on("mousemove", function(event) {
              tooltip.style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
              tooltip.style("visibility", "hidden");
            });
  
        // Add labels
        const label = svg.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
          .selectAll("text")
          .data(data)
          .join("text")
            .attr("transform", d => `translate(${x(d.net)},${y(d.gdp_capita)})`)
            .attr("fill-opacity", 0)
            .text(d => d.year)
            .attr("stroke", "white")
            .attr("paint-order", "stroke")
            .attr("fill", "currentColor")
            .each(function(d) {
              const t = d3.select(this);
              switch (d.side) {
                case "top":
                  t.attr("text-anchor", "middle").attr("dy", "-0.7em");
                  break;
                case "right":
                  t.attr("dx", "0.5em").attr("dy", "0.32em").attr("text-anchor", "start");
                  break;
                case "bottom":
                  t.attr("text-anchor", "middle").attr("dy", "1.4em");
                  break;
                case "left":
                  t.attr("dx", "-0.5em").attr("dy", "0.32em").attr("text-anchor", "end");
                  break;
                default:
                  t.attr("text-anchor", "middle").attr("dy", "-0.7em");
              }
            });
  
        // Animate labels
        label.transition()
            .delay((d, i) => length(line(data.slice(0, i + 1))) / l * (5000 - 125))
            .attr("fill-opacity", 1);
      }
  
      // Initial render
      renderChart();
  
      // Replay button functionality
      d3.select("#replay-button").on("click", function() {
        renderChart();
      });
  
    });
  });
  