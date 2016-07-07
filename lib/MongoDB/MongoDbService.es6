"use strict";

import {MongoClient} from "mongodb";
import Q from "q";

let protectedDbInstance;

export class MongoDbService {

  constructor({config, logger}) {
    if (!config || !config.mongoDb.connectionString) {
      throw new Error("MongoDB connection string not available");
    }

    /** @member {string} Connection string to database. */
    this.connectionString_ = config.mongoDb.connectionString;

    /** @member {Object} Options object to pass to the driver connect method. */
    this.connectionOptions_ = config.mongoDb.connectionOptions;

    /** @member {string} Operation timeout in ms. */
    this.operationTimeout_ = config.mongoDb.operationTimeout;

    /** @member {number} The default timeout for promises in ms */
    this.promiseTimeout_ = config.mongoDb.promiseTimeout;

    /** @member {onject} logger instance for loogging */
    this.loggerInstance_ = logger;

    /** @member {Q.Promise} Promise which represents the db connection and resolves to the db controller object. */
    this.dbConnection_ = Q.reject(new Error("Error in MongoDB connection..."));
  }

  /**
   * Create connection to the mongodb database.
   * @private
   * @returns {Q.Promise} A promise which resolves the connection to the mongodb client.
   */
  connectToDB() {
    this.loggerInstance_.debug("Connecting to db with options: ", this.connectionString_);
    this.dbConnection_ = Q.ninvoke(MongoClient, "connect", this.connectionString_, this.connectionOptions_);
    return this.dbConnection_;
  }

  /**
   * function for creating the mongodb object.
   * @returns {object} mongodb object after creating the connection.
   */
  getMongoDBObject() {

    return this.dbConnection_
      .catch(err => {
        this.loggerInstance_.debug(" MongoDB connection is not available");
        this.loggerInstance_.debug(err);
        return this.connectToDB();
      })
      .then(dbConn => {
        this.loggerInstance_.debug("Mongodb connection created successfully");
        return dbConn;
      });
  }

  /**
   *@param {object} query read query
   *@returns {object} returns promise for read query
   */
  readQuery(query) {

    return {
      "fields": query.fields || {},
      "limit": query.limit || 0,
      "skip": query.skip || 0,
      "sort": query.sort || {}
    };
  }

  /**
   *@param {object} options map reduce options
   *@returns {object} returns object for map reduce options
   */
  readMapReduceOptions(options) {
    return {
      "out": options.out || {"inline": 1},
      "query": options.query || {}
    };
  }

  /**
   *@param {string} collection collection to be used for query
   *@param {object} query query object which contains body(filter query), fields, limit, skip, sort fields
   *@returns {Q.Promise} returns promise for read query
   */
  read({collection, query}) {

    let options = [];

    options.push(query.body);
    options.push(this.readQuery(query));

    return this.dbConnection_
      .then(db => {
        return Q.npost(
          db.collection(collection), "find", options
        )
          .then(cursor => {
            return Q.ninvoke(cursor, "toArray"
            )
              .then(results => {
                return results;
              });
          });
      });
  }

  /**
   *@param {string} collection collection to be used for query
   *@param {object} query query object which contains body(filter query), fields, limit, skip, sort fields
   *@returns {Q.Promise} returns promise for read query
   */
  readCount({collection, query}) {

    let options = [];

    options.push(query.body);
    options.push(this.readQuery(query));

    return this.dbConnection_
      .then(db => {
        return Q.npost(
          db.collection(collection), "count", options
        )
          .then(count => {
            return count;
          });
      });
  }

  /**
   *@param {string} collection collection to be used for query
   *@param {object} pipeline pipeline to be used in aggregation
   *@returns {Q.Promise} returns promise for aggregation
   */
  aggregate({collection, pipeline}) {

    return this.dbConnection_
      .then(db => {
        return Q.ninvoke(
          db.collection(collection),
          "aggregate",
          pipeline
        );
      });
  }

  /**
   *
   * @param {string} collection name.
   * @param {object} object to be inserted into the collections
   * @returns {Q.Promise} returns promise for insertion
   */

  insert({collection, document}) {
    return this.dbConnection_
      .then(db => {
        return Q.ninvoke(db.collection(collection), "insert", document);
      });
  }

  update({collection, query, document}) {
    return this.dbConnection_
      .then(db => {
        return Q.ninvoke(db.collection(collection), "update", query, document);
      });
  }

  getLastUpdatedDate({collection, query, projection}) {
    return this.dbConnection_
      .then(db => {
        return Q.ninvoke(db.collection(collection), "findOne", query, projection);
      });
  }

  /*
   *@param {function} map map function for map reduce
   *@param {function} reduce reduce function for map reduce
   *@returns {Q.Promise} returns promise for map reduce output
   */
  mapReduce({collection, map, reduce, options}) {

    let optionsArr = [];

    optionsArr.push(map);
    optionsArr.push(reduce);
    optionsArr.push(this.readMapReduceOptions(options));

    return this.dbConnection_
      .then(db => {
        return Q.npost(
          db.collection(collection), "mapReduce", optionsArr
        );
      });
  }
}

function getMongoDbService(args) {

  /* create mongoconnection object and expose it at the application level */
  protectedDbInstance = protectedDbInstance || new MongoDbService(args);
  return protectedDbInstance;
}

export default getMongoDbService;
