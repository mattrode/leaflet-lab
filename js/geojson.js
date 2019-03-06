/* Map of GeoJSON data from MegaCities.geojson */

//function to instantiate the Leaflet map
function createMap(){
    //create the map
    var map = L.map('map', {
        center: [20, 0],
        zoom: 2
    });

    //add OSM base tilelayer
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoibWF0dHJvZGUiLCJhIjoiY2pzdWdsNnJvMDJuODQ5b2VydTBuYWF4dCJ9.4RfNabbj_uH0TcKSACZ_Lw'

    }).addTo(map);

    //call getData function
    getData(map);
};

//function to retrieve the data and place it on the map
function getData(map){
    //load the data
    $.ajax("data/MegaCities.geojson", {
        dataType: "json",
        success: function(response){

            //create a Leaflet GeoJSON layer and add it to the map
            L.geoJson(response).addTo(map);
        }
    });
};

$(document).ready(createMap());
