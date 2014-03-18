var dataproviderbase = require("../../src/dataproviderbase"),
  util = require("util"),
  request = require("request").defaults({ json: true }),
  path = require("path"),
  fs = require("fs"),
  http = require('http'),
  terraformer = require("terraformer"),
  async = require("async"),
  querystring = require('querystring');




var mongocache=require("./resources/MongoCache");

var cacheControl;

 



var wikiMapURL = "api.wikimapia.org",
    wikiKey = "E10A5E44-E8B8B461-596F7957-E04A47BD-74EF8F23-8330E737-33DC021C-59242BFE";

var geomserverendpoint = "tasks.arcgisonline.com";




var newMapTemplate = "http://www.arcgis.com/home/webmap/viewer.html?url=%s&source=sd";

var worldMapTemplate = "<a href='%s/webmaps/world-bikeshares/index.html'>World Bikeshare App</a>";

//field definitions for the wiki map layers
//Location
var wikiLocationFields = [
  {"name" : "id", "type" : "esriFieldTypeInteger", "alias" : "ID", "nullable" : "true"},
  {"name" : "title", "type" : "esriFieldTypeString", "alias" : "Title", "length" : "255", "nullable" : "true"},
  { "name": "description", "type": "esriFieldTypeString", "alias": "Description", "length": "255", "nullable": "true" },
  { "name": "country", "type": "esriFieldTypeString", "alias": "Country", "length": "100", "nullable": "true" },
  { "name": "city", "type": "esriFieldTypeString", "alias": "City", "length": "100", "nullable": "true" },
  { "name": "thumbnail", "type": "esriFieldTypeString", "alias": "Thumbnail", "length": "255", "nullable": "true" },
  { "name": "fullimage", "type": "esriFieldTypeString", "alias": "Picture", "length": "255", "nullable": "true" },
  { "name": "wiki", "type": "esriFieldTypeString", "alias": "Wiki", "length": "255", "nullable": "true" }


];

var wikiRegionFields = [
  { "name": "id", "type": "esriFieldTypeInteger", "alias": "ID", "nullable": "true" },
  { "name": "title", "type": "esriFieldTypeString", "alias": "Title", "length": "255", "nullable": "true" },
  { "name": "description", "type": "esriFieldTypeString", "alias": "Description", "length": "255", "nullable": "true" },
  { "name": "country", "type": "esriFieldTypeString", "alias": "Country", "length": "100", "nullable": "true" },
  { "name": "city", "type": "esriFieldTypeString", "alias": "City", "length": "100", "nullable": "true" },
  { "name": "thumbnail", "type": "esriFieldTypeString", "alias": "Thumbnail", "length": "255", "nullable": "true" },
  { "name": "fullimage", "type": "esriFieldTypeString", "alias": "Picture", "length": "255", "nullable": "true" },
  { "name": "wiki", "type": "esriFieldTypeString", "alias": "Wiki", "length": "255", "nullable": "true" }

];

//var drawingInfo = JSON.parse(fs.readFileSync(path.join(path.dirname(module.filename),"resources","templates","layerDefinition-drawingInfo.json"), 'utf8'));


var wikiLocationServiceId = 0,
  wikiLocationServiceName = "Wiki location",
  wikiRegionServiceId = 1,
  wikiRegionServiceName = "Wiki Region";
  
  
var extentMinWidth = 0.1, // In 4326 units (decimal degrees)
  extentMinHeight = 0.1; // In 4326 units (decimal degrees)

var states = {
  empty: "empty",
  loading: "loading",
  caching: "caching",
  loaded: "loaded"
};

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};


var _services = {
    "wikimapia": {
        0: "Wiki Location",
        1: "Wiki Region"
    }
};


//sandeep..define wiki mapia init handler..
WikiMapia = function (app) {
    WikiMapia.super_.call(this);

    cacheControl=new mongocache.MongoCache("127.0.0.1",27017,"wikimapia","wikilocation",function(err,result)
    {
        if(err)console.log("error while connecting to mongo " + err);

    });
    
//get a handle to the wiki location information with X & Y and no polygons
//give a static name to it..
//set fields..symbology & other attributes..
};

// This node.js helper function allows us to inherit from dataproviderbase.
util.inherits(WikiMapia, dataproviderbase.DataProviderBase);



function parseServiceId(serviceId)
{
    return "wikimapia";
}
function parseLayerId(serviceId, layerId){
    var r = {
        serviceId: serviceId,
        layerId: layerId,
        idField:"id",
        nameField:"title",
        fields:[],
        name: "",
        geomtype:""
    };
    switch (r.layerId) {
        case "0":
            r.name = "Wiki Location";
            r.geomtype="esriGeometryPoint";
            r.fields=wikiLocationFields;

            break;
        case "1":
            r.name = "Wiki Region";
            r.geomtype="esriGeometryPolygon";
            r.fields=wikiRegionFields;
            break;
    }
    return r;

}

/*
function testhttp() {
    var options = {
        host: 'api.wikimapia.org',
        port: 80,
        path: '/?key=example&function=place.getbyarea&coordsby=bbox&bbox=2.292493%2C48.8590143%2C2.293493%2C48.8599143&format=json&pack=&language=en&data_blocks=main%2Clocation%2C&page=1&count=50&category=&categories_or=&categories_and=',
        method: 'GET'
    };

    var req = http.request(options, function (res) {
        //console.log('STATUS: ' + res.statusCode);
        //console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('BODY: ' + chunk);
        });
    });

    // write data to request body
    req.end();

}*/



//wiki specific methods..
var callwikiGetByArea=function(param, callback) {
    //callback(null, wikiutil.wikiGetByArea(param));
    var geometryGeom = "{\"geometryType\" : \"esriGeometryEnvelope\", \"geometries\" : [ {\"xmin\":36000,\"ymin\":20000,\"xmax\":60000,\"ymax\": 25000}]}";
    //http://api.wikimapia.org/?key=E10A5E44-E8B8B461-596F7957-E04A47BD-74EF8F23-8330E737-33DC021C-59242BFE&function=place.getbyarea&coordsby=bbox&bbox=2.292493%2C48.8590143%2C2.293493%2C48.8599143&format=json&pack=&language=en&data_blocks=main%2Clocation%2C&page=1&count=100&category=&categories_or=&categories_and=
    //console.log(param);
    //perform the tranformation..
    //'example',//
    var post_data = querystring.stringify({
        'format': 'json',
        'function': 'place.getbyarea',
        'coordsby': 'bbox',
        'data_blocks':'main,photos,location',
        'key': 'E10A5E44-E8B8B461-596F7957-E04A47BD-74EF8F23-8330E737-33DC021C-59242BFE',
        'language': 'en',
        'count': 100,
        'page': 1
    });
    //another data source..
    //http://www.geonames.org/export/wikipedia-webservice.html
   // process.nextTick(function () {
        request.get({
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            //url: 'http://api.wikimapia.org/?key=E10A5E44-E8B8B461-596F7957-E04A47BD-74EF8F23-8330E737-33DC021C-59242BFE&function=place.getbyarea&format=json&coordsby=bbox&bbox=2.292493%2C48.8590143%2C2.293493%2C48.8599143&language=en&count=100&page=1'
            url: 'http://api.wikimapia.org/?' + post_data + '&bbox=' + param
                
        }, function (error, response, body) {
            //console.log(error);
            if (error) {
                console.log("error in callwikiGetByArea::" + error);
                callback(error);
            }
            if (!error && response.statusCode == 200) {
                //console.log("response from wiki::" + JSON.stringify(body));
                geom = JSON.stringify(body);
                callback(null, geom);
            }

        });
   // });
    //request.end();
}

//little brute force way to handel this
function _createWikiFeature(/* Object */ data) {

    //process photodata.
    var photo;
    //console.log(data.photos);
    if(typeof data.photos === "undefined" ||  data.photos[0]==null || typeof data.photos[0] === "undefined"){
        photo={
            thumbnail_url:"",
            big_url:""
        }
    }else{
        photo= data.photos[0];
       // console.log(photo);
    }

    var feature = {
        geometry: {
            x: typeof data.location.lon === "undefined" ? 0.0 : data.location.lon,
            y: typeof data.location.lat === "undefined" ? 0.0 : data.location.lat,
            spatialReference: {
                wkid: 4326
            }
        },
        attributes: {
            
            id: typeof data.id === "undefined" ? 1 : data.id, 
            title: typeof data.title === "undefined" ? "" : data.title,
            description: typeof data.description === "undefined" ? "" : data.description,
            country: typeof data.location.country === "undefined" ? "" : data.location.country,
            city: typeof data.location.city === "undefined" ? "" : data.location.city,

            thumbnail: typeof photo.thumbnail_url === "undefined" ? "" : photo.thumbnail_url,
            fullimage: typeof photo.big_url === "undefined" ? "" : photo.big_url,
            wiki: typeof data.urlhtml === "undefined" ? "" : data.urlhtml
        }
    };
    //console.log(feature);
    return feature;
}

var outGeom = null;

// DataProvider Overrides (see src/dataproviderbase.js).
Object.defineProperties(WikiMapia.prototype, {
  name: {
    get: function() {
      // Override the service name - every data provider should override this.
      return "wikimapia";
    }
  },
  isReady: {
    get: function() {
      // Since we depend on some async stuff, we might not be ready immediately.
      // We'll track our readiness in the constructor and return whatever that says
      // is the case.
      return this._isReady;
    }
  },
  getServiceIds: {
    value: function(callback) {
        // Override the service name - every data provider should override this.
        // callback(Object.keys(this._services), null);
        callback(["wikimapia"], null);//callback(Object.keys(this._services), null);
    }
  },
  getLayerIds: {
    value: function(serviceId, callback) {
        // Override the service name - every data provider should override this.
        callback([wikiLocationServiceId, wikiRegionServiceId], null);
    }
  },
  getServiceName: {
      value: function (serviceId) {
          return parseServiceId(serviceId);//as of now there is going to be one Feature Layer only
      }
  },
  getLayerName: {
    value: function(serviceId, layerId) {
        var c = parseLayerId(serviceId, layerId);
        return c.name;
    }
  },
  geometryType: {
      value: function(serviceId, layerId) {
          var c = parseLayerId(serviceId, layerId);
          return c.geomtype;
      }
  },
  idField: {
    value: function(serviceId, layerId) {
        var c = parseLayerId(serviceId, layerId);
        return c.idField;
    }
  },
  nameField: {
    value: function(serviceId, layerId) {
        var c = parseLayerId(serviceId, layerId);
        return c.nameField;
    }
  },
  fields: {
    value: function(serviceId, layerId) {
        var c = parseLayerId(serviceId, layerId);
        return c.fields;
    }
  },
 


  getFeatureServiceDetails: {
      value: function (detailsTemplate, serviceId, callback) {
          this.getLayerIds(serviceId, (function (layerIds, err) {
              callback(layerIds, this.getLayerNamesForIds(serviceId, layerIds), err);
          }).bind(this));
      }
  },
  updateFeatureServiceDetailsLayersList:{
      value:function(serviceId, layersDetails, callback)
   {

        return callback(layersDetails, null);
    }
  },
  getFeatureServiceLayerDetails: {
      value: function (detailsTemplate, serviceId, layerId, callback) {
         // if (layerId === allNetworksServiceId) {
              var c = parseLayerId(serviceId, layerId);
          //console.log("c------" + JSON.stringify(c));
              return callback({
                  layerName: c.name,
                  idField: c.idField,
                  nameField: c.nameField,
                  fields: c.fields,
                  geometryType: c.geomtype
              }, null);
         // }
      }
  },
  featuresForQuery: {
    value: function(serviceId, layerId, query, callback) {



        //main function for the geom query..
        //first handle the basic feature request from AGOL
        if (query.geometryType === "esriGeometryEnvelope") {
            var geom = query.geometry;
            var transformedgeom;



            //get the fields and ids here..
            var idField = this.idField(serviceId, layerId);
            var fields = this.fields(serviceId, layerId);

            var arrResults=[];
            //validate the geometry and proceed to projection..
            if (typeof (geom) == 'object') {
                var box = new terraformer.Polygon([[
                            [geom.xmin, geom.ymin],
                            [geom.xmin, geom.ymax],
                            [geom.xmax, geom.ymax],
                            [geom.xmax, geom.ymin],
                            [geom.xmin, geom.ymin]
                ]]);
                if (geom.spatialReference && geom.spatialReference.wkid == '102100') {//check to see if this is in travrs mercator
                    transformedgeom=box.toGeographic();
                } else {
                    transformedgeom=box;
                }
            }
            if (typeof (transformedgeom) == 'object') {
                //console.log(transformedgeom.bbox()[0]);
                var strtransformedgeom = JSON.stringify(transformedgeom.bbox());
                strtransformedgeom = strtransformedgeom.substr(1, strtransformedgeom.length - 2);//small adjustment to 
                //console.log(strtransformedgeom);
               // console.log();//[10.898437499746374,59.88728874163541,11.074218749746136,59.97536170730167]
                //console.log(JSON.stringify(geom.spatialReference));//{"wkid":102100}
                //console.log("in");

                async.parallel(//using parallels cause we want to fetch the results form the cache aswell as record new elements
                    [
                        //first callback to get the data from the cache, if available.
                        function(callback)
                        {
                            var querydata=[{"xmin": transformedgeom.bbox()[0],"ymin":transformedgeom.bbox()[1],"xmax":transformedgeom.bbox()[2],"ymax":transformedgeom.bbox()[3]}];

                            cacheControl.getDataFromCache(querydata,function(err,result){
                                if(err){
                                    console.log("Error in getting data from cache-- " + err);
                                    //callback(true);//chck the results like this
                                }else{
                                    //console.log("actual results from cache " + JSON.stringify(result));
                                    arrResults.push(result);
                                    callback(false);
                                }

                            });
                        },
                        //this is the live call to the webservice..record it..
                        function(callback){
                            async.map([strtransformedgeom], callwikiGetByArea, function (error, result) {
                                if (error) {
                                    console.log(error);
                                    callback(true);//chck the results like this
                                } else {
                                    //console.log("results ::" + JSON.stringify(result));
                                   // callback(false);
                                    //callback(null, result);
                                    //now record this...
                                    if(result){
                                        callback(false);//sending teh callback cause this would create duplicate data elements..

                                        //check this result from the live datastream, if things look messy then no point writing it.
                                        //console.log(result.places);
                                        var data = JSON.parse(result);

                                        if (data == "undefined" || data.places == null || typeof data == "undefined"||data.places == "undefined") {
                                        }else
                                        {
                                            if((typeof (data.places) == 'object') && (typeof (data.places) != null)){
                                                cacheControl.writeToCollection(data.places,function(err,savedresult){
                                            if(err){
                                                console.log("Error------ " + err);
                                            }else{
                                                if(savedresult){
                                                   // arrResults.push(savedresult);
                                                    //console.log("results from service " + JSON.stringify(result));
                                                }else{
                                                    // console.log("results " + result);
                                                }
                                                // callback(false);
                                            }
                                            });
                                            }
                                        }
                                    }
                                }
                            });
                        }

                    ],function(err,finalresults)
                    {
                       // console.log("final" + finalresults);
                        if (!err) {
                            if(arrResults)
                            {
                            var data =  JSON.stringify(arrResults);
                                if(data.length>6){
                                    var processedData=JSON.parse(data.substr(3,data.length-6));

                                    var arrayTemp = [];
                                    //console.log(data.places);
                                    for (var t in processedData) {
                                        //console.log(processedData[t]);
                                        if (processedData[t] === "undefined" || processedData[t] === null || typeof processedData[t] === "undefined") {
                                            console.log("_WikiFeature value " + t + " = undefined");
                                        } else {
                                            var feature = _createWikiFeature(processedData[t]);
                                            arrayTemp.push(feature);
                                        }
                                    }
                                    callback(arrayTemp, idField, fields, "");

                                }
                            }
                           /* var arrayTemp = [];
                            //console.log(data.places);
                            for (var t in data.places) {
                                if (data.places[t] === "undefined" || data.places[t] === null || typeof data.places[t] === "undefined") {
                                    console.log("_WikiFeature value " + t + " = undefined");
                                } else {
                                    var feature = _createWikiFeature(data.places[t]);
                                    arrayTemp.push(feature);
                                }
                            }
                            callback(arrayTemp, idField, fields, "");
                            */
                            //let us figure out hw to parse the data to the required format
                        } else {
                            console.log(err);
                        }
                    }
                )
                /*
                async.waterfall(
                        [
                            //first call the wiki with the parameters..
                            function (callback)
                            {
                                console.log(cacheControl);
                                async.map([strtransformedgeom], callwikiGetByArea, function (error, result) {
                                    if (error) {
                                        console.write(error);
                                    } else {
                                        //console.log("results ::" + JSON.stringify(result));
                                        callback(null, result);
                                    }
                                });
                            },
                            //get the result then parse it according to the structure described.
                            function (wikiresults, callback)
                            {
                                callback(null, wikiresults);
                            }

                        ],
                        //the final call back function to get the results
                        function (err, finalresults) {
                            if (!err) {
                                var data = JSON.parse(finalresults);
                                var arrayTemp = [];
                                //console.log(data.places);
                                for (var t in data.places) {
                                    if (data.places[t] === "undefined" || data.places[t] === null || typeof data.places[t] === "undefined") {
                                        console.log("_WikiFeature value " + t + " = undefined");
                                    } else {
                                        var feature = _createWikiFeature(data.places[t]);
                                        arrayTemp.push(feature);
                                    }
                                }
                                callback(arrayTemp, idField, fields, "");
                                //let us figure out hw to parse the data to the required format
                            } else {
                                console.log(err);
                            }
                            
                        }
                    );
                
*/

                //this method works
                /*
                async.map([strtransformedgeom], callwikiGetByArea, function (error, result) {
                    if (error) {
                        console.write(error);
                    } else {
                        //console.log("results ::" + JSON.stringify(result));
                        
                        //console.log(result);
                        for (place in result.places) {
                            console.log(place.location.city);
                        }
                        
                        
                    }
                });*/

                //console.log("out" );
                

            }
        }

    }
  }
});




// This allows node.js to import the right things when someone does a require() on us.
exports.WikiMapia = WikiMapia;
