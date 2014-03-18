/**
 * Created by sandeepk on 25.02.14.
 */
var url = getParameterByName("url"),
    layerFS = null;

function getParameterByName(name) {
    //console.log("original url " + name);
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
    return results == null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));

}


function setExtentToFeatureLayer(endpoint) {
    //var arrendpoint=endpoint.split(',');
    var featureServiceDescriptionUrl = endpoint + "?f=json";
    var jsonfile = new XMLHttpRequest();
    jsonfile.open("GET", featureServiceDescriptionUrl, true);

    jsonfile.onreadystatechange = function() {

        if (jsonfile.readyState == 4) {

            if (jsonfile.status == 200) {
                //console.log(jsonfile.responseText);
                var extent = JSON.parse(jsonfile.responseText).extent;
                console.log(JSON.stringify(extent));

                var bounds = {
                    "type": "MultiPoint",
                    "coordinates": [
                        [extent.ymin, extent.xmin],
                        [extent.ymax, extent.xmax]
                    ]
                };
                if (extent.spatialReference.wkid === 102100) {
                    var bc = bounds.coordinates;
                    bounds.coordinates = [
                        [bc[0][1], bc[0][0]],
                        [bc[1][1], bc[1][0]]
                    ];
                    bounds = Terraformer.toGeographic(bounds);
                    bc = bounds.coordinates;
                    bounds.coordinates = [
                        [bc[0][1], bc[0][0]],
                        [bc[1][1], bc[1][0]]
                    ];
                }

                //console.log(JSON.stringify(bounds.coordinates));
                //[[-90,-180],[90,180]]
                if(bounds.coordinates){
                    var center = new google.maps.LatLngBounds(new google.maps.LatLng(bounds.coordinates[0][0],bounds.coordinates[0][1],false) , new google.maps.LatLng(bounds.coordinates[1][0],bounds.coordinates[1][1],false));
                    console.log(center);
                    map.fitBounds(center);
                }
            }
        }
    };

    jsonfile.send(null);
}

function addFeatureLayer(featureServiceUrl) {
    // Add ArcGIS Online feature service
    setExtentToFeatureLayer(featureServiceUrl);
}


if (url) {
    addFeatureLayer(url);
}
