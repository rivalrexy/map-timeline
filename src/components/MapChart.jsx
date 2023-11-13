import React, { useRef, useState } from "react";
import * as d3 from "d3";

const MapChart = () => {
  const dropAreaRef = useRef(null);
  const fileInputRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [title, setTitle] = useState(
    "Drag and drop a CSV file here, or click to select one."
  );

  const handleFileSelect = (file) => {
    if (file) {
      const reader = new FileReader();

      reader.onload = function (e) {
        const csvData = d3.csvParse(e.target.result);
        drawMap(csvData);
      };

      reader.readAsText(file);
      setTitle(file.name);
    }
  };

  const drawMap = (csvData) => {
    // Clear the existing map container
    d3.select(mapContainerRef.current).html("");

    const svgWidth = 270; // Width of each map
    const svgHeight = 400; // Height of each map

    // Load external data and boot
    d3.json(
      "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
    ).then(function (worldData) {
      const mapsContainer = d3
        .select(mapContainerRef.current)
        .append("svg")
        .attr("width", svgWidth * csvData.length) // Total width of the row
        .attr("height", svgHeight);

      csvData.forEach((data, index) => {
        const mapGroup = mapsContainer
          .append("g")
          .attr("transform", `translate(${index * svgWidth}, 0)`);

        const centerLongitude = +data.longitude;
        const centerLatitude = +data.latitude;

        const projection = d3
          .geoMercator()
          .center([centerLongitude, centerLatitude])
          .scale(800)
          .translate([svgWidth / 2, svgHeight / 2]);

        // Add a text label for the current data point
        mapsContainer
          .append("text") // Append the text directly to mapsContainer
          .attr(
            "x",
            index * svgWidth +
              projection([+data.longitude, +data.latitude])[0] -
              135
          ) // Adjust the x-coordinate
          .attr("y", projection([+data.longitude, +data.latitude])[1] + 20) // Adjust the y-coordinate
          .text(`${data.location}`)
          .style("fill", "black")
          .style("font-size", "0.8vw") // Set the font size
          .raise();

        const clipRadiusScale = d3
          .scaleLinear()
          .domain([0, d3.max(csvData, (d) => +d.duration)])
          .range([0, 250]);

        const clipRadius = clipRadiusScale(+data.duration);

        const clipPath = mapGroup
          .append("defs")
          .append("clipPath")
          .attr("id", `circle-clip-${index}`);

        clipPath
          .append("circle")
          .attr("cx", svgWidth / 2)
          .attr("cy", svgHeight / 2)
          .attr("r", clipRadius);

        mapGroup
          .append("circle")
          .attr("cx", svgWidth / 2)
          .attr("cy", svgHeight / 2)
          .attr("r", clipRadius - 1)
          .style("fill", "#419AD1")
          .attr("stroke", "blue")
          .attr("stroke-width", 0);

        mapGroup.attr("clip-path", `url(#circle-clip-${index})`);

        mapGroup
          .append("g")
          .selectAll("path")
          .data(worldData.features)
          .enter()
          .append("path")
          .attr("fill", "#9BD441")
          .attr("d", d3.geoPath().projection(projection))
          .style("stroke", "#fff");

        const xSize = 5;
        mapGroup
          .append("line")
          .attr("x1", projection([+data.longitude, +data.latitude])[0] - xSize)
          .attr("y1", projection([+data.longitude, +data.latitude])[1] - xSize)
          .attr("x2", projection([+data.longitude, +data.latitude])[0] + xSize)
          .attr("y2", projection([+data.longitude, +data.latitude])[1] + xSize)
          .style("stroke", "#79726B")
          .attr("stroke-width", 2);
        mapGroup
          .append("line")
          .attr("x1", projection([+data.longitude, +data.latitude])[0] - xSize)
          .attr("y1", projection([+data.longitude, +data.latitude])[1] + xSize)
          .attr("x2", projection([+data.longitude, +data.latitude])[0] + xSize)
          .attr("y2", projection([+data.longitude, +data.latitude])[1] - xSize)
          .style("stroke", "#79726B")
          .attr("stroke-width", 2);
      });

      const xScale = d3
        .scaleLinear()
        .domain([0, csvData.length - 1])
        .range([0, svgWidth * (csvData.length - 1)]);

      const xAxis = d3
        .axisBottom(xScale)
        .tickValues(d3.range(csvData.length))
        .tickFormat((i) => `${csvData[i].start_year} - ${csvData[i].end_year}`);

      mapsContainer
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(135, 0)`)
        .call(xAxis)
        .attr("stroke-width", 3)
        .style("font-size", "15px")
        .style("color", "#79726B");
    });
  };

  const handleDropOver = (e) => {
    e.preventDefault();
    dropAreaRef.current.classList.add("drag-over");
  };

  const handleDropLeave = () => {
    dropAreaRef.current.classList.remove("drag-over");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dropAreaRef.current.classList.remove("drag-over");

    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  // const downloadCSVFile = () => {
  //   const filePath = "/path/to/your/file.csv"; // Replace with the actual path to your CSV file

  //   fetch(filePath)
  //     .then((response) => response.blob())
  //     .then((blob) => {
  //       const url = window.URL.createObjectURL(new Blob([blob]));
  //       const link = document.createElement("a");
  //       link.href = url;
  //       link.setAttribute("download", "downloaded_file.csv");
  //       document.body.appendChild(link);
  //       link.click();
  //       document.body.removeChild(link);
  //     })
  //     .catch((error) => console.error("Error downloading CSV file:", error));
  // };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "right" }}>
        {/* <div style={{ marginTop: "3%" }}>
          <button style={{ padding: "5%" }} onClick={downloadCSVFile}>
            Download Sample CSV
          </button>
        </div> */}
        <div
          ref={dropAreaRef}
          id="drop-area"
          onClick={handleClick}
          onDragOver={handleDropOver}
          onDragLeave={handleDropLeave}
          onDrop={handleDrop}
          style={{
            border: "2px dashed #ccc",
            padding: "20px",
            textAlign: "center",
            cursor: "pointer",
            width: "20%",
            margin: "2%",
            alignItems: "flex-end",
          }}>
          <p id="title">{title}</p>
          <input
            ref={fileInputRef}
            type="file"
            id="file-input"
            accept=".csv"
            onChange={handleFileInputChange}
            style={{ display: "none" }}
          />
        </div>
      </div>
      <div ref={mapContainerRef} id="map-container"></div>
    </div>
  );
};

export default MapChart;
