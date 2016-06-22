let map; // the google map
let latlng = []; // geolocation data later retrieved from server in func callback
const markers = []; // array of all markers (unfiltered)

let startAllowed; // boolean to enforce start() invocation once only between refreshes
const pos = []; // array of lat, lng representing the polyline start and endpoints created by clicking map
let posIndex = 0; // index constiable associate with pos[]

/**
 * Render the basic google map
 */
function initialize() {
  rendermap();
  retrieveMarkerLocations();
}

/**
 * The basic map, no markers, no centre specified
 * Canvas id on html is 'googleMap'
 */
function rendermap() {
  const mapProp = {
    mapTypeId:google.maps.MapTypeId.ROADMAP
  };
  //map = new google.maps.Map(document.getElementById("googleMap"), mapProp); // using vanilla js
  map = new google.maps.Map($("#googleMap")[0], mapProp); // using jQuery
}

/**
 * Use ajax call to get users and their geolocations
 * pass returned array marker locations to callback method
 * Here is the format in which marker data stored
 * geoObj[0] is descripion.             
 * geoObj[1] is latitude                              
 * geoObj[2] is longitude  
 * We use geoObj[0] in the infoWindow. Click marker to reveal description.
 */
function retrieveMarkerLocations()
{
  $(function() {
    $.get("/application/geolocations", function(data) {
      $.each(data, function(index, geoObj) {
        console.log(geoObj[0] + " " + geoObj[1] + " " + geoObj[2]);
    });
      callback(data);
    });
  });
}

/**
 * we've got the marker location from data in ajax call
 * we now put data into an array
 * the format is 'firstName, xx.xxxx, yy.yyyyy' -> (firstName, lat, lng)
 * then invoke 'fitBounds' to render the markers, centre map and create infoWindow to display firstName
 */
function callback(data)
{
  latlng = data; // store the array of data in a global for later use
  fitBounds(latlng); // then invoke fitBounds to zoom and display markers within view
  setInfoWindowListener(latlng);
}

/**
 * creates and positions markers
 * sets zoom so that all markers visible
 */
function fitBounds(latlngStr)
{
  const bounds = new google.maps.LatLngBounds();
    for (let i = 0; i < latlngStr.length; i++) 
    {
        marker = new google.maps.Marker({
            position: getLatLng(latlngStr[i]),
            map: map
        });
        markers[i] = marker;      
        bounds.extend(marker.position);
    }
    map.fitBounds(bounds);
}

function setInfoWindowListener(latlngStr)
{
    const infowindow = new google.maps.InfoWindow();
    for (let i = 0; i < latlng.length; i++) 
    {
      /*respond to click on marker by displaying infowindow text*/
      const marker = markers[i];
      google.maps.event.addListener(marker, 'click', (function (marker, i) {
          return function () {
            infowindow.setContent(latlngStr[i][0]);
            infowindow.open(map, marker);
          }
      })(marker, i));
    }
}
/**
 * A helper function to convert the latlng string to individual numbers
 * and thence to a google.maps.LatLng object
 * @param str str is list of strings : username, lat, lon    
 * str[0] is description                
 * str[1] is latitude                              
 * str[2] is longitude                             
 * 
 * @param The object 'str' holding an individual marker data set
 * @return A google.maps.LatLng object containing the marker coordinates.
 */
function getLatLng(str)
{ 

  const lat = Number(str[1]);
  const lon = Number(str[2]);
  return new google.maps.LatLng(lat, lon);
}

/** ***************************** filtering markers ************************** */
/**
 * registers click listener to capture lat,lng
 * clicked point data stored in array (pos[])
 */
function start() {
  if (startAllowed == false) {
    alert("Reset to Start");
    return;
  }
  $('#usertable').empty();
  listenerHandler = google.maps.event.addListener(map, 'click', function(e) {
    pos[posIndex] = e.latLng;
    if (posIndex > 0) {
      polyline(posIndex - 1, posIndex);
    }
    posIndex += 1;
  });

}

/**
 * Stop drawing the sequence of polylines 
 * Update listeners Invoke drawPolygon method
 */
function stop() {
  polyline(pos.length - 1, 0); // close the polygon: last to first points
  // it would be better to somehow convert existing polyline to polygon
  // but for the moment this will do - overlaying polyline with polygon
  drawPolygon();
  google.maps.event.removeListener(listenerHandler);
  listenerHandler = null;
  startAllowed = false; // ensures start() invokable once only between
  // refreshes
}

/**
 * (re)initialize array of locations falling within poly overlay.
 *  Recall latlng[i][0] contains description and latlng[i][1] and latlng[i][2]
 * the latitude & longitude respectively. In this method the markers falling
 * within polyon are rendered and those outside are not displayed
 */
function filter() {
  for (let i = 0; i < latlng.length; i += 1) {
    const point = new google.maps.LatLng(latlng[i][1], latlng[i][2]);
    if (google.maps.geometry.poly.containsLocation(point, polygon)) {
      markers[i].setVisible(true);
      // populateTableRow(latlng[i]);
    } else {
      markers[i].setVisible(false);
    }
  }
}

/**
 * Clears table row data Restores table data with complete unfiltered user list
 */
function reset() {
  location.reload();
}

/**
 * create and render a polyline on map attaches beginning to end previous
 * polyline if such exists
 * 
 * @param prevIndex
 * @param index
 */
function polyline(prevIndex, index) {
  const coords = [
      new google.maps.LatLng(pos[prevIndex].lat(), pos[prevIndex].lng()),
      new google.maps.LatLng(pos[index].lat(), pos[index].lng())];

  const line = new google.maps.Polyline({
    path : coords,
    geodesic : true,
    strokeColor : '#FF0000',
    strokeOpacity : 1.0,
    strokeWeight : 2
  });
  line.setMap(map);
}

/**
 * Use data (pos[]) to draw polygon
 */
function drawPolygon() {
  const lineCoords = [];
  // log the coordinates
  // draw polygon defined by coordinates
  for (let j = 0; j < pos.length; j += 1) {
    console.log(pos[j].lat + " " + pos[j].lng);
    lineCoords[j] = new google.maps.LatLng(pos[j].lat(), pos[j].lng());
  }
  // make last point same as first to close the polygon
  lineCoords[pos.length] = new google.maps.LatLng(pos[0].lat(), pos[0].lng());

  polygon = new google.maps.Polyline({
    path : lineCoords,
    geodesic : true,
    strokeColor : '#FF0000',
    strokeOpacity : 1.0,
    strokeWeight : 2
  });

  polygon.setMap(map);
  google.maps.event.clearListeners(map, 'click');
}

google.maps.event.addDomListener(window, 'load', initialize);


