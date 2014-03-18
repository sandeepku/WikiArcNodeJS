/**
 * Created by sandeepk on 13.02.14.
 */

var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    ObjectID = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStore = require('mongodb').GridStore,
    Grid = require('mongodb').Grid,
    Code = require('mongodb').Code,
    BSON = require('mongodb').pure().BSON,
    async = require('async');



MongoCache=function(server,port,database,collection)
{

    this.server=server;
    this.port=port;
    this.database=database;
    this.db;
    this.collection;//this.collection=collection;


    //open this connection once
    MongoClient.connect("mongodb://" + server + ":" + port + "/" + database + "?auto_reconnect=true", function(err, db) {
        if(err){console.log(err);callback(err);}

        if(db!=null){
            this.db=db;
            this.collection= db.collection("wikilocation");
        }
    });


   // this.cacheCollection=layerName;// + layerName + "-" + serviceId + "-" + layerId;//weired but has to be done to maintain uniqueness.
    this._queryCache=function(param, callback) {
        // var db=this.db;
        var server=this.server;
        var port=this.port;
        var database=this.database;
        var collection=this.collection;
       // MongoClient.connect("mongodb://" + server + ":" + port + "/" + database + "?auto_reconnect=true", function(err, db) {
        var options = {
            "limit": 200,
            "skip": 0
        }
        collection.find(param,options).toArray(function(err, items){
            //db.close();
            if(err) console.log(err);

            callback(null, items);

        });
    };

    this.writeCache=function(param,callback){
        var collection=this.collection;
        collection.save(param,function(err, items){
            //db.close();
            if(err) console.log(err);

            callback(null, items);

        });
    }
    return this;

}

MongoCache.prototype = {

    writeToCollection: function(arrData,callback)//returns the written documents.
    {
        var arroutput=[];
        var data=arrData;
        var db=this.db;
        var writecache=this.writeCache;
        //var cacheCollection=this.cacheCollection;
        //TODO check for types and null values in the object.


        //loop through the array elements and add an identifier _id to the json object.
        //as of now works only for hardcoded collection, will find out lateer wht is causing this behaviour
        async.forEach(Object.keys(data), function (item, callback){
            if (data[item] === "undefined" || data[item] === null || typeof data[item] === "undefined") {
                console.log("_WikiFeature value is undefined");
            } else {

                //add the _id to teh existing JSON object.
                var currentData=data[item];
                //manipulate the object a little bit
                currentData._id=currentData.id;//adjustment to add the _id field, which is actualy coming from the dataset itself.
                currentData.geometry={type : "Point" ,coordinates:[ currentData.location.lon, currentData.location.lat ] } //currently considering only points...will consider polygon aswell
                async.map([currentData], writecache, function (error, result) {
                    if (error) {
                        console.log(error);
                        callback(error);
                    } else {
                        //console.log("in" + result);
                        if(result){
                            arroutput.push(currentData);

                            callback(null, result);
                        }
                    }
                });
            }
        }, function(err) {
                    if(err)callback(err);
                    callback(null, arroutput);
                    //console.log("done");
         });


    },

    getDataFromCache:function(arrGeometry,callback)//array of geometry envelopes, which requires to be searched for
    // return will be the combined result of the items found in the mongo cache
    {
        var arroutput=[];
        var db=this.db;
        var data=arrGeometry;
        var collection=this.collection;
        var queryCache=this._queryCache;

                async.forEach(Object.keys(data), function (item, callback){
                    if (data[item] === "undefined" || data[item] === null || typeof data[item] === "undefined") {
                        console.log("_WikiFeature geometry value is undefined");
                    } else {
                        var boxGeometry=data[item];
                        //first construct the box required to be used as a filter.
                        //var box = options.geometry;
                        var queryOpts = {"geometry":{ $geoWithin:{ $geometry:{"type":"Polygon","coordinates":[[
                            [boxGeometry.xmin, boxGeometry.ymin],
                            [boxGeometry.xmax, boxGeometry.ymin],
                            [boxGeometry.xmax, boxGeometry.ymax],
                            [boxGeometry.xmin, boxGeometry.ymax],
                            [boxGeometry.xmin, boxGeometry.ymin]
                        ]]}}}};//expecting the coordinates from esri geom / terraformers geojson bbox kind of a module

//console.log(JSON.stringify(queryOpts));


                        async.map([queryOpts], queryCache, function (error, result) {
                            if (error) {
                                console.log(error);
                                callback(error);
                            } else {
                                //console.log("in" + result);
                                if(result){
                                    arroutput.push(result);
                                    callback(null, result);
                                }
                            }
                        });

                    }
                    //callback(); // tell async that the iterator has completed
                    //changed cause the callback will come from the async.map function call
                }, function(err) {
                    if(err)callback(err);

                   // console.log("done");
                    callback(null, arroutput);

                });
    }
}
/*
// Connect to the db
this.db.open(function(err, p_db) {
    this.db = p_db;
});*/

module.exports.MongoCache = MongoCache;
