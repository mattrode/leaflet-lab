/* javascript by Matt Rodenberger, 2019 */

//global variables for legend info
var city;
var data;
var map;

//Step 1: A map needs to be created​
//function to instantiate the Leaflet map
function createMap(){
    //create the map
        map = L.map('map', {
        center: [39, -98],
        zoom: 4

    });

    //add OSM base tilelayer
    L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoicHNteXRoMiIsImEiOiJjaXNmNGV0bGcwMG56MnludnhyN3Y5OHN4In0.xsZgj8hsNPzjb91F31-rYA', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoibWF0dHJvZGUiLCJhIjoiY2pzdWdsNnJvMDJuODQ5b2VydTBuYWF4dCJ9.4RfNabbj_uH0TcKSACZ_Lw'
    }).addTo(map);

    //call getData function
    getData(map);
};

//Step 3: Add circle markers for point features to the map
function createPropSymbols(data, map, attributes){
  //create a Leaflet GeoJSON layer and add it to the map
  L.geoJson(data, {
      pointToLayer: function(feature, latlng){
          return pointToLayer(feature, latlng, attributes);
      }
  }).addTo(map);
};

  //create marker options
  var geojsonMarkerOptions = {
    radius: 8,
    fillColor: "#93aac7",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  };

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
  //scale factor to adjust symbol size evenly
  var scaleFactor = 27;
  //area based on attribute value and scale factor
  var area = attValue * scaleFactor;
  //radius calculated based on area
  var radius = Math.sqrt(area/Math.PI);

  return radius;
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){

  //Determine which attribute to visualize with proportional symbols
  var attribute = attributes[0];

  //create marker options
  var options = {
    fillColor: "#93aac7",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  };

  //For each feature, determine its value for the selected attribute
  var attValue = Number(feature.properties[attribute]);

  //Give each feature's circle marker a radius based on its attribute value
  options.radius = calcPropRadius(attValue);

  //create circle marker layer
  var layer = L.circleMarker(latlng, options);

  //global city defined here
  city = feature.properties.City;
  //original popupContent changed to panelContent
  var panelContent = "<p><b>City:</b> " + feature.properties.City + "</p>";

  //add formatted attribute to panel content string
  var year = attribute;
  panelContent += "<p><b>In the year " + year + " it rained:</b> " + feature.properties[attribute] + " inches</p>";


  //popup just the city
  var popupContent = feature.properties.City;

  //bind the popup to the circle marker
  layer.bindPopup(popupContent, {
    offset: new L.Point(0,-options.radius),
    closeButton: false
  });

  //event listeners to open popup on hover and fill panel on click
  layer.on({
    mouseover: function(){
      this.openPopup();
      city = feature.properties.City;
      $("#panel").html(panelContent);
    },
    mouseout: function(){
      // this.closePopup();
      $("#panel").html();
    },
    click: function(){
      $("#panel").html(panelContent);

      city = feature.properties.City;
      createSequenceControls(map, attributes);
    }
  });

  //return the circle marker to the L.geoJson pointToLayer option
  return layer;
};

//Step 1: Create new sequence controls
function createSequenceControls(map, attributes){
    //create range input element (slider)
    $('#panel-slider').append('<input class="range-slider" type="range">');

    //set slider attributes
    $('.range-slider').attr({
      max: 6,
      min: 0,
      value: 0,
      step: 1
    });
    //Step 5: input listener for slider
   $('.range-slider').on('input', function(){

     //Step 6: get the new index value
     var index = $(this).val();

     //Step 9: pass new attribute to update symbols
     updatePropSymbols(map, attributes[index]);
     updatePanel(map, attributes[index]);
     updateLegend(map, attributes[index]);
   });
};

function createLegend(map, attributes) {
	var LegendControl = L.Control.extend({
		options: {
			position: 'bottomright'
		},
		onAdd: function(map) {
			var legendContainer = L.DomUtil.create("div", "legend-control-container");
			// $(legendContainer).append('<div id="temporal-legend">')
			$(legendContainer).append('<div id="temporal-legend2">')
			//start attribute legend svg string
			var svg = '<svg id="attribute-legend" width="225px" height="180px">';
			//array of circle names to base loop on
			var circles = {
				max: 90,
				mean: 110,
				min: 130
			};

      svg += '<text id="label-text" x="50" y="25">Yearly Rain Data</text>';

			//loop to add each circle and text to svg string
			for (var circle in circles) {
				//circle string
				svg += '<circle class="legend-circle" id="' + circle + '" fill="#93aac7" fill-opacity="0.8" stroke="#537898" cx="50"/>';
				//text string
				svg += '<text id="' + circle + '-text" x="100" y="' + circles[circle] + '"></text>';
			};
			//close svg string
			svg += "</svg>";
			//add attribute legend svg to container
			$(legendContainer).append(svg);
			return legendContainer;
		}
	});
	map.addControl(new LegendControl());
	updateLegend(map, attributes[0]);
} // end createLegend()

function getCircleValues(map, attribute) {
	//start with min at highest possible and max at lowest possible number
	var min = Infinity,
		max = -Infinity;
	map.eachLayer(function(layer) {
		//get the attribute value
		if (layer.feature) {
			var attributeValue = Number(layer.feature.properties[attribute]);
			//test for min
			if (attributeValue < min) {
				min = attributeValue;
			};
			//test for max
			if (attributeValue > max) {
				max = attributeValue;
			};
		};
	});
	//set mean
	var mean = (max + min) / 2;

	//return values as an object
	return {
		max: max,
		mean: mean,
		min: min
	};
};

function updateLegend(map, attribute) {

	//create content for legend
  var properties;
  for (i=0; i < data.features.length; i++) {
    if (data.features[i].properties.City === city) {
      properties = data.features[i].properties
    }
  }
  var panelContent = "<p>The Total Rain in <b>City:</b> " + city + "</p>";
	var year = attribute.split("2")[1];
	var content = year;
	var rain = properties[attribute];
	//replace legend content
	$('#temporal-legend').html(content);

	//get the max, mean, and min values as an object
	var circleValues = getCircleValues(map, attribute);
	for (var key in circleValues) {
		//get the radius
		var radius = calcPropRadius(circleValues[key]);
		//assign the cy and r attributes
		$('#' + key).attr({
			cy: 136 - radius,
			r: radius
		});
		var text = Math.round(circleValues[key] * 100) / 100;
		$('#' + key + '-text').text(text.toLocaleString() + " inches");
	};
};


function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("2") > -1){
            attributes.push(attribute);
        };
    };
    return attributes;
};

//Import GeoJSON data
function getData(map){
    //load the data
    $.ajax("data/RainData.geojson", {
        dataType: "json",
        success: function(response){
            //global define data
            data = response;
            //create an attributes array
            var attributes = processData(response);
            createPropSymbols(response, map, attributes);
            createWelcomeSplash(map);
            createLegend(map, attributes);
        }
    });
};

//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(map, attribute){
         map.eachLayer(function(layer){

           if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
            var props = layer.feature.properties;

            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            //add city to popup content string
            var panelContent = "<p><b>City:</b> " + props.City + "</p>";

            //replace the layer popup
            layer.bindPopup(panelContent, {
                offset: new L.Point(0,-radius)
                          });
                        };
                   });
               };


function createWelcomeSplash() {
   var panelContent = `
    <h3>Welcome, please choose a city yo</h3>
   `;
   $("#panel").html(panelContent);

}

function updatePanel(map, attribute){
   //add city to popup content string
   var panelContent = "<p><b>City:</b> " + city + "</p>";

   //add formatted attribute to panel content string
   var year = attribute.split("2")[1];

   // updates the city
   var i;
   var properties;
   for (i=0; i < data.features.length; i++) {
     if (data.features[i].properties.City === city) {
       properties = data.features[i].properties
     }
   }

   // changes the rain data in the legend
   panelContent += "<p><b>In the year " + attribute + " it rained:</b> " + properties[attribute] + " inches</p>";

   $("#panel").html(panelContent);
};



$(document).ready(createMap);
