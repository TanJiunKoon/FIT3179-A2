function createSunburstChart(csvUrl, chartContainer) {
    d3.csv(csvUrl).then(function(data) {
      // Convert value to number
      data.forEach(d => d.value = +d.value);
  
      // Build the hierarchy
      const rootData = buildHierarchy(data);
  
      // Set dimensions
      const width = 800;
      const height = 800;
      const radius = Math.min(width, height) / 6;
  
      // Create color scale
      const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, rootData.children.length + 1));
  
      // Compute the layout
      const root = d3.hierarchy(rootData)
          .sum(d => d.value)
          .sort((a, b) => b.value - a.value);
  
      d3.partition().size([2 * Math.PI, root.height + 1])(root);
  
      root.each(d => d.current = d);
  
      // Create the SVG container
      const svg = d3.select(chartContainer).append("svg")
          .attr("width", width)
          .attr("height", height)
          .attr("viewBox", [-width / 2, -height / 2, width, height])
          .style("font", "16px sans-serif");
  
      const g = svg.append("g");
  
      // Create the arc generator
      const arc = d3.arc()
          .startAngle(d => d.x0)
          .endAngle(d => d.x1)
          .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
          .padRadius(radius * 1.5)
          .innerRadius(d => d.y0 * radius)
          .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));
  
      // Append the arcs
      const path = g.append("g")
        .selectAll("path")
        .data(root.descendants().slice(1))
        .join("path")
          .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
          .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
          .attr("d", d => arc(d.current))
          // Handle click event for zooming
          .on("click", clicked)
          // Handle tooltip display on mouseover
          .on("mouseover", function(event, d) {
            const sequence = d.ancestors().map(d => d.data.name).reverse().join(" > ");
            const tooltipText = `<strong>${sequence}</strong><br>GDP value: <strong>${d.value}</strong>`;

            d3.select("#tooltip")
              .html(tooltipText)
              .style("visibility", "visible")
              .style("top", (event.pageY + 10) + "px")
              .style("left", (event.pageX + 10) + "px");
          })
          // Update tooltip position as mouse moves
          .on("mousemove", function(event) {
            d3.select("#tooltip")
              .style("top", (event.pageY + 10) + "px")
              .style("left", (event.pageX + 10) + "px");
          })
          // Hide the tooltip on mouseout
          .on("mouseout", function() {
            d3.select("#tooltip")
              .style("visibility", "hidden");
          });
  
      // Add labels
      const label = g.append("g")
          .attr("pointer-events", "none")
          .attr("text-anchor", "middle")
          .style("user-select", "none")
        .selectAll("text")
        .data(root.descendants().slice(1))
        .join("text")
          .attr("dy", "0.35em")
          .attr("fill-opacity", d => +labelVisible(d.current))
          .attr("transform", d => labelTransform(d.current))
          .text(d => d.data.name);
  
      // Add a circle in the center to reset zoom
      const parent = g.append("circle")
          .datum(root)
          .attr("r", radius / 2)
          .attr("fill", "none")
          .attr("pointer-events", "all")
          .on("click", clicked);
      
      // Add "Return" text in the center circle
      const centerText = g.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "0.35em")
          .style("font-size", "16px")
          .style("font-weight", "bold")
          .text("Click to Return");
      
      function clicked(event, p) {
        parent.datum(p.parent || root);
  
        root.each(d => d.target = {
          x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
          x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
          y0: Math.max(0, d.y0 - p.depth),
          y1: Math.max(0, d.y1 - p.depth)
        });
  
        const t = g.transition().duration(750);
  
        path.transition(t)
            .tween("data", d => {
              const i = d3.interpolate(d.current, d.target);
              return t => d.current = i(t);
            })
            .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
            .attrTween("d", d => () => arc(d.current));
  
        label.transition(t)
            .attr("fill-opacity", d => +labelVisible(d.target))
            .attrTween("transform", d => () => labelTransform(d.current));
      }
  
      function arcVisible(d) {
        return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
      }
  
      function labelVisible(d) {
        return d.y1 <= 3 && d.y0 >= 1 && (d.x1 - d.x0) > 0.03;
      }
  
      function labelTransform(d) {
        const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
        const y = (d.y0 + d.y1) / 2 * radius;
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
      }
  
      function buildHierarchy(csvData) {
        const root = { name: "Total", children: [] };
  
        csvData.forEach(function(row) {
          const sequence = row.type.split(".");
          const size = +row.value;
          const name = row.desc_en;
  
          let currentNode = root;
  
          for (let i = 0; i < sequence.length; i++) {
            const nodeName = sequence[i];
            let foundChild = false;
  
            if (!currentNode.children) {
              currentNode.children = [];
            }
  
            currentNode.children.forEach(function(child) {
              if (child.id === nodeName) {
                currentNode = child;
                foundChild = true;
              }
            });
  
            if (!foundChild) {
              const newNode = { name: name, id: nodeName, children: [] };
              currentNode.children.push(newNode);
              currentNode = newNode;
            }
          }
  
          if (currentNode) {
            currentNode.value = size;
            delete currentNode.children;
          }
        });
  
        return root;
      }
    });
  }
  