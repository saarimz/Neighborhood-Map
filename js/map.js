let map;
function initMap() {
    map = new google.maps.Map(document.getElementById("map"),{
        center: {lat: 40.7134, lng: -74.0055},
        zoom: 12
    });
}

function mapError() {
    document.getElementById("map").innerHTML = `<p>Unable to load map. Please try again later.</p>`
    console.log("Unable to load map from Google API");
}